import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Your stays" };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/account/login");
  if (user.role === "operator") redirect("/admin");

  const stays = db
    .select({
      id: schema.bookings.id,
      confirmationCode: schema.bookings.confirmationCode,
      checkIn: schema.bookings.checkIn,
      checkOut: schema.bookings.checkOut,
      totalCents: schema.bookings.totalCents,
      currency: schema.bookings.currency,
      status: schema.bookings.status,
      propertyName: schema.properties.name,
      city: schema.properties.city,
    })
    .from(schema.bookings)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.bookings.propertyId))
    .where(
      and(
        eq(schema.bookings.userId, user.id),
        eq(schema.bookings.guestEmail, user.email),
      ),
    )
    .orderBy(desc(schema.bookings.createdAt))
    .limit(50)
    .all();

  return (
    <div className="shell page-section">
      <div className="eyebrow">Your journey, in one place</div>
      <h1 className="page-title">Hello, {user.name.split(" ")[0]}.</h1>
      <p className="page-intro">Your stays and their details, ready when you are.</p>
      {stays.length ? (
        <div className="room-list">
          {stays.map((stay) => (
            <article className="room-option" key={stay.id}>
              <div>
                <h2>{stay.propertyName}</h2>
                <p>
                  {stay.city} · {formatDate(stay.checkIn)} — {formatDate(stay.checkOut)}
                </p>
                <span className="property-amenity">
                  Confirmation {stay.confirmationCode}
                </span>
              </div>
              <div className="room-price">
                <strong>{formatMoney(stay.totalCents, stay.currency)}</strong>
                <span className={`status-pill ${stay.status}`}>{stay.status}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No bookings yet</h2>
          <p>When you reserve a stay with this account, it will be waiting here.</p>
        </div>
      )}
    </div>
  );
}
