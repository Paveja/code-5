import type { Metadata } from "next";
import { BookingLookupForm } from "@/components/booking-lookup-form";

export const metadata: Metadata = { title: "Find your booking" };

export default function ManageBookingPage() {
  return (
    <div className="shell page-section">
      <div className="eyebrow">Your trip, all in one place</div>
      <h1 className="page-title">Find your booking.</h1>
      <p className="page-intro">
        Use the confirmation code from your email and the address you booked with to see
        your stay and cancellation options.
      </p>
      <BookingLookupForm />
    </div>
  );
}
