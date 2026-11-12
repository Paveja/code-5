import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN", message: "Request origin was not accepted." } },
      { status: 403 },
    );
  }

  await clearSession();
  return NextResponse.json({ data: { signedOut: true } });
}
