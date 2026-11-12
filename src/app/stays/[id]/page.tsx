import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Star } from "lucide-react";
import { getPublishedProperty } from "@/services/property-service";
import { formatMoney } from "@/lib/format";
import { SearchForm } from "@/components/search-form";
import { searchSchema } from "@/lib/validation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = getPublishedProperty(id);
  return { title: property?.name ?? "Stay" };
}

function defaultDate(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export default async function StayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const property = getPublishedProperty(id);
  if (!property) notFound();

  const images = JSON.parse(property.imagesJson) as string[];
  const amenities = JSON.parse(property.amenitiesJson) as string[];
  const requestedStay = searchSchema.safeParse({
    destination: property.city,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    guests: query.guests,
  });
  const useRequestedStay =
    requestedStay.success && requestedStay.data.checkIn >= defaultDate(0);
  const checkIn = useRequestedStay ? requestedStay.data.checkIn : defaultDate(14);
  const checkOut = useRequestedStay ? requestedStay.data.checkOut : defaultDate(17);
  const guests = useRequestedStay ? requestedStay.data.guests : 2;
  const visibleRooms = property.rooms.filter((room) => room.capacity >= guests);
  const checkoutParams = new URLSearchParams({
    checkIn,
    checkOut,
    guests: String(guests),
  });
  const checkoutSuffix = `&${checkoutParams.toString()}`;

  return (
    <div className="shell">
      <div className="detail-hero">
        <Link className="text-link" href="/">
          <ArrowLeft size={15} /> Back to stays
        </Link>
        <div className="detail-heading">
          <div>
            <div className="eyebrow">A place to settle in</div>
            <h1>{property.name}</h1>
            <p className="detail-location">
              <MapPin size={14} /> {property.city}, {property.region}, {property.country}
            </p>
          </div>
          {property.reviewCount > 0 ? (
            <div className="detail-rating">
              <Star size={14} fill="currentColor" /> {(property.rating / 10).toFixed(1)}{" "}
              <span>· {property.reviewCount} sample guest notes</span>
            </div>
          ) : (
            <div className="detail-rating">New listing · No guest reviews yet</div>
          )}
        </div>
        <div className="gallery">
          <div className="gallery-main">
            <Image
              src={images[0] ?? property.imageUrl}
              alt={`${property.name} exterior`}
              fill
              priority
              sizes="(max-width: 620px) 100vw, 50vw"
            />
          </div>
          {images.slice(1, 3).map((image, index) => (
            <div className="gallery-side" key={image}>
              <Image
                src={image}
                alt={`${property.name} view ${index + 2}`}
                fill
                sizes="(max-width: 620px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-copy">
          <div className="eyebrow">The feeling of the place</div>
          <h2>A stay with room to breathe</h2>
          <p className="detail-description">{property.description}</p>
          <h2>Thoughtful details</h2>
          <ul className="amenity-list">
            {amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
          <section className="room-section">
            <h2>Choose your room</h2>
            <p className="page-intro">
              Rates include all nights. Your exact total and cancellation terms are shown
              before secure payment.
            </p>
            {visibleRooms.length ? (
              <div className="room-list">
                {visibleRooms.map((room) => (
                  <article className="room-option" key={room.id}>
                    <div>
                      <h3>{room.name}</h3>
                      <p>{room.description}</p>
                      <span className="policy-note">
                        {room.cancellationPolicy === "free-cancellation"
                          ? "Free cancellation up to 72 hours before check-in"
                          : "Non-refundable rate"}
                      </span>
                    </div>
                    <div className="room-price">
                      <strong>{formatMoney(room.basePriceCents)}</strong>
                      <span> / night · sleeps {room.capacity}</span>
                      <Link
                        className="primary-button"
                        href={`/checkout?room=${room.id}${checkoutSuffix}`}
                        aria-label={`Book ${room.name}`}
                      >
                        <span>Choose room</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No rooms for {guests} guests</h3>
                <p>Choose fewer guests to see rooms that fit.</p>
              </div>
            )}
          </section>
        </div>
        <aside className="booking-aside">
          <h3>Your dates, your pace</h3>
          <p>Check availability and make this stay yours.</p>
          <div style={{ marginTop: 18 }}>
            <SearchForm
              compact
              action="/"
              destination={property.city}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
          </div>
          <div className="snapshot-line">
            <span>Thoughtful promise</span>
            <strong>Clear total before you pay</strong>
          </div>
          <div className="snapshot-line">
            <span>Confirmation</span>
            <strong>Instant after payment</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
