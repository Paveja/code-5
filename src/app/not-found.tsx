import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="shell page-section">
      <div className="empty-state">
        <Compass size={28} />
        <h1>That stay has moved on.</h1>
        <p>Let’s find another place that feels right for your trip.</p>
        <Link className="primary-button" href="/">
          Explore stays
        </Link>
      </div>
    </div>
  );
}
