import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError } from "@/lib/http";
import { dateRange } from "@/lib/dates";
import { stripeClient } from "@/services/payment-service";

export async function cancelBooking(confirmationCode: string, email: string) {
  const [booking] = db
    .select({
      id: schema.bookings.id,
      roomTypeId: schema.bookings.roomTypeId,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      status: schema.bookings.status,
      policy: schema.roomTypes.cancellationPolicy,
      paymentIntentId: schema.payments.providerPaymentId,
      idempotencyKey: schema.payments.idempotencyKey,
    })
    .from(schema.bookings)
    .innerJoin(schema.roomTypes, eq(schema.roomTypes.id, schema.bookings.roomTypeId))
    .leftJoin(schema.payments, eq(schema.payments.bookingId, schema.bookings.id))
    .where(
      and(
        eq(schema.bookings.confirmationCode, confirmationCode.toUpperCase()),
        eq(schema.bookings.guestEmail, email.toLowerCase()),
      ),
    )
    .limit(1)
    .all();

  if (!booking)
    throw new ApiError("No booking matched those details.", 404, "BOOKING_NOT_FOUND");
  if (booking.status !== "confirmed")
    throw new ApiError(
      "Only confirmed bookings can be cancelled.",
      409,
      "BOOKING_NOT_CANCELLABLE",
    );
  if (booking.policy !== "free-cancellation")
    throw new ApiError(
      "This rate is non-refundable and cannot be cancelled online.",
      409,
      "RATE_NON_REFUNDABLE",
    );

  const deadline =
    new Date(`${booking.checkIn}T00:00:00Z`).getTime() - 72 * 60 * 60 * 1000;
  if (Date.now() > deadline)
    throw new ApiError(
      "Free cancellation ended 72 hours before check-in.",
      409,
      "CANCELLATION_WINDOW_CLOSED",
    );
  if (!booking.paymentIntentId)
    throw new ApiError(
      "Payment details are not available for this booking.",
      409,
      "PAYMENT_REFERENCE_MISSING",
    );

  let refundStatus: "succeeded" | "pending";
  if (booking.paymentIntentId.startsWith("sandbox_")) {
    refundStatus = "succeeded";
  } else {
    const refund = await stripeClient().refunds.create(
      { payment_intent: booking.paymentIntentId },
      { idempotencyKey: `refund-${booking.idempotencyKey}` },
    );
    if (refund.status !== "succeeded" && refund.status !== "pending") {
      throw new ApiError(
        "The refund could not be completed. Please contact support.",
        502,
        "REFUND_FAILED",
      );
    }
    refundStatus = refund.status;
  }

  const dates = dateRange(booking.checkIn, booking.checkOut);
  const updatedAt = new Date().toISOString();
  db.transaction((tx) => {
    const updated = tx
      .update(schema.bookings)
      .set({ status: "cancelled", updatedAt })
      .where(
        and(eq(schema.bookings.id, booking.id), eq(schema.bookings.status, "confirmed")),
      )
      .returning({ id: schema.bookings.id })
      .all();
    if (updated.length === 0) return;

    tx.update(schema.availability)
      .set({ availableUnits: sql`${schema.availability.availableUnits} + 1` })
      .where(
        and(
          eq(schema.availability.roomTypeId, booking.roomTypeId),
          inArray(schema.availability.stayDate, dates),
        ),
      )
      .run();
    tx.update(schema.payments)
      .set({ status: "refunded", updatedAt })
      .where(eq(schema.payments.bookingId, booking.id))
      .run();
  });

  return { status: "cancelled", refundStatus };
}
