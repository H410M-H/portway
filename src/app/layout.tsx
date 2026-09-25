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
  title: {
    default: "Syncbay — The Cloud Hyper-Plane for Developers | Next-Gen PaaS",
    template: "%s — Syncbay PaaS",
  },
  description:
    "Syncbay is the developer PaaS engineered to surpass Vercel and Railway. Deploy any Dockerfile or Nixpacks app to 6 global edge POPs with 0ms cold starts, attached managed PostgreSQL, interactive Web Shell, and SQL Query Studio.",
  keywords: [
    "PaaS",
    "Cloud Platform",
    "Vercel Alternative",
    "Railway Alternative",
    "Docker Deployment",
    "Managed PostgreSQL",
    "Edge Containers",
    "Nixpacks",
    "Developer Cloud",
    "Serverless Containers",
    "Cloudflare Containers",
  ],
  authors: [{ name: "Syncbay Engineering", url: "https://www.syncbay.app" }],
  creator: "MSNS-DEV™",
  publisher: "Syncbay Inc.",
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getBaseUrl(),
    title: "Syncbay — The Cloud Hyper-Plane for Modern Developers",
    description:
      "Deploy any repo to 6 global edge POPs in seconds. Managed PostgreSQL, Redis cache, live web terminal shell, and embedded SQL query studio.",
    siteName: "Syncbay",
  },
  twitter: {
    card: "summary_large_image",
    title: "Syncbay — The Cloud Hyper-Plane for Modern Developers",
    description:
      "Next-Gen PaaS competing with Vercel and Railway. 0ms cold starts, multi-region edge containers, managed Postgres & interactive Web Shell.",
  },
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
};

import { GlobalSpaceBackground } from "@/components/ui/global-space-background";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>
          <GlobalSpaceBackground />
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
