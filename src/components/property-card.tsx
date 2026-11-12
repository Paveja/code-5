import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { formatMoney } from "@/lib/format";

type PropertyCardData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  priceCents: number | null;
  amenitiesJson?: string;
};

type SearchContext = { checkIn: string; checkOut: string; guests: number } | undefined;

export function PropertyCard({
  property,
  search,
}: {
  property: PropertyCardData;
  search?: SearchContext;
}) {
  const amenities = property.amenitiesJson
    ? (JSON.parse(property.amenitiesJson) as string[])
    : [];
  const suffix = search
    ? `?${new URLSearchParams({ ...search, guests: String(search.guests) })}`
    : "";
  const href = `/stays/${property.slug}${suffix}`;

  return (
    <article className="property-card">
      <Link href={href} aria-label={`View ${property.name} in ${property.city}`}>
        <div className="property-image">
          <Image
            src={property.imageUrl}
            alt={`${property.name}, ${property.city}`}
            fill
            sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
          />
          <span className="image-tag">
            {property.reviewCount > 0 ? "Sample listing" : "New listing"}
          </span>
        </div>
      </Link>
      <div className="property-info">
        <div className="property-topline">
          <h3 className="property-name">
            <Link href={href}>{property.name}</Link>
          </h3>
          {property.reviewCount > 0 ? (
            <span className="property-rating">
              <Star size={13} fill="currentColor" /> {(property.rating / 10).toFixed(1)}
            </span>
          ) : (
            <span className="property-rating">New</span>
          )}
        </div>
        <p className="property-location">
          {property.city}, {property.region} ·{" "}
          {property.reviewCount > 0
            ? `${property.reviewCount} sample guest notes`
            : "No guest reviews yet"}
        </p>
        <div>
          {amenities.slice(0, 3).map((amenity) => (
            <span className="property-amenity" key={amenity}>
              {amenity}
            </span>
          ))}
        </div>
        <div className="price-line">
          <strong>
            {property.priceCents ? formatMoney(property.priceCents) : "See room rates"}
          </strong>
          <span> / night</span>
          <small>
            Explore <ArrowUpRight size={12} />
          </small>
        </div>
      </div>
    </article>
  );
}
