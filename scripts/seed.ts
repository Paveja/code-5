import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

const properties = [
  {
    slug: "harbor-house-carmel",
    name: "Harbor House",
    city: "Carmel-by-the-Sea",
    region: "California",
    country: "United States",
    description:
      "A quiet coastal hideaway with salt-air mornings, hand-finished interiors, and the Pacific just beyond the garden gate.",
    imageUrl:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1500&q=85",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85",
    ],
    amenities: ["Ocean view", "Breakfast", "Garden", "Free parking", "Wi-Fi"],
    rating: 98,
    reviewCount: 128,
    room: {
      name: "Ocean Terrace Suite",
      description: "King bed · Private terrace · Breakfast included",
      capacity: 2,
      units: 3,
      price: 42500,
      policy: "free-cancellation",
    },
  },
  {
    slug: "cedar-coast-big-sur",
    name: "Cedar & Coast",
    city: "Big Sur",
    region: "California",
    country: "United States",
    description:
      "Tucked among redwoods above the shoreline, this considered retreat is made for long walks, slow dinners, and looking up.",
    imageUrl:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1500&q=85",
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85",
    ],
    amenities: ["Redwood forest", "Fireplace", "Restaurant", "Hiking trails", "Wi-Fi"],
    rating: 97,
    reviewCount: 86,
    room: {
      name: "Redwood Cabin",
      description: "Queen bed · Wood-burning fireplace · Forest deck",
      capacity: 2,
      units: 4,
      price: 36800,
      policy: "free-cancellation",
    },
  },
  {
    slug: "sunroom-lodge-sedona",
    name: "Sunroom Lodge",
    city: "Sedona",
    region: "Arizona",
    country: "United States",
    description:
      "Desert light spills across a small collection of suites, framed by red-rock country and an open-air pool.",
    imageUrl:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1500&q=85",
    images: [
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1500&q=85",
    ],
    amenities: ["Pool", "Mountain view", "Spa", "Yoga deck", "Free parking"],
    rating: 96,
    reviewCount: 214,
    room: {
      name: "Red Rock King Suite",
      description: "King bed · Patio · Breakfast included",
      capacity: 2,
      units: 5,
      price: 28900,
      policy: "free-cancellation",
    },
  },
  {
    slug: "the-fielding-hudson",
    name: "The Fielding",
    city: "Hudson",
    region: "New York",
    country: "United States",
    description:
      "A lovingly restored country inn with a welcoming kitchen, leafy grounds, and a front porch made for a second cup.",
    imageUrl:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1500&q=85",
    images: [
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85",
    ],
    amenities: ["Garden", "Restaurant", "Breakfast", "Pet friendly", "Wi-Fi"],
    rating: 95,
    reviewCount: 73,
    room: {
      name: "Garden Room",
      description: "Queen bed · Garden outlook · Breakfast included",
      capacity: 2,
      units: 4,
      price: 24500,
      policy: "free-cancellation",
    },
  },
  {
    slug: "alder-retreat-bend",
    name: "Alder Retreat",
    city: "Bend",
    region: "Oregon",
    country: "United States",
    description:
      "A thoughtfully simple base for mountain days, with a cedar sauna and a fireside lounge waiting when you return.",
    imageUrl:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1500&q=85",
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1500&q=85",
    ],
    amenities: ["Sauna", "Mountain bikes", "Fireplace", "Free parking", "Wi-Fi"],
    rating: 98,
    reviewCount: 102,
    room: {
      name: "Alpine King Room",
      description: "King bed · Private balcony · Sauna access",
      capacity: 2,
      units: 3,
      price: 31500,
      policy: "free-cancellation",
    },
  },
  {
    slug: "casa-de-sol-santa-fe",
    name: "Casa de Sol",
    city: "Santa Fe",
    region: "New Mexico",
    country: "United States",
    description:
      "An adobe courtyard house where art, warm earth, and generous New Mexican hospitality come together.",
    imageUrl:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85",
    images: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1500&q=85",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85",
    ],
    amenities: ["Courtyard", "Art collection", "Breakfast", "Spa", "Free parking"],
    rating: 97,
    reviewCount: 156,
    room: {
      name: "Courtyard King Suite",
      description: "King bed · Kiva fireplace · Private patio",
      capacity: 2,
      units: 3,
      price: 33900,
      policy: "free-cancellation",
    },
  },
];

const now = new Date().toISOString();
const propertyRows = properties.map((property) => ({
  id: randomUUID(),
  ...property,
  imagesJson: JSON.stringify(property.images),
  amenitiesJson: JSON.stringify(property.amenities),
  published: true,
  createdAt: now,
  updatedAt: now,
}));

const existing = db
  .select({ id: schema.properties.id })
  .from(schema.properties)
  .limit(1)
  .all();
if (existing.length === 0) {
  db.insert(schema.properties)
    .values(
      propertyRows.map(
        ({ room: _room, images: _images, amenities: _amenities, ...row }) => row,
      ),
    )
    .run();

  const roomRows = propertyRows.map((property) => ({
    id: randomUUID(),
    propertyId: property.id,
    name: property.room.name,
    description: property.room.description,
    capacity: property.room.capacity,
    units: property.room.units,
    basePriceCents: property.room.price,
    currency: "usd",
    cancellationPolicy: property.room.policy,
    createdAt: now,
  }));
  db.insert(schema.roomTypes).values(roomRows).run();

  const dailyRows: Array<{
    roomTypeId: string;
    stayDate: string;
    availableUnits: number;
    nightlyPriceCents: number;
  }> = [];
  for (const [index, room] of roomRows.entries()) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    for (let day = 0; day < 365; day += 1) {
      const stayDate = new Date(start.getTime() + day * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const weekendBump = [5, 6].includes(new Date(`${stayDate}T00:00:00Z`).getUTCDay())
        ? 2500
        : 0;
      dailyRows.push({
        roomTypeId: room.id,
        stayDate,
        availableUnits: room.units,
        nightlyPriceCents: room.basePriceCents + weekendBump + (index % 3) * 1500,
      });
    }
  }

  for (let start = 0; start < dailyRows.length; start += 400) {
    db.insert(schema.availability)
      .values(dailyRows.slice(start, start + 400))
      .run();
  }
}

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  if (
    process.env.ADMIN_PASSWORD.length < 12 ||
    Buffer.byteLength(process.env.ADMIN_PASSWORD, "utf8") > 72
  ) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 12 characters and no more than 72 bytes.",
    );
  }

  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const [operator] = db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
    .all();
  if (!operator) {
    db.insert(schema.users)
      .values({
        id: randomUUID(),
        email,
        name: "Stayfinder Operations",
        passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
        role: "operator",
        createdAt: now,
      })
      .run();
  } else if (operator.role !== "operator") {
    db.update(schema.users)
      .set({
        role: "operator",
        passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
      })
      .where(eq(schema.users.id, operator.id))
      .run();
  }
}

console.info("Database seed complete.");
