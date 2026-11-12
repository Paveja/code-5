"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export function SandboxPaymentForm({
  bookingId,
  confirmationCode,
}: {
  bookingId: string;
  confirmationCode: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function complete() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/sandbox/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, confirmationCode }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? "Test checkout could not complete.");
      window.location.assign(
        `/confirmation?code=${encodeURIComponent(result.data.confirmationCode)}`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Test checkout could not complete.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="form-panel">
      <div className="sandbox-callout">
        <strong>Local test checkout</strong>
        <span>
          No real payment will be taken. This completes the reservation against the local
          database.
        </span>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary-button full-button"
        type="button"
        onClick={complete}
        disabled={busy}
      >
        <ShieldCheck size={17} />{" "}
        {busy ? "Confirming test reservation…" : "Complete test booking"}
      </button>
      <p className="form-note">
        This sandbox flow is disabled in production. Configure Stripe to accept real
        payments.
      </p>
    </div>
  );
}
