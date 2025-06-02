import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Homomorphic Encryption",
  description: "Group 8 Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="w-full flex justify-center py-4 bg-gray-50 border-b mb-8">
          <div className="flex gap-8">
            <Link href="/" className="font-semibold hover:underline">
              Home
            </Link>
            <Link
              href="/benchmark-visualization"
              className="font-semibold hover:underline"
            >
              Benchmark Visualization
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
