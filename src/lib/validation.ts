import { z } from "zod";

const isoDate = z.iso.date();
const accountPassword = z
  .string()
  .min(12)
  .max(72)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password must be no more than 72 bytes.",
  );
const loginPassword = z
  .string()
  .min(1)
  .max(72)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password must be no more than 72 bytes.",
  );

function isBookableStay(checkIn: string, checkOut: string) {
  const nights =
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) /
    86_400_000;
  return Number.isInteger(nights) && nights >= 1 && nights <= 30;
}

export const searchSchema = z
  .object({
    destination: z.string().trim().max(100).optional().default(""),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int().min(1).max(12),
    sort: z.enum(["recommended", "price-low", "rating"]).default("recommended"),
  })
  .refine((value) => isBookableStay(value.checkIn, value.checkOut), {
    path: ["checkOut"],
    message: "Choose a stay between one and thirty nights.",
  });

export const bookingSchema = z
  .object({
    roomTypeId: z.string().uuid(),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int().min(1).max(12),
    guestName: z.string().trim().min(2).max(100),
    guestEmail: z.email().trim().max(254),
    guestPhone: z.string().trim().min(7).max(30),
    specialRequests: z.string().trim().max(500).optional().default(""),
    createAccount: z.boolean().default(false),
    password: accountPassword.optional(),
  })
  .refine((value) => isBookableStay(value.checkIn, value.checkOut), {
    path: ["checkOut"],
    message: "Choose a stay between one and thirty nights.",
  })
  .refine((value) => !value.createAccount || Boolean(value.password), {
    path: ["password"],
    message: "Choose a password to create an account.",
  });

export const bookingLookupSchema = z.object({
  confirmationCode: z
    .string()
    .trim()
    .regex(/^[A-Fa-f0-9]{32}$/, "Enter the 32-character confirmation code."),
  email: z.email().trim().max(254),
});

export const operatorLoginSchema = z.object({
  email: z.email().trim().max(254),
  password: loginPassword,
});

export const propertyInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  published: z.boolean(),
});
