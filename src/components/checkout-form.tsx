"use client";

import { useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";

export function CheckoutForm({
  roomTypeId,
  checkIn,
  checkOut,
  guests,
  unavailable,
}: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  unavailable: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const requestKey = (idempotencyKey.current ??= crypto.randomUUID());

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: JSON.stringify({
          roomTypeId,
          checkIn,
          checkOut,
          guests: Number(formData.get("guests")),
          guestName: formData.get("guestName"),
          guestEmail: formData.get("guestEmail"),
          guestPhone: formData.get("guestPhone"),
          specialRequests: formData.get("specialRequests"),
          createAccount,
          password: createAccount ? formData.get("password") : undefined,
        }),
      });
      const payload: {
        data?: { checkoutUrl?: string };
        error?: { message?: string; fieldErrors?: Record<string, string[] | undefined> };
      } = await response.json();
      if (!response.ok) {
        const fieldError = Object.values(payload.error?.fieldErrors ?? {})
          .flat()
          .find(Boolean);
        throw new Error(
          fieldError ?? payload.error?.message ?? "We couldn’t start secure checkout.",
        );
      }
      if (!payload.data?.checkoutUrl)
        throw new Error("Secure checkout did not return a payment link.");
      window.location.assign(payload.data.checkoutUrl);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn’t start secure checkout. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <form className="form-panel" action={submit}>
      <h2>Who’s coming?</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="guestName">Full name</label>
          <input
            id="guestName"
            name="guestName"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="guestEmail">Email for confirmation</label>
          <input
            id="guestEmail"
            name="guestEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="guestPhone">Phone number</label>
          <input
            id="guestPhone"
            name="guestPhone"
            type="tel"
            autoComplete="tel"
            minLength={7}
            maxLength={30}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="guestCount">Guests</label>
          <select id="guestCount" name="guests" defaultValue={guests}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="specialRequests">
          Anything we should know? <span>(optional)</span>
        </label>
        <textarea
          id="specialRequests"
          name="specialRequests"
          maxLength={500}
          placeholder="A late arrival, an extra pillow…"
        />
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={createAccount}
          onChange={(event) => setCreateAccount(event.target.checked)}
        />
        <span>
          Create an account after your booking, so it’s easier to find next time.
        </span>
      </label>
      {createAccount && (
        <div className="field">
          <label htmlFor="password">Create a password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
            required
          />
          <span className="form-note">
            Use at least 12 characters; longer than 72 bytes is not accepted.
          </span>
        </div>
      )}
      <p className="form-note">
        Free cancellation applies only to the rate shown in your stay snapshot. Review the
        policy before paying.
      </p>
      <button
        className="primary-button full-button"
        type="submit"
        disabled={busy || unavailable}
      >
        {busy ? (
          "Opening secure checkout…"
        ) : (
          <>
            <LockKeyhole size={16} /> Continue to secure payment
          </>
        )}
      </button>
      <p className="form-note">
        Your card details are collected by Stripe and never stored by Stayfinder.
      </p>
    </form>
  );
}
