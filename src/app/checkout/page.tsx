import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatDate, formatMoney } from "@/lib/format";
import { nightsBetween } from "@/lib/dates";
import { CheckoutForm } from "@/components/checkout-form";
import { quoteRoom } from "@/services/booking-service";
import { retrieveCheckoutSession } from "@/services/payment-service";

export const metadata: Metadata = { title: "Complete your booking" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const resumeId = typeof params.resume === "string" ? params.resume : "";
  const confirmationCode =
    typeof params.code === "string" ? params.code.toUpperCase() : "";

  if (resumeId && confirmationCode) {
    const [booking] = db
      .select({
        id: schema.bookings.id,
        confirmationCode: schema.bookings.confirmationCode,
        status: schema.bookings.status,
        checkIn: schema.bookings.checkIn,
        checkOut: schema.bookings.checkOut,
        guests: schema.bookings.guests,
        totalCents: schema.bookings.totalCents,
        currency: schema.bookings.currency,
        holdExpiresAt: schema.bookings.holdExpiresAt,
        propertyName: schema.properties.name,
        propertyImage: schema.properties.imageUrl,
        propertyCity: schema.properties.city,
        roomName: schema.roomTypes.name,
      })
      .from(schema.bookings)
      .innerJoin(schema.properties, eq(schema.properties.id, schema.bookings.propertyId))
      .innerJoin(schema.roomTypes, eq(schema.roomTypes.id, schema.bookings.roomTypeId))
      .where(
        and(
          eq(schema.bookings.id, resumeId),
          eq(schema.bookings.confirmationCode, confirmationCode),
        ),
      )
      .limit(1)
      .all();
    if (!booking) notFound();

    const [payment] = db
      .select({ sessionId: schema.payments.providerSessionId })
      .from(schema.payments)
      .where(eq(schema.payments.bookingId, booking.id))
      .limit(1)
      .all();
    let checkoutUrl: string | null = null;
    const holdActive =
      booking.status === "pending" && booking.holdExpiresAt > new Date().toISOString();
    if (holdActive && payment?.sessionId) {
      try {
        const session = await retrieveCheckoutSession(payment.sessionId);
        checkoutUrl = session.url;
      } catch (error) {
        console.error("Could not retrieve the existing checkout session", error);
      }
    }

    return (
      <div className="shell page-section">
        <div className="eyebrow">Your stay is still here</div>
        <h1 className="page-title">Pick up where you left off.</h1>
        <p className="page-intro">
          Your dates and rate are held for a short time. Continue with the original
          reservation rather than starting over.
        </p>
        <div className="checkout-layout">
          <section className="form-panel">
            {booking.status === "confirmed" ? (
              <>
                <h2>Your stay is confirmed</h2>
                <p>Payment has already completed for this reservation.</p>
                <Link
                  className="primary-button"
                  href={`/confirmation?code=${booking.confirmationCode}`}
                >
                  View confirmation
                </Link>
              </>
            ) : holdActive && checkoutUrl ? (
              <>
                <h2>Continue secure payment</h2>
                <p>
                  Your original payment session is ready. Continue there to complete this
                  reservation.
                </p>
                <a className="primary-button" href={checkoutUrl}>
                  Resume secure payment
                </a>
              </>
            ) : holdActive ? (
              <>
                <h2>Your payment session is unavailable</h2>
                <p>
                  Your reservation is still held briefly. Try retrieving its original
                  payment session again.
                </p>
                <Link
                  className="primary-button"
                  href={`/checkout?resume=${booking.id}&code=${booking.confirmationCode}`}
                >
                  Try again
                </Link>
              </>
            ) : (
              <>
                <h2>This hold is no longer active</h2>
                <p>Search again to check current availability and choose a new rate.</p>
                <Link className="primary-button" href="/">
                  Find a new stay
                </Link>
              </>
            )}
          </section>
          <aside className="snapshot-card">
            <div className="snapshot-photo">
              <Image
                src={booking.propertyImage}
                alt={booking.propertyName}
                fill
                sizes="(max-width: 900px) 100vw, 360px"
              />
            </div>
            <div className="eyebrow">Your stay snapshot</div>
            <h2>{booking.propertyName}</h2>
            <p className="property-location">
              {booking.roomName} · {booking.propertyCity}
            </p>
            <div className="snapshot-line">
              <span>Check in</span>
              <strong>{formatDate(booking.checkIn)}</strong>
            </div>
            <div className="snapshot-line">
              <span>Check out</span>
              <strong>{formatDate(booking.checkOut)}</strong>
            </div>
            <div className="snapshot-line">
              <span>Guests</span>
              <strong>{booking.guests}</strong>
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

  const roomId = typeof params.room === "string" ? params.room : "";
  const [room] = db
    .select()
    .from(schema.roomTypes)
    .where(eq(schema.roomTypes.id, roomId))
    .limit(1)
    .all();
  if (!room) notFound();

  const [property] = db
    .select()
    .from(schema.properties)
    .where(eq(schema.properties.id, room.propertyId))
    .limit(1)
    .all();
  if (!property?.published) notFound();

  const checkIn = typeof params.checkIn === "string" ? params.checkIn : "";
  const checkOut = typeof params.checkOut === "string" ? params.checkOut : "";
  const guestCountValue = typeof params.guests === "string" ? Number(params.guests) : 2;
  const guestCount =
    Number.isInteger(guestCountValue) && guestCountValue >= 1 && guestCountValue <= 12
      ? guestCountValue
      : 2;
  let nights = 0;
  let quoteCents: number | null = null;
  let quoteError = "";

  try {
    nights = nightsBetween(checkIn, checkOut);
    if (guestCount > room.capacity) {
      throw new Error(
        `This room sleeps up to ${room.capacity} guests. Choose a room that fits your party.`,
      );
    }
    quoteCents = quoteRoom(room.id, checkIn, checkOut);
  } catch (error) {
    quoteError =
      error instanceof Error ? error.message : "Choose valid dates to check this room.";
  }

  return (
    <div className="shell page-section">
      <div className="eyebrow">The last step before away</div>
      <h1 className="page-title">Make it yours.</h1>
      <p className="page-intro">
        A few details, then secure payment. Your stay is only confirmed after payment
        completes.
      </p>
      <div className="checkout-layout">
        <CheckoutForm
          roomTypeId={room.id}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guestCount}
          unavailable={!quoteCents}
        />
        <aside className="snapshot-card">
          <div className="snapshot-photo">
            <Image
              src={property.imageUrl}
              alt={property.name}
              fill
              sizes="(max-width: 900px) 100vw, 360px"
            />
          </div>
          <div className="eyebrow">Your stay snapshot</div>
          <h2>{property.name}</h2>
          <p className="property-location">
            {room.name} · {property.city}
          </p>
          {nights > 0 && quoteCents !== null ? (
            <>
              <div className="snapshot-line">
                <span>Check in</span>
                <strong>{formatDate(checkIn)}</strong>
              </div>
              <div className="snapshot-line">
                <span>Check out</span>
                <strong>{formatDate(checkOut)}</strong>
              </div>
              <div className="snapshot-line">
                <span>Duration</span>
                <strong>
                  {nights} {nights === 1 ? "night" : "nights"}
                </strong>
              </div>
              <div className="snapshot-line">
                <span>Guests</span>
                <strong>{guestCount}</strong>
              </div>
              <div className="snapshot-line">
                <span>Cancellation</span>
                <strong>
                  {room.cancellationPolicy === "free-cancellation"
                    ? "Free until 72 hours before"
                    : "Non-refundable"}
                </strong>
              </div>
              <div className="price-total">
                <span>Total for {nights} nights</span>
                <strong>{formatMoney(quoteCents, room.currency)}</strong>
              </div>
            </>
          ) : (
            <p className="form-error" role="alert">
              {quoteError ||
                "Choose valid check-in and check-out dates to see your total."}
            </p>
          )}
          <p className="form-note">
            Pricing is calculated for your exact dates and rechecked before payment.
          </p>
        </aside>
      </div>
    </div>
  );
}
