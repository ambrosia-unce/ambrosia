import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://packs.ambrosia.dev"),
  title: {
    default: "Ambrosia Pack Market — Discover and Install Packs",
    template: "%s | Ambrosia Pack Market",
  },
  description:
    "Discover, install, and publish packs for the Ambrosia framework. Build faster with community-driven components.",
  applicationName: "Ambrosia Pack Market",
  keywords: [
    "ambrosia",
    "packs",
    "bun",
    "framework",
    "plugins",
    "packages",
    "marketplace",
    "typescript",
  ],
  authors: [{ name: "Ambrosia Team" }],
  creator: "Ambrosia",
  publisher: "Ambrosia",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://packs.ambrosia.dev",
    siteName: "Ambrosia Pack Market",
    title: "Ambrosia Pack Market",
    description:
      "Discover, install, and publish packs for the Ambrosia framework.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambrosia Pack Market",
    description:
      "Discover, install, and publish packs for the Ambrosia framework.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  category: "development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark bg-dot-pattern`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
