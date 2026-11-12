import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = { title: "Sign in to your account" };

export default async function AccountLoginPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "operator" ? "/admin" : "/account");
  return (
    <div className="shell admin-login">
      <div className="eyebrow">Your stays, together</div>
      <h1 className="page-title">Welcome back.</h1>
      <p className="page-intro">
        Sign in with the account details you chose when booking.
      </p>
      <AdminLoginForm audience="guest" />
    </div>
  );
}
