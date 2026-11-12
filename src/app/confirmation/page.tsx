import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const metadata: Metadata = { title: "Booking confirmation" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const [booking] = code
    ? db
        .select({
          status: schema.bookings.status,
          emailStatus: schema.emailDeliveries.status,
        })
        .from(schema.bookings)
        .leftJoin(
          schema.emailDeliveries,
          eq(schema.emailDeliveries.bookingId, schema.bookings.id),
        )
        .where(eq(schema.bookings.confirmationCode, code.toUpperCase()))
        .limit(1)
        .all()
    : [];
  const confirmed = booking?.status === "confirmed";
  const emailMessage =
    booking?.emailStatus === "sent"
      ? "We sent your stay details by email. Keep your confirmation code somewhere handy."
      : booking?.emailStatus === "failed"
        ? "Your stay is confirmed, but the email could not be delivered. Keep your confirmation code and contact the Stayfinder team."
        : booking?.emailStatus === "queued"
          ? "Your stay is confirmed. Your confirmation email is on its way. Keep your code somewhere handy."
          : "Your stay is confirmed. Keep your confirmation code; email delivery is not configured for this environment.";

  return (
    <div className="shell">
      <section className="confirmation-wrap">
        <div className="confirmation-mark">
          <Check size={27} />
        </div>
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          {confirmed ? "Your stay is confirmed" : "Payment received"}
        </div>
        <h1>{confirmed ? "It’s all yours." : "We’re confirming your stay."}</h1>
        <p>
          {confirmed
            ? emailMessage
            : "Your payment is being matched to the reservation. This usually takes a moment. Check your booking status using the email and code from checkout."}
        </p>
        {code && <div className="confirmation-code">{code}</div>}
        <p>
          <Link className="primary-button" href="/manage">
            Manage your booking
          </Link>
        </p>
        {!confirmed && (
          <p className="form-note">
            If the status has not updated after a few minutes, contact the Stayfinder team
            with your confirmation code.
          </p>
        )}
      </section>
    </div>
  );
}
