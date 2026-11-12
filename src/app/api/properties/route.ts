import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { searchSchema } from "@/lib/validation";
import { expireOldHolds } from "@/services/booking-service";
import { findProperties } from "@/services/property-service";

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const input = searchSchema.parse(params);
    expireOldHolds();
    const properties = findProperties(input);
    return NextResponse.json({ data: properties, meta: { count: properties.length } });
  } catch (error) {
    return apiError(error);
  }
}
