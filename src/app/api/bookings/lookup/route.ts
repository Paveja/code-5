import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { clientAddress, rateLimit } from "@/lib/rate-limit";
import { bookingLookupSchema } from "@/lib/validation";
import { lookupBooking } from "@/services/booking-lookup";

export async function POST(request: Request) {
  if (!rateLimit(`lookup:${clientAddress(request)}`, 10, 15 * 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many lookups. Please try again later.",
        },
      },
      { status: 429 },
    );
  }

  try {
    const input = bookingLookupSchema.parse(await request.json());
    const { providerPaymentId: _providerPaymentId, ...booking } = lookupBooking(
      input.confirmationCode,
      input.email,
    );
    return NextResponse.json({ data: booking });
  } catch (error) {
    return apiError(error);
  }
}
