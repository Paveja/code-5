import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { clientAddress, rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/validation";
import { createBookingCheckout } from "@/services/booking-service";
import { assertPaymentConfiguration } from "@/services/payment-service";

export async function POST(request: Request) {
  if (!rateLimit(`booking:${clientAddress(request)}`, 8, 60 * 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many booking attempts. Please try again later.",
        },
      },
      { status: 429 },
    );
  }

  try {
    const input = bookingSchema.parse(await request.json());
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return NextResponse.json(
        {
          error: {
            code: "IDEMPOTENCY_KEY_REQUIRED",
            message: "Refresh checkout and try again.",
          },
        },
        { status: 400 },
      );
    }

    assertPaymentConfiguration();
    const result = await createBookingCheckout(input, idempotencyKey);
    if (!result.checkoutUrl) {
      return NextResponse.json(
        {
          error: {
            code: "CHECKOUT_UNAVAILABLE",
            message: "Secure checkout could not start. Please try again.",
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
