import dayjs from "dayjs";
import type { GetServerSidePropsContext } from "next";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";

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

export default function SiteMapIndex() {
  /* empty */
}

export function getServerSideProps({ res }: GetServerSidePropsContext) {
  if (isInMaintenance()) {
    res.statusCode = 503;
    res.setHeader("Retry-After", "86400");
    res.end();

    return {
      props: {},
    };
  }

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  // also update limits in the actual sitemap implementation
  const week = Array(7)
    .fill("")
    .map((_, i) => dayjs().add(i, "day").format("YYYY-MM-DD"));

  const paths = week.map((date) => `/train/${date}/sitemap.xml`);
  const sitemap = generateSiteMapIndex(paths);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}
