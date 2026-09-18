import { NextRequest, NextResponse } from "next/server";
import { routeClientRequest, getCoordinatesForCountry, getEdgeRegions, calculateDistanceKm } from "@/lib/edge/edge-router";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const headers = req.headers;
  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country") ||
    "US";

  const city =
    headers.get("x-vercel-ip-city") ||
    headers.get("cf-ipcity") ||
    "Edge Ingress";

  const clientIp =
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1";

  const latHeader = headers.get("x-vercel-ip-latitude");
  const lonHeader = headers.get("x-vercel-ip-longitude");
  const latitude = latHeader ? parseFloat(latHeader) : undefined;
  const longitude = lonHeader ? parseFloat(lonHeader) : undefined;

  const decision = routeClientRequest({
    country,
    city,
    clientIp,
    latitude,
    longitude,
  });

  const coords =
    latitude !== undefined && longitude !== undefined
      ? { lat: latitude, lon: longitude }
      : getCoordinatesForCountry(country);

  const allRegions = getEdgeRegions().map((reg) => ({
    id: reg.id,
    name: reg.name,
    location: reg.location,
    status: reg.status,
    distanceKm: calculateDistanceKm(coords.lat, coords.lon, reg.latitude, reg.longitude),
    latencyMs: Math.max(8, Math.round(reg.averageLatencyMs + (calculateDistanceKm(coords.lat, coords.lon, reg.latitude, reg.longitude) / 1000) * 4.8)),
  }));

  return NextResponse.json({
    status: "ok",
    client: {
      ip: clientIp,
      country,
      city,
      coordinates: coords,
    },
    routing: decision,
    regions: allRegions,
  });
}
