import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { db, schema } from "@/db";
import { ApiError } from "@/lib/http";

export function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Online payments are not configured.");
  return new Stripe(secret);
}

function applicationUrl() {
  const configured = process.env.APP_URL;
  const value =
    configured ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!value)
    throw new ApiError("Secure checkout is not configured.", 503, "PAYMENT_UNAVAILABLE");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError("Secure checkout is not configured.", 503, "PAYMENT_UNAVAILABLE");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new ApiError(
      "Secure checkout requires an HTTPS application URL.",
      503,
      "PAYMENT_UNAVAILABLE",
    );
  }
  return value.replace(/\/$/, "");
}

export function assertPaymentConfiguration() {
  if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY) {
    throw new ApiError(
      "Secure checkout is temporarily unavailable.",
      503,
      "PAYMENT_UNAVAILABLE",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
  ) {
    throw new ApiError(
      "Booking confirmation email is not configured.",
      503,
      "EMAIL_UNAVAILABLE",
    );
  }
  applicationUrl();
}

export async function createCheckoutSession(input: {
  bookingId: string;
  confirmationCode: string;
  guestEmail: string;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalCents: number;
  currency: string;
  idempotencyKey: string;
}) {
  const baseUrl = applicationUrl();
  if (!process.env.STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(
        "Secure checkout is temporarily unavailable.",
        503,
        "PAYMENT_UNAVAILABLE",
      );
    }
    const query = new URLSearchParams({
      bookingId: input.bookingId,
      code: input.confirmationCode,
    });
    return {
      id: `sandbox_${input.bookingId}`,
      url: `${baseUrl}/sandbox-payment?${query.toString()}`,
    };
  }

  const [booking] = db
    .select({
      roomTypeId: schema.bookings.roomTypeId,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      guests: schema.bookings.guests,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.id, input.bookingId))
    .limit(1)
    .all();
  if (!booking)
    throw new ApiError("Reservation was not found.", 404, "BOOKING_NOT_FOUND");
  const cancelParams = new URLSearchParams({
    room: booking.roomTypeId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: String(booking.guests),
    cancelled: "1",
    resume: input.bookingId,
    code: input.confirmationCode,
  });

  return stripeClient().checkout.sessions.create(
    {
      mode: "payment",
      submit_type: "book",
      payment_method_types: ["card"],
      customer_email: input.guestEmail,
      client_reference_id: input.bookingId,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${baseUrl}/confirmation?code=${encodeURIComponent(input.confirmationCode)}`,
      cancel_url: `${baseUrl}/checkout?${cancelParams.toString()}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency || DEFAULT_CURRENCY,
            unit_amount: input.totalCents,
            product_data: {
              name: `${input.propertyName} · ${input.roomName}`,
              description: `${input.checkIn} to ${input.checkOut}`,
            },
          },
        },
      ],
      metadata: { bookingId: input.bookingId },
      payment_intent_data: { metadata: { bookingId: input.bookingId } },
    },
    { idempotencyKey: input.idempotencyKey },
  );
}

export async function retrieveCheckoutSession(sessionId: string) {
  if (sessionId.startsWith("sandbox_")) {
    const bookingId = sessionId.slice("sandbox_".length);
    const [booking] = db
      .select({ confirmationCode: schema.bookings.confirmationCode })
      .from(schema.bookings)
      .where(eq(schema.bookings.id, bookingId))
      .limit(1)
      .all();
    if (!booking) throw new Error("Sandbox booking was not found.");
    const query = new URLSearchParams({ bookingId, code: booking.confirmationCode });
    return {
      id: sessionId,
      url: `${applicationUrl()}/sandbox-payment?${query.toString()}`,
    };
  }
  return stripeClient().checkout.sessions.retrieve(sessionId);
}

export async function sendConfirmationEmail(input: {
  bookingId: string;
  confirmationCode: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalText: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_FROM;
  if (!apiKey || !sender) return { status: "skipped" as const, providerReference: null };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `booking-confirmation-${input.bookingId}`,
    },
    body: JSON.stringify({
      from: sender,
      to: [input.guestEmail],
      subject: `Your stay at ${input.propertyName} is confirmed`,
      text: `Hello ${input.guestName}, your stay at ${input.propertyName} is confirmed.\n\nConfirmation code: ${input.confirmationCode}\nCheck-in: ${input.checkIn}\nCheck-out: ${input.checkOut}\nTotal: ${input.totalText}`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Email provider rejected the confirmation (${response.status}): ${detail}`,
    );
  }

  const result = (await response.json()) as { id: string };
  return { status: "sent" as const, providerReference: result.id };
}
