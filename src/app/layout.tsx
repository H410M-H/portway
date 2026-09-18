import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc-client";

function getBaseUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  title: { default: "Portway", template: "%s — Portway" },
  description:
    "Portway — Cloud Application Platform. Deploy from GitHub, attach databases, observe everything.",
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    type: "website",
    title: "Portway",
    description:
      "A Railway-class PaaS. Deploy any Dockerfile or buildpack, attach a managed Postgres, watch it run.",
    siteName: "Portway",
  },
  robots: { index: false, follow: false }, // private dashboard
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
