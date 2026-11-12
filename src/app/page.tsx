import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { PropertyCard } from "@/components/property-card";
import { findProperties, featuredProperties } from "@/services/property-service";
import { searchSchema } from "@/lib/validation";
import { formatDate } from "@/lib/format";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const hasSearch = Boolean(
    params.checkIn || params.checkOut || params.destination || params.guests,
  );
  const parsed = hasSearch ? searchSchema.safeParse(params) : null;
  const properties = parsed?.success ? findProperties(parsed.data) : featuredProperties();
  const query = parsed?.success ? parsed.data : null;
  const sort = typeof params.sort === "string" ? params.sort : "recommended";
  const bookingSearch = query
    ? { checkIn: query.checkIn, checkOut: query.checkOut, guests: query.guests }
    : undefined;

  return (
    <>
      <section className="hero">
        <div className="shell hero-inner">
          <div className="eyebrow">Stays with a little more soul</div>
          <h1 className="display-title">
            Find your kind
            <br />
            of <em>away.</em>
          </h1>
          <p className="hero-copy">
            Thoughtful places, chosen for the way they make a trip feel. Start with a
            place, and see where it takes you.
          </p>
          <SearchForm
            destination={typeof params.destination === "string" ? params.destination : ""}
            checkIn={query?.checkIn}
            checkOut={query?.checkOut}
            guests={query?.guests}
          />
        </div>
      </section>

      <section className="section shell" id="stays">
        {hasSearch ? (
          <>
            <div className="results-top">
              <div className="eyebrow">Your next few nights</div>
              <h2 className="results-title">
                {query
                  ? `Stays near ${query.destination || "your destination"}`
                  : "Check your trip details"}
              </h2>
              {query && (
                <p className="results-meta">
                  {formatDate(query.checkIn)} — {formatDate(query.checkOut)} ·{" "}
                  {query.guests} {query.guests === 1 ? "guest" : "guests"}
                </p>
              )}
            </div>
            {query && (
              <div className="results-bar">
                <span>
                  {properties.length} {properties.length === 1 ? "stay" : "stays"} with
                  availability
                </span>
                <form action="/" method="get" className="sort-field">
                  <input type="hidden" name="destination" value={query.destination} />
                  <input type="hidden" name="checkIn" value={query.checkIn} />
                  <input type="hidden" name="checkOut" value={query.checkOut} />
                  <input type="hidden" name="guests" value={query.guests} />
                  <label htmlFor="sort">Sort by </label>
                  <select id="sort" name="sort" defaultValue={sort}>
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="rating">Guest rating</option>
                  </select>
                  <button className="quiet-button" type="submit">
                    Apply
                  </button>
                </form>
              </div>
            )}
            {!parsed?.success ? (
              <div className="empty-state">
                <Compass size={27} />
                <h2>Let’s check those dates</h2>
                <p>
                  Choose a check-in and check-out date, with check-out after check-in, to
                  see stays that fit your trip.
                </p>
              </div>
            ) : properties.length > 0 ? (
              <div className="property-grid">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={{ ...property, priceCents: Number(property.priceCents) }}
                    search={bookingSearch}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Compass size={27} />
                <h2>No stays on those dates</h2>
                <p>
                  Try nearby dates or a broader destination. A small change can open up a
                  few lovely options.
                </p>
                <Link className="secondary-button" href="/">
                  Start a new search <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <div className="eyebrow">A good place to begin</div>
                <h2>Somewhere worth the journey</h2>
                <p>Distinctive places, and a reason to slow down.</p>
              </div>
              <Link className="text-link" href="#stays">
                Explore the collection <ArrowRight size={15} />
              </Link>
            </div>
            {properties.length > 0 ? (
              <div className="property-grid">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>New places are on the way</h2>
                <p>Our collection is being prepared. Please check back soon.</p>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
