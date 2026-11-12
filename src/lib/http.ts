import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: { code: "INVALID_JSON", message: "The request body must be valid JSON." },
      },
      { status: 400 },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the highlighted details and try again.",
          fieldErrors: error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Unexpected request failure", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    },
    { status: 500 },
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}
