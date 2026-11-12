import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = { title: "Operator sign in" };

export default async function AdminLoginPage() {
  if ((await currentUser())?.role === "operator") redirect("/admin");
  return (
    <div className="shell admin-login">
      <div className="eyebrow">Stayfinder operations</div>
      <h1 className="page-title">Welcome back.</h1>
      <p className="page-intro">
        Keep the collection thoughtful and every stay running smoothly.
      </p>
      <AdminLoginForm />
      {!process.env.ADMIN_EMAIL && (
        <p className="form-note" style={{ marginTop: 14 }}>
          Set ADMIN_EMAIL and ADMIN_PASSWORD in the server environment, then run the seed
          command to create the first operator account.
        </p>
      )}
    </div>
  );
}
