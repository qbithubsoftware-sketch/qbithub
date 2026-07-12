import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers/Providers";

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
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
