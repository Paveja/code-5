import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { clientAddress, rateLimit } from "@/lib/rate-limit";
import { bookingLookupSchema } from "@/lib/validation";
import { cancelBooking } from "@/services/cancellation-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!rateLimit(`cancel:${clientAddress(request)}`, 5, 60 * 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many cancellation attempts. Please try again later.",
        },
      },
      { status: 429 },
    );
  }

  try {
    const { id } = await context.params;
    const body = bookingLookupSchema.parse({
      ...(await request.json()),
      confirmationCode: id,
    });
    return NextResponse.json({
      data: await cancelBooking(body.confirmationCode, body.email),
    });
  } catch (error) {
    return apiError(error);
  }
}
