"use client";

import { useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";

type Booking = {
  id: string;
  confirmationCode: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalCents: number;
  currency: string;
  status: string;
  propertyName: string;
  propertyCity: string;
  roomName: string;
  cancellationPolicy: string;
  paymentStatus: string | null;
};

export function BookingLookupForm() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function request(path: string, code: string, email: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationCode: code, email }),
    });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error?.message ?? "We couldn’t find that booking.");
    return payload.data;
  }

  async function lookup(formData: FormData) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request(
        "/api/bookings/lookup",
        String(formData.get("confirmationCode")),
        String(formData.get("email")),
      );
      setBooking(result);
    } catch (cause) {
      setBooking(null);
      setError(cause instanceof Error ? cause.message : "We couldn’t find that booking.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (
      !booking ||
      !window.confirm(
        "Cancel this booking? Your refund will be returned to the original payment method.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const email = (document.getElementById("lookupEmail") as HTMLInputElement).value;
      await request(
        `/api/bookings/${encodeURIComponent(booking.confirmationCode)}/cancel`,
        booking.confirmationCode,
        email,
      );
      setNotice("Your booking has been cancelled and the refund has been initiated.");
      setBooking({ ...booking, status: "cancelled", paymentStatus: "refunded" });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "We couldn’t cancel this booking.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="lookup-panel" action={lookup}>
        <div className="field">
          <label htmlFor="confirmationCode">Confirmation code</label>
          <input
            id="confirmationCode"
            name="confirmationCode"
            autoCapitalize="characters"
            minLength={32}
            maxLength={32}
            pattern="[A-Fa-f0-9]{32}"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="lookupEmail">Booking email</label>
          <input
            id="lookupEmail"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="form-note" role="status">
            {notice}
          </p>
        )}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Find my booking"}
        </button>
      </form>
      {booking && (
        <section className="booking-result" aria-live="polite">
          <span className={`status-pill ${booking.status}`}>{booking.status}</span>
          <h2>{booking.propertyName}</h2>
          <p className="property-location">
            {booking.roomName} · {booking.propertyCity}
          </p>
          <div className="booking-result-grid">
            <div>
              <span>Confirmation</span>
              <strong>{booking.confirmationCode}</strong>
            </div>
            <div>
              <span>Dates</span>
              <strong>
                {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
              </strong>
            </div>
            <div>
              <span>Guests</span>
              <strong>{booking.guests}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatMoney(booking.totalCents, booking.currency)}</strong>
            </div>
          </div>
          {booking.status === "confirmed" &&
            booking.cancellationPolicy === "free-cancellation" && (
              <button
                className="secondary-button"
                type="button"
                onClick={cancel}
                disabled={busy}
              >
                Cancel booking
              </button>
            )}
          {booking.status === "pending" && (
            <p className="form-note">
              Payment is being confirmed. Refresh in a moment to see the latest status.
            </p>
          )}
        </section>
      )}
    </>
  );
}
