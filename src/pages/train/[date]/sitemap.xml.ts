import type { GetServerSidePropsContext } from "next";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getInitialTrains } from "~/lib/digitraffic";

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

export default function SiteMap() {
  /* empty */
}

export async function getServerSideProps({ res, query }: GetServerSidePropsContext) {
  if (isInMaintenance()) {
    res.statusCode = 503;
    res.setHeader("Retry-After", "43200"); // 12 hours
    res.end();

    return {
      props: {},
    };
  }

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  const date = query.date as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date as string) || Number.isNaN(new Date(date).getTime())) {
    res.statusCode = 400;
    res.end();

    return {
      props: {},
    };
  }

  const dateObj = new Date(date);
  if (
    // Restrict sitemap to now - 2d .. now + 8d
    dateObj.getTime() < Date.now() - 2 * 24 * 60 * 60 * 1000 ||
    dateObj.getTime() > Date.now() + 8 * 24 * 60 * 60 * 1000
  ) {
    res.statusCode = 404;
    res.end();

    return {
      props: {},
    };
  }

  const trains = await getInitialTrains(date);

  const paths = trains.map((train) => `/train/${date}/${train.value}`);
  const sitemap = generateSiteMap(paths);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}
