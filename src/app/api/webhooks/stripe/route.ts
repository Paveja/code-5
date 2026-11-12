import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { formatMoney } from "@/lib/format";
import { sendConfirmationEmail, stripeClient } from "@/services/payment-service";
import { releaseBooking } from "@/services/booking-service";

async function deliverConfirmation(bookingId: string) {
  const [delivery] = db
    .select({ id: schema.emailDeliveries.id, status: schema.emailDeliveries.status })
    .from(schema.emailDeliveries)
    .where(eq(schema.emailDeliveries.bookingId, bookingId))
    .limit(1)
    .all();
  if (!delivery || delivery.status === "sent" || delivery.status === "skipped") return;

  const [booking] = db
    .select({
      id: schema.bookings.id,
      confirmationCode: schema.bookings.confirmationCode,
      guestName: schema.bookings.guestName,
      guestEmail: schema.bookings.guestEmail,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      totalCents: schema.bookings.totalCents,
      currency: schema.bookings.currency,
      propertyName: schema.properties.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.bookings.propertyId))
    .where(eq(schema.bookings.id, bookingId))
    .limit(1)
    .all();
  if (!booking) throw new Error("Confirmed booking not found for its email delivery.");

  try {
    const result = await sendConfirmationEmail({
      ...booking,
      totalText: formatMoney(booking.totalCents, booking.currency),
    });
    db.update(schema.emailDeliveries)
      .set({ status: result.status, providerReference: result.providerReference })
      .where(eq(schema.emailDeliveries.id, delivery.id))
      .run();
  } catch (error) {
    db.update(schema.emailDeliveries)
      .set({ status: "failed" })
      .where(eq(schema.emailDeliveries.id, delivery.id))
      .run();
    throw error;
  }
}

function recordWebhook(event: Stripe.Event) {
  db.insert(schema.webhookEvents)
    .values({
      id: event.id,
      eventType: event.type,
      processedAt: new Date().toISOString(),
    })
    .onConflictDoNothing()
    .run();
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Webhook verification is not configured." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripeClient().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.expired"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId || session.mode !== "payment") {
    return NextResponse.json(
      { error: "Checkout session has no valid booking reference." },
      { status: 400 },
    );
  }

  const [payment] = db
    .select({ sessionId: schema.payments.providerSessionId })
    .from(schema.payments)
    .where(eq(schema.payments.bookingId, bookingId))
    .limit(1)
    .all();
  if (!payment || payment.sessionId !== session.id) {
    return NextResponse.json(
      { error: "Checkout session does not match the reservation." },
      { status: 409 },
    );
  }

  const [priorEvent] = db
    .select({ id: schema.webhookEvents.id })
    .from(schema.webhookEvents)
    .where(eq(schema.webhookEvents.id, event.id))
    .limit(1)
    .all();

  if (event.type === "checkout.session.expired") {
    if (!priorEvent) {
      releaseBooking(bookingId, "expired");
      recordWebhook(event);
    }
    return NextResponse.json({ received: true });
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment has not completed." }, { status: 409 });
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  if (
    !paymentIntentId ||
    session.amount_total === null ||
    session.amount_total === undefined
  ) {
    return NextResponse.json(
      { error: "Paid session is missing payment details." },
      { status: 409 },
    );
  }

  let shouldRefund = false;
  let shouldDeliver = false;
  let missingBooking = false;
  let paymentMismatch = false;

  db.transaction((tx) => {
    const [alreadyProcessed] = tx
      .select({ id: schema.webhookEvents.id })
      .from(schema.webhookEvents)
      .where(eq(schema.webhookEvents.id, event.id))
      .limit(1)
      .all();
    const [booking] = tx
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, bookingId))
      .limit(1)
      .all();
    const [storedPayment] = tx
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.bookingId, bookingId))
      .limit(1)
      .all();

    if (!booking) {
      missingBooking = true;
      return;
    }
    if (
      !storedPayment ||
      storedPayment.providerSessionId !== session.id ||
      storedPayment.amountCents !== session.amount_total ||
      storedPayment.currency !== session.currency?.toLowerCase()
    ) {
      paymentMismatch = true;
      return;
    }

    if (booking.status === "confirmed") {
      shouldDeliver = true;
      if (!alreadyProcessed) {
        tx.insert(schema.webhookEvents)
          .values({
            id: event.id,
            eventType: event.type,
            processedAt: new Date().toISOString(),
          })
          .onConflictDoNothing()
          .run();
      }
      return;
    }

    if (alreadyProcessed) return;
    if (
      booking.status !== "pending" ||
      booking.holdExpiresAt <= new Date().toISOString()
    ) {
      shouldRefund = true;
      return;
    }

    const now = new Date().toISOString();
    tx.update(schema.bookings)
      .set({ status: "confirmed", updatedAt: now })
      .where(
        and(eq(schema.bookings.id, bookingId), eq(schema.bookings.status, "pending")),
      )
      .run();
    tx.update(schema.payments)
      .set({ status: "paid", providerPaymentId: paymentIntentId, updatedAt: now })
      .where(eq(schema.payments.bookingId, bookingId))
      .run();

    if (booking.accountPasswordHash) {
      const [createdUser] = tx
        .insert(schema.users)
        .values({
          id: randomUUID(),
          email: booking.guestEmail,
          name: booking.guestName,
          passwordHash: booking.accountPasswordHash,
          role: "guest",
          createdAt: now,
        })
        .onConflictDoNothing()
        .returning({ id: schema.users.id })
        .all();
      const [existingUser] = createdUser
        ? []
        : tx
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, booking.guestEmail))
            .limit(1)
            .all();
      tx.update(schema.bookings)
        .set({
          userId: createdUser?.id ?? existingUser?.id ?? null,
          accountPasswordHash: null,
        })
        .where(eq(schema.bookings.id, bookingId))
        .run();
    }

    tx.insert(schema.emailDeliveries)
      .values({
        id: `${booking.id}-confirmation`,
        bookingId: booking.id,
        recipient: booking.guestEmail,
        status: "queued",
        providerReference: null,
        createdAt: now,
      })
      .onConflictDoNothing()
      .run();
    tx.insert(schema.webhookEvents)
      .values({ id: event.id, eventType: event.type, processedAt: now })
      .onConflictDoNothing()
      .run();
    shouldDeliver = true;
  });

  if (missingBooking)
    return NextResponse.json(
      { error: "Booking reference was not found." },
      { status: 404 },
    );
  if (paymentMismatch)
    return NextResponse.json(
      { error: "Paid session does not match the reservation amount." },
      { status: 409 },
    );

  if (shouldRefund) {
    try {
      await stripeClient().refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey: `expired-booking-${bookingId}` },
      );
      releaseBooking(bookingId, "expired");
      db.update(schema.payments)
        .set({ status: "refunded", updatedAt: new Date().toISOString() })
        .where(eq(schema.payments.bookingId, bookingId))
        .run();
      recordWebhook(event);
      return NextResponse.json({ received: true, refunded: true });
    } catch (error) {
      console.error("Late booking payment refund failed", error);
      return NextResponse.json(
        { error: "Payment refund could not be completed; Stripe may retry." },
        { status: 500 },
      );
    }
  }

  if (shouldDeliver) {
    try {
      await deliverConfirmation(bookingId);
    } catch (error) {
      console.error("Booking confirmation email delivery failed", error);
      return NextResponse.json(
        { error: "Confirmation delivery failed; Stripe may retry." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
