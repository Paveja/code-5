"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

type Property = {
  id: string;
  name: string;
  city: string;
  region: string;
  published: boolean;
  roomCount: number;
  startingPrice: number | null;
  inventory: number | null;
};
type Room = {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  capacity: number;
  units: number;
  basePriceCents: number;
  cancellationPolicy: string;
};
type Booking = {
  id: string;
  confirmationCode: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalCents: number;
  currency: string;
  status: string;
  propertyName: string;
  paymentStatus: string | null;
  emailStatus: string | null;
  createdAt: string;
};
type AdminTab = "properties" | "rooms" | "bookings";

export function AdminDashboard({
  properties,
  rooms,
  bookings,
  bookingPage,
  bookingPageCount,
  bookingTotal,
  initialTab,
  operatorName,
}: {
  properties: Property[];
  rooms: Room[];
  bookings: Booking[];
  bookingPage: number;
  bookingPageCount: number;
  bookingTotal: number;
  initialTab: AdminTab;
  operatorName: string;
}) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(url: string, method: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? "The change could not be saved.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved.");
      setBusy(false);
    }
  }

  async function create(formData: FormData) {
    await save("/api/admin/properties", "POST", {
      name: formData.get("name"),
      city: formData.get("city"),
      region: formData.get("region"),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
      roomName: formData.get("roomName"),
      capacity: Number(formData.get("capacity")),
      units: Number(formData.get("units")),
      basePriceCents: Math.round(Number(formData.get("price")) * 100),
      published: false,
    });
  }

  function updateProperty(property: Property) {
    const name = (
      document.getElementById(`property-name-${property.id}`) as HTMLInputElement
    ).value;
    const city = (
      document.getElementById(`property-city-${property.id}`) as HTMLInputElement
    ).value;
    const region = (
      document.getElementById(`property-region-${property.id}`) as HTMLInputElement
    ).value;
    return save(`/api/admin/properties/${property.id}`, "PATCH", { name, city, region });
  }

  function updateRoom(room: Room) {
    const capacity = Number(
      (document.getElementById(`capacity-${room.id}`) as HTMLInputElement).value,
    );
    const units = Number(
      (document.getElementById(`units-${room.id}`) as HTMLInputElement).value,
    );
    const basePriceCents = Math.round(
      Number((document.getElementById(`price-${room.id}`) as HTMLInputElement).value) *
        100,
    );
    return save(`/api/admin/rooms/${room.id}`, "PATCH", {
      capacity,
      units,
      basePriceCents,
    });
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      window.location.assign("/");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not sign out. Please try again.",
      );
      setBusy(false);
    }
  }

  const start = bookingTotal === 0 ? 0 : (bookingPage - 1) * 50 + 1;
  const end = Math.min(bookingPage * 50, bookingTotal);

  return (
    <div>
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Stayfinder operations</div>
          <h1>Good to see you, {operatorName}.</h1>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={signOut}
          disabled={busy}
        >
          Sign out
        </button>
      </div>

      <div className="admin-tabs" role="group" aria-label="Operations sections">
        <button
          type="button"
          aria-pressed={tab === "properties"}
          onClick={() => setTab("properties")}
        >
          Properties ({properties.length})
        </button>
        <button
          type="button"
          aria-pressed={tab === "rooms"}
          onClick={() => setTab("rooms")}
        >
          Rooms & rates ({rooms.length})
        </button>
        <button
          type="button"
          aria-pressed={tab === "bookings"}
          onClick={() => setTab("bookings")}
        >
          Bookings ({bookingTotal})
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert" style={{ margin: "16px 0" }}>
          {error}
        </p>
      )}

      {tab === "properties" && (
        <>
          <section className="admin-table-wrap" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Property details</th>
                  <th>Rooms</th>
                  <th>Inventory</th>
                  <th>From / night</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td className="property-edit-cell">
                      <input
                        aria-label={`${property.name} name`}
                        className="admin-input property-edit-input"
                        id={`property-name-${property.id}`}
                        defaultValue={property.name}
                      />
                      <div className="property-edit-location">
                        <input
                          aria-label={`${property.name} city`}
                          className="admin-input property-edit-input"
                          id={`property-city-${property.id}`}
                          defaultValue={property.city}
                        />
                        <input
                          aria-label={`${property.name} region`}
                          className="admin-input property-edit-input"
                          id={`property-region-${property.id}`}
                          defaultValue={property.region}
                        />
                      </div>
                    </td>
                    <td>{property.roomCount}</td>
                    <td>{property.inventory ?? 0} rooms</td>
                    <td>
                      {property.startingPrice ? formatMoney(property.startingPrice) : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${property.published ? "" : "pending"}`}
                      >
                        {property.published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={busy}
                        onClick={() => updateProperty(property)}
                      >
                        Save
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          save(`/api/admin/properties/${property.id}`, "PATCH", {
                            published: !property.published,
                          })
                        }
                      >
                        {property.published ? "Unpublish" : "Publish"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <details className="form-panel" style={{ marginTop: 20 }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              Add a property
            </summary>
            <form action={create} className="form-grid" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="new-name">Property name</label>
                <input id="new-name" name="name" required minLength={3} maxLength={120} />
              </div>
              <div className="field">
                <label htmlFor="new-city">City</label>
                <input id="new-city" name="city" required />
              </div>
              <div className="field">
                <label htmlFor="new-region">State or region</label>
                <input id="new-region" name="region" required />
              </div>
              <div className="field">
                <label htmlFor="new-room">Room type</label>
                <input id="new-room" name="roomName" defaultValue="King room" required />
              </div>
              <div className="field">
                <label htmlFor="new-price">Starting nightly rate (USD)</label>
                <input
                  id="new-price"
                  name="price"
                  type="number"
                  min="50"
                  step="1"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="new-capacity">Room capacity</label>
                <input
                  id="new-capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="2"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="new-units">Available rooms</label>
                <input
                  id="new-units"
                  name="units"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue="2"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="new-image">Image URL (images.unsplash.com)</label>
                <input id="new-image" name="imageUrl" type="url" required />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="new-description">Description</label>
                <textarea
                  id="new-description"
                  name="description"
                  minLength={20}
                  required
                />
              </div>
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create draft property"}
              </button>
            </form>
          </details>
        </>
      )}

      {tab === "rooms" && (
        <section className="admin-table-wrap" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property / room</th>
                <th>Capacity</th>
                <th>Units</th>
                <th>Rate / night</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <strong>{room.propertyName}</strong>
                    {room.name}
                  </td>
                  <td>
                    <input
                      aria-label={`${room.name} capacity`}
                      className="admin-input"
                      type="number"
                      min="1"
                      max="12"
                      defaultValue={room.capacity}
                      id={`capacity-${room.id}`}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${room.name} inventory`}
                      className="admin-input"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue={room.units}
                      id={`units-${room.id}`}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${room.name} nightly rate`}
                      className="admin-input"
                      type="number"
                      min="50"
                      step="1"
                      defaultValue={room.basePriceCents / 100}
                      id={`price-${room.id}`}
                    />
                  </td>
                  <td>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={busy}
                      onClick={() => updateRoom(room)}
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && <p className="empty-state">No room types yet.</p>}
        </section>
      )}

      {tab === "bookings" && (
        <>
          <section className="admin-table-wrap" style={{ marginTop: 16 }}>
            {bookings.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Stay</th>
                    <th>Dates</th>
                    <th>Guests</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <strong>{booking.guestName}</strong>
                        {booking.guestEmail}
                        <span>{booking.confirmationCode}</span>
                      </td>
                      <td>{booking.propertyName}</td>
                      <td>
                        {booking.checkIn} — {booking.checkOut}
                      </td>
                      <td>{booking.guests}</td>
                      <td>{formatMoney(booking.totalCents, booking.currency)}</td>
                      <td>{booking.paymentStatus ?? "—"}</td>
                      <td>{booking.emailStatus ?? "—"}</td>
                      <td>
                        <span className={`status-pill ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">
                No bookings yet. New reservations will appear here.
              </p>
            )}
          </section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 16,
            }}
          >
            <p className="form-note">
              Showing {start}–{end} of {bookingTotal} bookings
            </p>
            <nav
              aria-label="Booking pages"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {bookingPage > 1 ? (
                <Link
                  className="secondary-button"
                  href={`/admin?tab=bookings&page=${bookingPage - 1}`}
                >
                  Previous
                </Link>
              ) : (
                <span className="secondary-button" aria-disabled="true">
                  Previous
                </span>
              )}
              <span aria-current="page">
                {bookingPage} of {bookingPageCount}
              </span>
              {bookingPage < bookingPageCount ? (
                <Link
                  className="secondary-button"
                  href={`/admin?tab=bookings&page=${bookingPage + 1}`}
                >
                  Next
                </Link>
              ) : (
                <span className="secondary-button" aria-disabled="true">
                  Next
                </span>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
