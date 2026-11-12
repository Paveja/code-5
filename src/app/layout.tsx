import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Stayfinder — Find your kind of away", template: "%s · Stayfinder" },
  description:
    "Thoughtful stays, carefully chosen. Find a place that feels like part of the trip.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/" aria-label="Stayfinder home">
              <span className="brand-mark" aria-hidden="true">
                <MapPin size={16} />
              </span>
              Stayfinder
            </Link>
            <nav className="header-nav" aria-label="Main navigation">
              <Link href="/#stays">Find a stay</Link>
              <Link href="/manage">My booking</Link>
              <Link href="/account/login">My stays</Link>
              <Link className="header-cta" href="/admin/login">
                For operators
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <span>Stayfinder · Find your kind of away.</span>
            <div className="footer-links">
              <Link href="/manage">Manage a booking</Link>
              <Link href="/admin/login">Operator sign in</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
