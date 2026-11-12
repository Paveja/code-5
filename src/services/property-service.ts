import { and, asc, desc, eq, gt, gte, like, lt, min, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { dateRange, nightsBetween } from "@/lib/dates";

export function findProperties(input: {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  sort: "recommended" | "price-low" | "rating";
}) {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const destination = input.destination.trim().replace(/[%_\\]/g, "");
  const conditions = [
    eq(schema.properties.published, true),
    gte(schema.roomTypes.capacity, input.guests),
    gte(schema.availability.stayDate, input.checkIn),
    lt(schema.availability.stayDate, input.checkOut),
    gt(schema.availability.availableUnits, 0),
  ];

  if (destination) {
    const pattern = `%${destination}%`;
    conditions.push(
      or(like(schema.properties.city, pattern), like(schema.properties.region, pattern))!,
    );
  }

  const totalPrice = sum(schema.availability.nightlyPriceCents).as("total_price_cents");
  const query = db
    .select({
      id: schema.properties.id,
      slug: schema.properties.slug,
      name: schema.properties.name,
      city: schema.properties.city,
      region: schema.properties.region,
      country: schema.properties.country,
      imageUrl: schema.properties.imageUrl,
      rating: schema.properties.rating,
      reviewCount: schema.properties.reviewCount,
      amenitiesJson: schema.properties.amenitiesJson,
      roomTypeId: schema.roomTypes.id,
      capacity: schema.roomTypes.capacity,
      cancellationPolicy: schema.roomTypes.cancellationPolicy,
      totalPriceCents: totalPrice,
      availableNights: sql<number>`count(distinct ${schema.availability.stayDate})`,
      minUnits: min(schema.availability.availableUnits),
    })
    .from(schema.properties)
    .innerJoin(schema.roomTypes, eq(schema.roomTypes.propertyId, schema.properties.id))
    .innerJoin(
      schema.availability,
      eq(schema.availability.roomTypeId, schema.roomTypes.id),
    )
    .where(and(...conditions))
    .groupBy(schema.roomTypes.id)
    .having(sql`count(distinct ${schema.availability.stayDate}) = ${nights}`)
    .limit(120)
    .all();

  const byProperty = new Map<string, (typeof query)[number]>();
  for (const room of query) {
    if (room.availableNights !== nights || Number(room.minUnits) < 1) continue;
    const existing = byProperty.get(room.id);
    if (!existing || Number(room.totalPriceCents) < Number(existing.totalPriceCents)) {
      byProperty.set(room.id, room);
    }
  }

  const results = Array.from(byProperty.values());
  if (input.sort === "price-low")
    results.sort((a, b) => Number(a.totalPriceCents) - Number(b.totalPriceCents));
  else if (input.sort === "rating") results.sort((a, b) => b.rating - a.rating);
  else
    results.sort(
      (a, b) =>
        b.rating * Math.log2(b.reviewCount + 2) - a.rating * Math.log2(a.reviewCount + 2),
    );

  return results.slice(0, 24).map((room) => ({
    id: room.id,
    slug: room.slug,
    name: room.name,
    city: room.city,
    region: room.region,
    country: room.country,
    imageUrl: room.imageUrl,
    rating: room.rating,
    reviewCount: room.reviewCount,
    amenitiesJson: room.amenitiesJson,
    roomTypeId: room.roomTypeId,
    capacity: room.capacity,
    cancellationPolicy: room.cancellationPolicy,
    priceCents: Math.round(Number(room.totalPriceCents) / nights),
  }));
}

export function getPublishedProperty(slug: string) {
  const [property] = db
    .select()
    .from(schema.properties)
    .where(and(eq(schema.properties.slug, slug), eq(schema.properties.published, true)))
    .limit(1)
    .all();

  if (!property) return null;

  const rooms = db
    .select()
    .from(schema.roomTypes)
    .where(eq(schema.roomTypes.propertyId, property.id))
    .orderBy(asc(schema.roomTypes.basePriceCents))
    .limit(20)
    .all();

  return { ...property, rooms };
}

export function featuredProperties() {
  return db
    .select({
      id: schema.properties.id,
      slug: schema.properties.slug,
      name: schema.properties.name,
      city: schema.properties.city,
      region: schema.properties.region,
      country: schema.properties.country,
      imageUrl: schema.properties.imageUrl,
      rating: schema.properties.rating,
      reviewCount: schema.properties.reviewCount,
      priceCents: min(schema.roomTypes.basePriceCents),
    })
    .from(schema.properties)
    .innerJoin(schema.roomTypes, eq(schema.roomTypes.propertyId, schema.properties.id))
    .where(eq(schema.properties.published, true))
    .groupBy(schema.properties.id)
    .orderBy(desc(schema.properties.rating))
    .limit(6)
    .all();
}
