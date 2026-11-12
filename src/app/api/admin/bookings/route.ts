import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth";
import { listOperatorBookings } from "@/services/admin-service";

export async function GET() {
  const operator = await requireOperator();
  if (!operator)
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
      { status: 401 },
    );
  return NextResponse.json({ data: listOperatorBookings() });
}
