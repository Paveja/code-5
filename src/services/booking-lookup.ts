import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError } from "@/lib/http";

export function lookupBooking(confirmationCode: string, email: string) {
  const [booking] = db
    .select({
      id: schema.bookings.id,
      confirmationCode: schema.bookings.confirmationCode,
      guestName: schema.bookings.guestName,
      guestEmail: schema.bookings.guestEmail,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      guests: schema.bookings.guests,
      totalCents: schema.bookings.totalCents,
      currency: schema.bookings.currency,
      status: schema.bookings.status,
      propertyName: schema.properties.name,
      propertyCity: schema.properties.city,
      roomName: schema.roomTypes.name,
      cancellationPolicy: schema.roomTypes.cancellationPolicy,
      paymentStatus: schema.payments.status,
      providerPaymentId: schema.payments.providerPaymentId,
    })
    .from(schema.bookings)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.bookings.propertyId))
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
  return booking;
}
