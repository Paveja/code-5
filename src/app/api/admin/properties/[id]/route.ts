import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { updateProperty } from "@/services/admin-service";

const updateSchema = z
  .object({
    name: z.string().trim().min(3).max(120).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    region: z.string().trim().min(2).max(100).optional(),
    published: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one property field.",
  );

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (!operator)
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
      { status: 401 },
    );
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN", message: "Request origin was not accepted." } },
      { status: 403 },
    );

  try {
    const { id } = await context.params;
    updateProperty(id, operator.id, updateSchema.parse(await request.json()));
    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    return apiError(error);
  }
}
