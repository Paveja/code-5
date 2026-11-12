import assert from "node:assert/strict";
import test from "node:test";
import { bookingSchema, searchSchema } from "@/lib/validation";

const booking = {
  roomTypeId: "b688f33e-0c5c-4d93-b0ea-7dbe2eac2eef",
  checkIn: "2026-11-20",
  checkOut: "2026-11-22",
  guests: 2,
  guestName: "Taylor Guest",
  guestEmail: "taylor@example.com",
  guestPhone: "+1 555 010 0021",
  specialRequests: "",
  createAccount: false,
};

test("accepts a valid booking and rejects unsafe booking details", () => {
  assert.equal(bookingSchema.parse(booking).guestEmail, "taylor@example.com");
  assert.equal(
    bookingSchema.safeParse({ ...booking, checkOut: booking.checkIn }).success,
    false,
  );
  assert.equal(bookingSchema.safeParse({ ...booking, guests: 0 }).success, false);
  assert.equal(
    bookingSchema.safeParse({ ...booking, guestEmail: "not-an-email" }).success,
    false,
  );
  assert.equal(
    bookingSchema.safeParse({ ...booking, createAccount: true, password: "short" })
      .success,
    false,
  );
});

test("rejects stays over thirty nights and passwords beyond bcrypt's byte limit", () => {
  const longStay = { checkIn: "2026-11-20", checkOut: "2026-12-21" };
  assert.equal(bookingSchema.safeParse({ ...booking, ...longStay }).success, false);
  assert.equal(
    searchSchema.safeParse({ destination: "Carmel", ...longStay, guests: 2 }).success,
    false,
  );
  assert.equal(
    bookingSchema.safeParse({
      ...booking,
      createAccount: true,
      password: "🔑".repeat(19),
    }).success,
    false,
  );
});

test("rejects a search where checkout does not follow check-in", () => {
  assert.equal(
    searchSchema.safeParse({
      destination: "Carmel",
      checkIn: "2026-11-22",
      checkOut: "2026-11-20",
      guests: "2",
    }).success,
    false,
  );
});
