import dayjs from "dayjs";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";

export const dynamic = "force-dynamic";

function generateSiteMapIndex(paths: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
    .map(
      (path) => `
  <sitemap>
    <loc>${getBaseURL()}${path}</loc>
  </sitemap>`
    )
    .join("")}
</sitemapindex>
  `;
}

export function GET() {
  if (isInMaintenance()) {
    return new Response(null, {
      status: 503,
      headers: { "Retry-After": "86400" },
    });
  }

  const week = Array.from({ length: 7 }, (_, index) =>
    dayjs().add(index, "day").format("YYYY-MM-DD")
  );
  const sitemap = generateSiteMapIndex(week.map((date) => `/train/${date}/sitemap.xml`));

  return new Response(sitemap, {
    headers: {
      "Content-Type": "text/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
