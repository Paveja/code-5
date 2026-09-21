import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'do. — Focused task management',
  description: 'A quieter way to get things done.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
