import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listOperatorProperties, createProperty } from "@/services/admin-service";

const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  description: z.string().trim().min(20).max(1000),
  imageUrl: z.url().refine((value) => {
    const imageUrl = new URL(value);
    return imageUrl.protocol === "https:" && imageUrl.hostname === "images.unsplash.com";
  }, "Choose a supported HTTPS property image."),
  roomName: z.string().trim().min(3).max(100),
  capacity: z.coerce.number().int().min(1).max(12),
  units: z.coerce.number().int().min(1).max(100),
  basePriceCents: z.coerce.number().int().min(5000).max(10000000),
  published: z.boolean().default(false),
});

export async function GET() {
  const operator = await requireOperator();
  if (!operator)
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
      { status: 401 },
    );
  return NextResponse.json({ data: listOperatorProperties() });
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (!operator)
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
      { status: 401 },
    );
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN", message: "Request origin was not accepted." } },
      { status: 403 },
    );

  try {
    const input = createSchema.parse(await request.json());
    return NextResponse.json(
      { data: createProperty(operator.id, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}
