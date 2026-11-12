import { randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { apiError, ApiError } from "@/lib/http";
import { sendConfirmationEmail } from "@/services/payment-service";
import { formatMoney } from "@/lib/format";
import { z } from "zod";

const inputSchema = z.object({
  bookingId: z.uuid(),
  confirmationCode: z.string().length(32),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found." } },
      { status: 404 },
    );
  }
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN", message: "Request origin was not accepted." } },
      { status: 403 },
    );
  }

  try {
    const { bookingId, confirmationCode } = inputSchema.parse(await request.json());
    const result = db.transaction((tx) => {
      const [booking] = tx
        .select()
        .from(schema.bookings)
        .where(
          and(
            eq(schema.bookings.id, bookingId),
            eq(schema.bookings.confirmationCode, confirmationCode),
          ),
        )
        .limit(1)
        .all();
      const [payment] = tx
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.bookingId, bookingId))
        .limit(1)
        .all();

      if (!booking || !payment || !payment.providerSessionId?.startsWith("sandbox_")) {
        throw new ApiError(
          "Test checkout could not be found.",
          404,
          "CHECKOUT_NOT_FOUND",
        );
      }
      if (booking.status === "confirmed") return { booking, alreadyConfirmed: true };
      if (
        booking.status !== "pending" ||
        booking.holdExpiresAt <= new Date().toISOString()
      ) {
        throw new ApiError(
          "This reservation hold has expired. Please search again.",
          409,
          "HOLD_EXPIRED",
        );
      }

      const now = new Date().toISOString();
      tx.update(schema.bookings)
        .set({ status: "confirmed", updatedAt: now })
        .where(eq(schema.bookings.id, bookingId))
        .run();
      tx.update(schema.payments)
        .set({
          status: "paid",
          providerPaymentId: `sandbox_${bookingId}`,
          updatedAt: now,
        })
        .where(eq(schema.payments.bookingId, bookingId))
        .run();

      if (booking.accountPasswordHash) {
        const [createdUser] = tx
          .insert(schema.users)
          .values({
            id: randomUUID(),
            email: booking.guestEmail,
            name: booking.guestName,
            passwordHash: booking.accountPasswordHash,
            role: "guest",
            createdAt: now,
          })
          .onConflictDoNothing()
          .returning({ id: schema.users.id })
          .all();
        const [existingUser] = createdUser
          ? []
          : tx
              .select({ id: schema.users.id })
              .from(schema.users)
              .where(eq(schema.users.email, booking.guestEmail))
              .limit(1)
              .all();
        tx.update(schema.bookings)
          .set({
            userId: createdUser?.id ?? existingUser?.id ?? null,
            accountPasswordHash: null,
          })
          .where(eq(schema.bookings.id, bookingId))
          .run();
      }

      tx.insert(schema.emailDeliveries)
        .values({
          id: `${bookingId}-confirmation`,
          bookingId,
          recipient: booking.guestEmail,
          status: "queued",
          providerReference: null,
          createdAt: now,
        })
        .onConflictDoNothing()
        .run();
      return { booking, alreadyConfirmed: false };
    });

    const [property] = db
      .select({ name: schema.properties.name })
      .from(schema.properties)
      .where(eq(schema.properties.id, result.booking.propertyId))
      .limit(1)
      .all();
    try {
      const emailResult = await sendConfirmationEmail({
        bookingId,
        confirmationCode: result.booking.confirmationCode,
        guestName: result.booking.guestName,
        guestEmail: result.booking.guestEmail,
        propertyName: property.name,
        checkIn: result.booking.checkIn,
        checkOut: result.booking.checkOut,
        totalText: formatMoney(result.booking.totalCents, result.booking.currency),
      });
      db.update(schema.emailDeliveries)
        .set({
          status: emailResult.status,
          providerReference: emailResult.providerReference,
        })
        .where(eq(schema.emailDeliveries.bookingId, bookingId))
        .run();
    } catch (error) {
      db.update(schema.emailDeliveries)
        .set({ status: "failed" })
        .where(eq(schema.emailDeliveries.bookingId, bookingId))
        .run();
      console.error("Sandbox booking confirmation email delivery failed", error);
    }

    return NextResponse.json({
      data: { confirmationCode: result.booking.confirmationCode, confirmed: true },
    });
  } catch (error) {
    return apiError(error);
  }
}
