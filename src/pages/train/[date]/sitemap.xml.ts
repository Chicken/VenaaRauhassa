import type { GetServerSidePropsContext } from "next";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getJSON } from "~/lib/http";

function generateSiteMap(paths: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
    .map(
      (path) => `
  <url>
    <loc>${getBaseURL()}${path}</loc>
    <changefreq>hourly</changefreq>
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
    res.setHeader("Retry-After", "86400");
    res.end();

    return {
      props: {},
    };
  }

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  const date = query.date as string;

  const trains = (await getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}`).catch(
    () => []
  )) as {
    trainNumber: number;
    trainType: string;
  }[];

  const trainNumbers = trains
    .filter((t) => ["IC", "S"].includes(t.trainType))
    .map((train) => train.trainNumber);

  const paths = trainNumbers.map((n) => `/train/${date}/${n}`);
  const sitemap = generateSiteMap(paths);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}
