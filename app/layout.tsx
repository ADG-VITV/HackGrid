import type { Metadata } from "next";
import {
  geistSans,
  jetbrainsMono,
  firaCode,
  plusJakartaSans,
  spaceGrotesk,
  manropeSans,
  splineSansMono,
} from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "HACKGRID 2026",
  description: "BID. BUILD. COMPETE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        ${geistSans.variable}
        ${jetbrainsMono.variable}
        ${firaCode.variable}
        ${plusJakartaSans.variable}
        ${spaceGrotesk.variable}
        ${manropeSans.variable}
        ${splineSansMono.variable}
      `}
    >
      <body>{children}</body>
    </html>
  );
}