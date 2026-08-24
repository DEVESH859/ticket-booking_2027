import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geist = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "LUMIO — Live it. Book it.",
  description: "Discover movies, concerts and live experiences. Pick your seats and book in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} min-h-screen antialiased`} style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}>
        <Nav />
        <main className="mx-auto min-h-[calc(100vh-68px)] max-w-7xl px-4 py-7 md:px-6 md:py-10">{children}</main>
      </body>
    </html>
  );
}
