import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getInitialTrains } from "~/lib/digitraffic";

export const dynamic = "force-dynamic";

function generateSiteMap(paths: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
    .map(
      (path) => `
  <url>
    <loc>${getBaseURL()}${path}</loc>
    <changefreq>daily</changefreq>
  </url>`
    )
    .join("")}
  </urlset>
  `;
}

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  if (isInMaintenance()) {
    return new Response(null, {
      status: 503,
      headers: { "Retry-After": "43200" },
    });
  }

  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) {
    return new Response(null, { status: 400 });
  }

  const timestamp = new Date(date).getTime();
  if (
    timestamp < Date.now() - 2 * 24 * 60 * 60 * 1000 ||
    timestamp > Date.now() + 8 * 24 * 60 * 60 * 1000
  ) {
    return new Response(null, { status: 404 });
  }

  const trains = await getInitialTrains(date);
  const sitemap = generateSiteMap(trains.map((train) => `/train/${date}/${train.value}`));

  return new Response(sitemap, {
    headers: {
      "Content-Type": "text/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
