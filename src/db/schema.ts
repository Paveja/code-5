import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["guest", "operator"] })
    .notNull()
    .default("guest"),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    region: text("region").notNull(),
    country: text("country").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    imagesJson: text("images_json").notNull(),
    amenitiesJson: text("amenities_json").notNull(),
    rating: integer("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("properties_city_published_idx").on(table.city, table.published)],
);

export const roomTypes = sqliteTable(
  "room_types",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    capacity: integer("capacity").notNull(),
    units: integer("units").notNull(),
    basePriceCents: integer("base_price_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    cancellationPolicy: text("cancellation_policy").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("room_types_property_idx").on(table.propertyId)],
);

export const availability = sqliteTable(
  "availability",
  {
    roomTypeId: text("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    stayDate: text("stay_date").notNull(),
    availableUnits: integer("available_units").notNull(),
    nightlyPriceCents: integer("nightly_price_cents").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomTypeId, table.stayDate] }),
    index("availability_date_idx").on(table.stayDate, table.roomTypeId),
  ],
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    confirmationCode: text("confirmation_code").notNull().unique(),
    userId: text("user_id").references(() => users.id),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    roomTypeId: text("room_type_id")
      .notNull()
      .references(() => roomTypes.id),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone").notNull(),
    checkIn: text("check_in").notNull(),
    checkOut: text("check_out").notNull(),
    guests: integer("guests").notNull(),
    specialRequests: text("special_requests"),
    accountPasswordHash: text("account_password_hash"),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull(),
    status: text("status", {
      enum: ["pending", "confirmed", "cancelled", "expired"],
    }).notNull(),
    holdExpiresAt: text("hold_expires_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("bookings_room_dates_status_idx").on(
      table.roomTypeId,
      table.checkIn,
      table.checkOut,
      table.status,
    ),
    index("bookings_guest_email_idx").on(table.guestEmail, table.createdAt),
    index("bookings_user_created_idx").on(table.userId, table.createdAt),
    index("bookings_status_idx").on(table.status, table.createdAt),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" })
      .unique(),
    providerSessionId: text("provider_session_id").unique(),
    providerPaymentId: text("provider_payment_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("payments_status_idx").on(table.status, table.createdAt)],
);

export const webhookEvents = sqliteTable("webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: text("processed_at").notNull(),
});

export const emailDeliveries = sqliteTable("email_deliveries", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" })
    .unique(),
  recipient: text("recipient").notNull(),
  status: text("status", { enum: ["queued", "sent", "skipped", "failed"] }).notNull(),
  providerReference: text("provider_reference"),
  createdAt: text("created_at").notNull(),
});

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    subjectId: text("subject_id").notNull(),
    detailsJson: text("details_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("audit_subject_time_idx").on(table.subjectId, table.createdAt)],
);
