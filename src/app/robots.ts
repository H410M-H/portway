import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.syncbay.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/enterprise",
          "/templates",
          "/roadmap",
          "/auth/signin",
          "/api/v1/openapi.json",
          "/api/geo/locate",
        ],
        disallow: [
          "/dashboard/",
          "/api/deployments/",
          "/api/trpc/",
          "/invite/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
