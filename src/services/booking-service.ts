import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, gte, inArray, lt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";
import { BOOKING_HOLD_MINUTES } from "@/lib/constants";
import { dateRange, nightsBetween } from "@/lib/dates";
import { ApiError } from "@/lib/http";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
} from "@/services/payment-service";
import type { z } from "zod";
import type { bookingSchema } from "@/lib/validation";

type BookingInput = z.infer<typeof bookingSchema>;

type CheckoutDetails = {
  bookingId: string;
  confirmationCode: string;
  guestEmail: string;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalCents: number;
  currency: string;
  idempotencyKey: string;
};

export function quoteRoom(roomTypeId: string, checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut);
  const dates = dateRange(checkIn, checkOut);
  const rows = db
    .select({
      stayDate: schema.availability.stayDate,
      price: schema.availability.nightlyPriceCents,
      units: schema.availability.availableUnits,
    })
    .from(schema.availability)
    .where(
      and(
        eq(schema.availability.roomTypeId, roomTypeId),
        gte(schema.availability.stayDate, checkIn),
        lt(schema.availability.stayDate, checkOut),
      ),
    )
    .limit(31)
    .all();

  if (
    rows.length !== nights ||
    rows.some((row) => row.units < 1) ||
    rows.length !== dates.length
  ) {
    throw new ApiError(
      "Those dates are no longer available for this room.",
      409,
      "INVENTORY_UNAVAILABLE",
    );
  }

  return rows.reduce((total, row) => total + row.price, 0);
}

async function startProviderCheckout(details: CheckoutDetails) {
  const session = await createCheckoutSession(details);
  if (!session.url)
    throw new Error("Payment provider did not return a hosted checkout URL.");

  db.update(schema.payments)
    .set({ providerSessionId: session.id, updatedAt: new Date().toISOString() })
    .where(eq(schema.payments.bookingId, details.bookingId))
    .run();
  return session.url;
}

export async function createBookingCheckout(input: BookingInput, idempotencyKey: string) {
  const dates = dateRange(input.checkIn, input.checkOut);
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const email = input.guestEmail.toLowerCase();
  const [prior] = db
    .select({
      id: schema.bookings.id,
      confirmationCode: schema.bookings.confirmationCode,
      status: schema.bookings.status,
      providerSessionId: schema.payments.providerSessionId,
      paymentStatus: schema.payments.status,
      roomTypeId: schema.bookings.roomTypeId,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      guests: schema.bookings.guests,
      guestName: schema.bookings.guestName,
      guestEmail: schema.bookings.guestEmail,
      guestPhone: schema.bookings.guestPhone,
      totalCents: schema.bookings.totalCents,
      currency: schema.bookings.currency,
      propertyName: schema.properties.name,
      roomName: schema.roomTypes.name,
    })
    .from(schema.payments)
    .innerJoin(schema.bookings, eq(schema.bookings.id, schema.payments.bookingId))
    .innerJoin(schema.properties, eq(schema.properties.id, schema.bookings.propertyId))
    .innerJoin(schema.roomTypes, eq(schema.roomTypes.id, schema.bookings.roomTypeId))
    .where(eq(schema.payments.idempotencyKey, idempotencyKey))
    .limit(1)
    .all();

  if (prior) {
    const matches =
      prior.roomTypeId === input.roomTypeId &&
      prior.checkIn === input.checkIn &&
      prior.checkOut === input.checkOut &&
      prior.guests === input.guests &&
      prior.guestName === input.guestName &&
      prior.guestEmail === email &&
      prior.guestPhone === input.guestPhone;
    if (!matches)
      throw new ApiError(
        "This checkout retry does not match the original booking details.",
        409,
        "IDEMPOTENCY_CONFLICT",
      );
    if (prior.status === "confirmed") {
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      return {
        checkoutUrl: `${appUrl}/confirmation?code=${encodeURIComponent(prior.confirmationCode)}`,
        confirmationCode: prior.confirmationCode,
      };
    }
    if (prior.status !== "pending" || prior.paymentStatus !== "pending") {
      throw new ApiError(
        "This reservation hold has expired. Please search again.",
        409,
        "HOLD_EXPIRED",
      );
    }
    if (prior.providerSessionId) {
      const session = await retrieveCheckoutSession(prior.providerSessionId);
      if (session.url)
        return { checkoutUrl: session.url, confirmationCode: prior.confirmationCode };
    }
    if (prior.id) {
      const [booking] = db
        .select({ holdExpiresAt: schema.bookings.holdExpiresAt })
        .from(schema.bookings)
        .where(eq(schema.bookings.id, prior.id))
        .limit(1)
        .all();
      if (!booking || booking.holdExpiresAt <= new Date().toISOString()) {
        throw new ApiError(
          "This reservation hold has expired. Please search again.",
          409,
          "HOLD_EXPIRED",
        );
      }
      const checkoutUrl = await startProviderCheckout({
        bookingId: prior.id,
        confirmationCode: prior.confirmationCode,
        guestEmail: email,
        propertyName: prior.propertyName,
        roomName: prior.roomName,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        totalCents: prior.totalCents,
        currency: prior.currency,
        idempotencyKey,
      });
      return { checkoutUrl, confirmationCode: prior.confirmationCode };
    }
  }

  let accountPasswordHash: string | null = null;
  if (input.createAccount) {
    const [existing] = db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
      .all();
    if (existing)
      throw new ApiError(
        "An account already uses this email. Sign in or continue without an account.",
        409,
        "EMAIL_IN_USE",
      );
    accountPasswordHash = await bcrypt.hash(input.password!, 12);
  }

  const bookingId = randomUUID();
  const confirmationCode = randomBytes(16).toString("hex").toUpperCase();
  const now = new Date().toISOString();
  const holdExpiresAt = new Date(
    Date.now() + (BOOKING_HOLD_MINUTES + 5) * 60_000,
  ).toISOString();

  const reservation = db.transaction((tx) => {
    const [room] = tx
      .select({
        id: schema.roomTypes.id,
        propertyId: schema.roomTypes.propertyId,
        name: schema.roomTypes.name,
        capacity: schema.roomTypes.capacity,
        currency: schema.roomTypes.currency,
      })
      .from(schema.roomTypes)
      .innerJoin(schema.properties, eq(schema.properties.id, schema.roomTypes.propertyId))
      .where(
        and(
          eq(schema.roomTypes.id, input.roomTypeId),
          eq(schema.properties.published, true),
        ),
      )
      .limit(1)
      .all();

    if (!room)
      throw new ApiError("That room is no longer available.", 404, "ROOM_NOT_FOUND");
    if (input.guests > room.capacity)
      throw new ApiError(
        "Guest count exceeds this room's capacity.",
        400,
        "CAPACITY_EXCEEDED",
      );

    const nightly = tx
      .select({
        price: schema.availability.nightlyPriceCents,
        units: schema.availability.availableUnits,
      })
      .from(schema.availability)
      .where(
        and(
          eq(schema.availability.roomTypeId, room.id),
          inArray(schema.availability.stayDate, dates),
        ),
      )
      .all();
    if (nightly.length !== nights || nightly.some((night) => night.units < 1)) {
      throw new ApiError(
        "Those dates were just taken. Please choose new dates.",
        409,
        "INVENTORY_UNAVAILABLE",
      );
    }

    const totalCents = nightly.reduce((total, night) => total + night.price, 0);
    const reserved = tx
      .update(schema.availability)
      .set({ availableUnits: sql`${schema.availability.availableUnits} - 1` })
      .where(
        and(
          eq(schema.availability.roomTypeId, room.id),
          inArray(schema.availability.stayDate, dates),
          gt(schema.availability.availableUnits, 0),
        ),
      )
      .returning({ stayDate: schema.availability.stayDate })
      .all();
    if (reserved.length !== nights)
      throw new ApiError(
        "Those dates were just taken. Please choose new dates.",
        409,
        "INVENTORY_UNAVAILABLE",
      );

    tx.insert(schema.bookings)
      .values({
        id: bookingId,
        confirmationCode,
        propertyId: room.propertyId,
        roomTypeId: room.id,
        guestName: input.guestName,
        guestEmail: email,
        guestPhone: input.guestPhone,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        specialRequests: input.specialRequests || null,
        accountPasswordHash,
        totalCents,
        currency: room.currency,
        status: "pending",
        holdExpiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.insert(schema.payments)
      .values({
        id: randomUUID(),
        bookingId,
        providerSessionId: null,
        providerPaymentId: null,
        idempotencyKey,
        status: "pending",
        amountCents: totalCents,
        currency: room.currency,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const [property] = tx
      .select({ name: schema.properties.name })
      .from(schema.properties)
      .where(eq(schema.properties.id, room.propertyId))
      .limit(1)
      .all();
    return {
      roomName: room.name,
      propertyName: property.name,
      totalCents,
      currency: room.currency,
    };
  });

  const checkoutUrl = await startProviderCheckout({
    bookingId,
    confirmationCode,
    guestEmail: email,
    propertyName: reservation.propertyName,
    roomName: reservation.roomName,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    totalCents: reservation.totalCents,
    currency: reservation.currency,
    idempotencyKey,
  });
  return { checkoutUrl, confirmationCode };
}

export function releaseBooking(bookingId: string, status: "expired") {
  const now = new Date().toISOString();
  db.transaction((tx) => {
    const [booking] = tx
      .select()
      .from(schema.bookings)
      .where(
        and(eq(schema.bookings.id, bookingId), eq(schema.bookings.status, "pending")),
      )
      .limit(1)
      .all();
    if (!booking) return;

    tx.update(schema.availability)
      .set({ availableUnits: sql`${schema.availability.availableUnits} + 1` })
      .where(
        and(
          eq(schema.availability.roomTypeId, booking.roomTypeId),
          inArray(
            schema.availability.stayDate,
            dateRange(booking.checkIn, booking.checkOut),
          ),
        ),
      )
      .run();
    tx.update(schema.bookings)
      .set({ status, accountPasswordHash: null, updatedAt: now })
      .where(eq(schema.bookings.id, bookingId))
      .run();
    tx.update(schema.payments)
      .set({ status: "failed", updatedAt: now })
      .where(eq(schema.payments.bookingId, bookingId))
      .run();
  });
}

export function expireOldHolds() {
  const now = new Date().toISOString();
  db.transaction((tx) => {
    const expired = tx
      .select({
        id: schema.bookings.id,
        roomTypeId: schema.bookings.roomTypeId,
        checkIn: schema.bookings.checkIn,
        checkOut: schema.bookings.checkOut,
      })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.status, "pending"),
          lt(schema.bookings.holdExpiresAt, now),
        ),
      )
      .limit(100)
      .all();
    if (expired.length === 0) return;

    const quantities = new Map<string, Map<string, number>>();
    for (const booking of expired) {
      const byDate = quantities.get(booking.roomTypeId) ?? new Map<string, number>();
      for (const date of dateRange(booking.checkIn, booking.checkOut)) {
        byDate.set(date, (byDate.get(date) ?? 0) + 1);
      }
      quantities.set(booking.roomTypeId, byDate);
    }

    for (const [roomTypeId, byDate] of quantities) {
      const cases = Array.from(
        byDate,
        ([date, count]) => sql`when ${date} then ${count}`,
      );
      tx.update(schema.availability)
        .set({
          availableUnits: sql`${schema.availability.availableUnits} + case ${schema.availability.stayDate} ${sql.join(cases, sql` `)} else 0 end`,
        })
        .where(
          and(
            eq(schema.availability.roomTypeId, roomTypeId),
            inArray(schema.availability.stayDate, Array.from(byDate.keys())),
          ),
        )
        .run();
    }

    const ids = expired.map((booking) => booking.id);
    tx.update(schema.bookings)
      .set({ status: "expired", accountPasswordHash: null, updatedAt: now })
      .where(and(inArray(schema.bookings.id, ids), eq(schema.bookings.status, "pending")))
      .run();
    tx.update(schema.payments)
      .set({ status: "failed", updatedAt: now })
      .where(inArray(schema.payments.bookingId, ids))
      .run();
  });
}
