import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatMoney } from "@/lib/format";
import { SandboxPaymentForm } from "@/components/sandbox-payment-form";

export const metadata: Metadata = { title: "Local test checkout" };

export default async function SandboxPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; code?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { bookingId, code } = await searchParams;
  if (!bookingId || !code) notFound();

  const [booking] = db
    .select({
      id: schema.bookings.id,
      confirmationCode: schema.bookings.confirmationCode,
      propertyId: schema.bookings.propertyId,
      roomTypeId: schema.bookings.roomTypeId,
      totalCents: schema.bookings.totalCents,
      currency: schema.bookings.currency,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      status: schema.bookings.status,
      holdExpiresAt: schema.bookings.holdExpiresAt,
    })
    .from(schema.bookings)
    .where(
      and(eq(schema.bookings.id, bookingId), eq(schema.bookings.confirmationCode, code)),
    )
    .limit(1)
    .all();
  const [payment] = db
    .select({ sessionId: schema.payments.providerSessionId })
    .from(schema.payments)
    .where(eq(schema.payments.bookingId, bookingId))
    .limit(1)
    .all();
  if (!booking || !payment?.sessionId?.startsWith("sandbox_")) notFound();

  const [property] = db
    .select({ name: schema.properties.name, city: schema.properties.city })
    .from(schema.properties)
    .where(eq(schema.properties.id, booking.propertyId))
    .limit(1)
    .all();
  const [room] = db
    .select({ name: schema.roomTypes.name })
    .from(schema.roomTypes)
    .where(eq(schema.roomTypes.id, booking.roomTypeId))
    .limit(1)
    .all();
  const active =
    booking.status === "pending" && booking.holdExpiresAt > new Date().toISOString();

  return (
    <div className="shell page-section">
      <div className="eyebrow">Secure checkout preview</div>
      <h1 className="page-title">Confirm your stay.</h1>
      <p className="page-intro">
        Review your reservation before completing this local test payment.
      </p>
      <div className="checkout-layout">
        {active ? (
          <SandboxPaymentForm
            bookingId={booking.id}
            confirmationCode={booking.confirmationCode}
          />
        ) : (
          <div className="empty-state">
            <h2>This hold has expired</h2>
            <p>Return to the collection and choose new dates.</p>
          </div>
        )}
        <aside className="snapshot-card">
          <div className="eyebrow">Your stay snapshot</div>
          <h2>{property.name}</h2>
          <p className="property-location">
            {room.name} · {property.city}
          </p>
          <div className="snapshot-line">
            <span>Check in</span>
            <strong>{booking.checkIn}</strong>
          </div>
          <div className="snapshot-line">
            <span>Check out</span>
            <strong>{booking.checkOut}</strong>
          </div>
          <div className="price-total">
            <span>Total</span>
            <strong>{formatMoney(booking.totalCents, booking.currency)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
