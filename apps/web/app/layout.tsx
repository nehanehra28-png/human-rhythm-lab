import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Human Rhythm Lab",
  description:
    "A little more in tune with yourself. Your guided 30-day experience.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
