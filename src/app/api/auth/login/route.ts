import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { clientAddress, rateLimit } from "@/lib/rate-limit";
import { operatorLoginSchema } from "@/lib/validation";
import { authenticateUser } from "@/services/auth-service";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN", message: "Request origin was not accepted." } },
      { status: 403 },
    );
  }
  if (!rateLimit(`login:${clientAddress(request)}`, 5, 15 * 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many sign-in attempts. Please try again later.",
        },
      },
      { status: 429 },
    );
  }

  try {
    const input = operatorLoginSchema.parse(await request.json());
    return NextResponse.json({
      data: await authenticateUser(input.email, input.password),
    });
  } catch (error) {
    return apiError(error);
  }
}
