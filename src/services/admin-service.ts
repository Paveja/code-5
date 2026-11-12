import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, gt, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError } from "@/lib/http";

export function listOperatorProperties() {
  return db
    .select({
      id: schema.properties.id,
      name: schema.properties.name,
      city: schema.properties.city,
      region: schema.properties.region,
      published: schema.properties.published,
      roomCount: sql<number>`count(distinct ${schema.roomTypes.id})`,
      startingPrice: sql<number>`min(${schema.roomTypes.basePriceCents})`,
      inventory: sql<number>`sum(${schema.roomTypes.units})`,
    })
    .from(schema.properties)
    .leftJoin(schema.roomTypes, eq(schema.roomTypes.propertyId, schema.properties.id))
    .groupBy(schema.properties.id)
    .orderBy(asc(schema.properties.city))
    .limit(100)
    .all();
}

export function listOperatorRooms() {
  return db
    .select({
      id: schema.roomTypes.id,
      propertyId: schema.roomTypes.propertyId,
      propertyName: schema.properties.name,
      name: schema.roomTypes.name,
      capacity: schema.roomTypes.capacity,
      units: schema.roomTypes.units,
      basePriceCents: schema.roomTypes.basePriceCents,
      cancellationPolicy: schema.roomTypes.cancellationPolicy,
    })
    .from(schema.roomTypes)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.roomTypes.propertyId))
    .orderBy(asc(schema.properties.name))
    .limit(200)
    .all();
}

export function listOperatorBookings(page = 1, pageSize = 50) {
  const [{ total = 0 } = { total: 0 }] = db
    .select({ total: sql<number>`count(*)` })
    .from(schema.bookings)
    .all();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.max(1, Math.min(pageCount, Math.floor(page)));
  const rows = db
    .select({
      id: schema.bookings.id,
      confirmationCode: schema.bookings.confirmationCode,
      guestName: schema.bookings.guestName,
      guestEmail: schema.bookings.guestEmail,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      guests: schema.bookings.guests,
      totalCents: schema.bookings.totalCents,
      currency: schema.bookings.currency,
      status: schema.bookings.status,
      propertyName: schema.properties.name,
      paymentStatus: schema.payments.status,
      emailStatus: schema.emailDeliveries.status,
      createdAt: schema.bookings.createdAt,
    })
    .from(schema.bookings)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.bookings.propertyId))
    .leftJoin(schema.payments, eq(schema.payments.bookingId, schema.bookings.id))
    .leftJoin(
      schema.emailDeliveries,
      eq(schema.emailDeliveries.bookingId, schema.bookings.id),
    )
    .orderBy(desc(schema.bookings.createdAt))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize)
    .all();
  return { rows, currentPage, pageCount, total };
}

export function updateProperty(
  id: string,
  actorUserId: string,
  input: {
    name?: string;
    city?: string;
    region?: string;
    published?: boolean;
  },
) {
  const [existing] = db
    .select({ id: schema.properties.id })
    .from(schema.properties)
    .where(eq(schema.properties.id, id))
    .limit(1)
    .all();
  if (!existing) throw new ApiError("Property not found.", 404, "PROPERTY_NOT_FOUND");

  db.transaction((tx) => {
    const now = new Date().toISOString();
    tx.update(schema.properties)
      .set({ ...input, updatedAt: now })
      .where(eq(schema.properties.id, id))
      .run();
    tx.insert(schema.auditEvents)
      .values({
        id: randomUUID(),
        actorUserId,
        action: "property.updated",
        subjectId: id,
        detailsJson: JSON.stringify(input),
        createdAt: now,
      })
      .run();
  });
}

export function createProperty(
  actorUserId: string,
  input: {
    name: string;
    city: string;
    region: string;
    description: string;
    imageUrl: string;
    roomName: string;
    capacity: number;
    units: number;
    basePriceCents: number;
    published: boolean;
  },
) {
  const id = randomUUID();
  const roomId = randomUUID();
  const now = new Date().toISOString();
  const slugBase = `${input.name}-${input.city}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase}-${id.slice(0, 6)}`;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const days = Array.from({ length: 365 }, (_, index) =>
    new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10),
  );

  db.transaction((tx) => {
    tx.insert(schema.properties)
      .values({
        id,
        slug,
        name: input.name,
        city: input.city,
        region: input.region,
        country: "United States",
        description: input.description,
        imageUrl: input.imageUrl,
        imagesJson: JSON.stringify([input.imageUrl]),
        amenitiesJson: JSON.stringify(["Wi-Fi", "Free parking"]),
        rating: 0,
        reviewCount: 0,
        published: input.published,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.insert(schema.roomTypes)
      .values({
        id: roomId,
        propertyId: id,
        name: input.roomName,
        description: `Sleeps ${input.capacity}`,
        capacity: input.capacity,
        units: input.units,
        basePriceCents: input.basePriceCents,
        currency: "usd",
        cancellationPolicy: "free-cancellation",
        createdAt: now,
      })
      .run();
    const values = days.map((stayDate) => ({
      roomTypeId: roomId,
      stayDate,
      availableUnits: input.units,
      nightlyPriceCents: input.basePriceCents,
    }));
    for (let offset = 0; offset < values.length; offset += 150) {
      tx.insert(schema.availability)
        .values(values.slice(offset, offset + 150))
        .run();
    }
    tx.insert(schema.auditEvents)
      .values({
        id: randomUUID(),
        actorUserId,
        action: "property.created",
        subjectId: id,
        detailsJson: JSON.stringify({ name: input.name, city: input.city }),
        createdAt: now,
      })
      .run();
  });
  return { id, slug };
}

export function updateRoom(
  actorUserId: string,
  roomId: string,
  input: {
    capacity: number;
    units: number;
    basePriceCents: number;
  },
) {
  const today = new Date().toISOString().slice(0, 10);
  db.transaction((tx) => {
    const [room] = tx
      .select()
      .from(schema.roomTypes)
      .where(eq(schema.roomTypes.id, roomId))
      .limit(1)
      .all();
    if (!room) throw new ApiError("Room type not found.", 404, "ROOM_NOT_FOUND");

    const overCapacity = tx
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.roomTypeId, roomId),
          inArray(schema.bookings.status, ["pending", "confirmed"]),
          gt(schema.bookings.checkOut, today),
          gt(schema.bookings.guests, input.capacity),
        ),
      )
      .limit(1)
      .all();
    if (overCapacity.length) {
      throw new ApiError(
        "This room has active reservations with more guests than the new capacity.",
        409,
        "CAPACITY_CONFLICT",
      );
    }

    const days = tx
      .select({
        stayDate: schema.availability.stayDate,
        availableUnits: schema.availability.availableUnits,
      })
      .from(schema.availability)
      .where(
        and(
          eq(schema.availability.roomTypeId, roomId),
          gte(schema.availability.stayDate, today),
        ),
      )
      .limit(366)
      .all();
    const delta = input.units - room.units;
    if (days.some((day) => day.availableUnits + delta < 0)) {
      throw new ApiError(
        "Some future dates already have more reservations than that inventory allows.",
        409,
        "INVENTORY_CONFLICT",
      );
    }

    tx.update(schema.roomTypes)
      .set({
        capacity: input.capacity,
        units: input.units,
        basePriceCents: input.basePriceCents,
      })
      .where(eq(schema.roomTypes.id, roomId))
      .run();
    tx.update(schema.availability)
      .set({
        availableUnits: sql`${schema.availability.availableUnits} + ${delta}`,
        nightlyPriceCents: input.basePriceCents,
      })
      .where(
        and(
          eq(schema.availability.roomTypeId, roomId),
          gte(schema.availability.stayDate, today),
        ),
      )
      .run();
    tx.insert(schema.auditEvents)
      .values({
        id: randomUUID(),
        actorUserId,
        action: "room.updated",
        subjectId: roomId,
        detailsJson: JSON.stringify(input),
        createdAt: new Date().toISOString(),
      })
      .run();
  });
}
