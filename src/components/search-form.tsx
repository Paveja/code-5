import { Search } from "lucide-react";

function dateInput(date: Date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
}

export function SearchForm({
  destination = "",
  checkIn,
  checkOut,
  guests = 2,
  compact = false,
  action = "/",
}: {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  compact?: boolean;
  action?: string;
}) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const defaultIn = new Date(today.getTime() + 14 * 86_400_000);
  const defaultOut = new Date(today.getTime() + 17 * 86_400_000);
  const compactLayout = compact
    ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
    : undefined;
  const compactSpan = compact ? { gridColumn: "span 2" } : undefined;

  return (
    <form
      className={`search-panel${compact ? " search-panel-compact" : ""}`}
      action={action}
      method="get"
      style={compactLayout}
    >
      <div className="field" style={compactSpan}>
        <label htmlFor="destination">Where to</label>
        <input
          id="destination"
          name="destination"
          autoComplete="off"
          placeholder="City or region"
          defaultValue={destination}
        />
      </div>
      <div className="field">
        <label htmlFor="checkIn">Check in</label>
        <input
          id="checkIn"
          name="checkIn"
          type="date"
          min={dateInput(today)}
          defaultValue={checkIn ?? dateInput(defaultIn)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="checkOut">Check out</label>
        <input
          id="checkOut"
          name="checkOut"
          type="date"
          min={dateInput(today)}
          defaultValue={checkOut ?? dateInput(defaultOut)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="guests">Guests</label>
        <select id="guests" name="guests" defaultValue={guests}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </div>
      <button className="primary-button" type="submit" style={compactSpan}>
        <Search size={17} /> Find a stay
      </button>
    </form>
  );
}
