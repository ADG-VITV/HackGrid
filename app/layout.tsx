import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import ClientLayout from "./ClientLayout";
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
<<<<<<< HEAD
      <body className="min-h-full flex flex-col bg-black text-white m-0 p-0 overscroll-none">{children}</body>
=======
      <body className="min-h-full flex flex-col bg-black text-white m-0 p-0 relative">
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
>>>>>>> c6f265330b0dec4b8565e35f3dec155da4b719f4
    </html>
  );
}