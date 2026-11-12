"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page rendering failed", error);
  }, [error]);

  return (
    <div className="shell page-section">
      <div className="empty-state">
        <h1>We lost the thread for a moment.</h1>
        <p>
          Your booking details are safe. Try the page again, or return to the collection.
        </p>
        <button className="primary-button" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
