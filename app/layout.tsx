import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirewex.com";
const OG_IMAGE = `${SITE_URL}/og-default.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hirewex — Hire Top Freelancers Online | Freelance Marketplace",
    template: "%s | Hirewex",
  },
  description:
    "Hirewex is a secure freelance marketplace to hire vetted web developers, designers, marketers, writers and more. Post jobs, manage projects and release payments with escrow protection.",
  keywords: [
    "hire freelancers",
    "freelance marketplace",
    "freelance jobs",
    "hire web developer",
    "hire designer",
    "hire copywriter",
    "online freelancing",
    "remote work",
    "freelancer platform",
    "post a job",
    "escrow payments",
    "vetted freelancers",
    "find freelance work",
    "outsource projects",
  ],
  authors: [{ name: "Hirewex", url: SITE_URL }],
  creator: "Hirewex",
  publisher: "Hirewex",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Hirewex",
    title: "Hirewex — Hire Top Freelancers Online",
    description:
      "Find and hire verified freelancers for web development, design, marketing, writing and more. Secure escrow, real reviews, zero hassle.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Hirewex — Freelance Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hirewex — Hire Top Freelancers Online",
    description:
      "Find and hire verified freelancers for web development, design, marketing, writing and more. Secure escrow, real reviews, zero hassle.",
    images: [OG_IMAGE],
    creator: "@hirewex",
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
