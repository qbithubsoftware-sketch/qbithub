import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers/Providers";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "QBIT Hub — Enterprise Portal",
    template: "%s | QBIT Hub",
  },
  description:
    "QBIT Hub is the enterprise control center for installation engineers, field operations, product management, and AI-powered technical support.",
  keywords: [
    "QBIT Hub",
    "Enterprise Portal",
    "POS",
    "Installation",
    "Driver Management",
    "Field Engineering",
    "POS Terminal",
    "Thermal Printer",
    "Barcode Scanner",
    "Firmware",
  ],
  authors: [{ name: "QBIT Hub Technology Group" }],
  creator: "QBIT Hub Technology Group",
  publisher: "QBIT Hub Technology Group",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://hub.qbit.com",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QBIT Engineer",
  },
  openGraph: {
    title: "QBIT Hub — Enterprise Portal",
    description:
      "Precision engineering for modern POS systems. Manage hardware lifecycles, installation workflows, and driver deployments across your global enterprise fleet.",
    url: "https://hub.qbit.com",
    siteName: "QBIT Hub",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://hub.qbit.com/qbit-logo.png",
        width: 1200,
        height: 630,
        alt: "QBIT Hub Enterprise Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QBIT Hub — Enterprise Portal",
    description:
      "Precision engineering for modern POS systems across your global enterprise fleet.",
    images: ["https://hub.qbit.com/qbit-logo.png"],
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#00639B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QBIT Engineer" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>
          {children}
        </Providers>
        <ServiceWorkerRegistration />
        <Toaster />
      </body>
    </html>
  );
}
