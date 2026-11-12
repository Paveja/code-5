import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Good Game Club — Tic Tac Toe",
  description: "A little game of X and O. Take a break and play Tic Tac Toe.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
