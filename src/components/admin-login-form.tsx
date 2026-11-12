"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

export function AdminLoginForm({
  audience = "operator",
}: {
  audience?: "operator" | "guest";
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isGuest = audience === "guest";

  async function login(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Sign in failed.");
      window.location.assign(result.data.role === "operator" ? "/admin" : "/account");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed.");
      setBusy(false);
    }
  }

  return (
    <form className="form-panel" action={login}>
      <h2>{isGuest ? "Sign in to your account" : "Operator sign in"}</h2>
      <p className="form-note">
        {isGuest
          ? "Sign in with the details you chose at checkout."
          : "Use the operator credentials configured for this workspace."}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button className="primary-button full-button" type="submit" disabled={busy}>
        {busy ? (
          "Signing in…"
        ) : (
          <>
            <LockKeyhole size={15} /> Sign in
          </>
        )}
      </button>
    </form>
  );
}
