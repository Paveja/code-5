import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireOperator } from "@/lib/auth";
import {
  listOperatorBookings,
  listOperatorProperties,
  listOperatorRooms,
} from "@/services/admin-service";

export const metadata: Metadata = { title: "Operations" };

type AdminSearchParams = { page?: string; tab?: string };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const operator = await requireOperator();
  if (!operator) redirect("/admin/login");

  const query = await searchParams;
  const requestedPage = query.page && /^\d+$/.test(query.page) ? Number(query.page) : 1;
  const initialTab =
    query.tab === "rooms" || query.tab === "bookings" ? query.tab : "properties";
  const [properties, rooms, bookingPage] = [
    listOperatorProperties(),
    listOperatorRooms(),
    listOperatorBookings(requestedPage),
  ];

  return (
    <div className="shell admin-shell">
      <AdminDashboard
        properties={properties}
        rooms={rooms}
        bookings={bookingPage.rows}
        bookingPage={bookingPage.currentPage}
        bookingPageCount={bookingPage.pageCount}
        bookingTotal={bookingPage.total}
        initialTab={initialTab}
        operatorName={operator.name.split(" ")[0]}
      />
    </div>
  );
}
