export function nightsBetween(checkIn: string, checkOut: string) {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  const nights = (end - start) / 86_400_000;

  if (!Number.isInteger(nights) || nights < 1 || nights > 30) {
    throw new Error("Stay dates must be valid and between one and thirty nights.");
  }

  return nights;
}

export function dateRange(checkIn: string, checkOut: string) {
  const dates: string[] = [];
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);

  for (const date = new Date(start); date < end; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}
