"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/ui/Navbar";
import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";
import Hero from "@/components/hero/hero";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackGrid",
  description: "Created with love by ADG",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white m-0 p-0 relative">
        <Navbar />
        {pathname === "/" ? (
          <div className="flex-1 relative overflow-hidden cursor-none bg-black">
            <TechCursor />
            <BulgeGrid />
            <Hero />
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
      </body>
    </html>
  );
}
