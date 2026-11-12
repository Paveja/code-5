"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SearchResultsSort({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function changeSort(nextValue: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", nextValue);
    router.replace(`/?${next.toString()}`, { scroll: false });
  }

  return (
    <label className="sort-field">
      Sort by{" "}
      <select value={value} onChange={(event) => changeSort(event.target.value)}>
        <option value="recommended">Recommended</option>
        <option value="price-low">Price: low to high</option>
        <option value="rating">Guest rating</option>
      </select>
    </label>
  );
}
