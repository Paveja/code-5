import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { updateRoom } from "@/services/admin-service";

const updateSchema = z.object({
  capacity: z.coerce.number().int().min(1).max(12),
  units: z.coerce.number().int().min(1).max(100),
  basePriceCents: z.coerce.number().int().min(5000).max(10000000),
});

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
    updateRoom(operator.id, id, updateSchema.parse(await request.json()));
    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    return apiError(error);
  }
}
