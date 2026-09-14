import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";
import ClientLayout from "./ClientLayout";
import StyledJsxRegistry from "./styled-jsx-registry";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} h-full antialiased`}
      style={{
        "--font-geist-pixel": "'GeistPixelSquare', 'Pixelify Sans', 'Silkscreen', 'Press Start 2P', monospace",
        "--font-geist-pixel-square": "'GeistPixelSquare', 'Pixelify Sans', 'Silkscreen', 'Press Start 2P', monospace",
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-black text-white m-0 p-0 relative overscroll-none">
        <StyledJsxRegistry>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
