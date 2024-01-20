import dayjs from "dayjs";
import type { GetServerSidePropsContext } from "next";

function generateSiteMapIndex(paths: string[]): string {
  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
      .map(
        (path) =>
          `
      <sitemap>
          <loc>https://venaarauhassa.fi${path}</loc>
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
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  const nextTwoWeeks = Array(15)
    .fill("")
    .map((_, i) => dayjs().add(i, "day").format("YYYY-MM-DD"));

  const paths = nextTwoWeeks.map((date) => `/train/${date}/sitemap.xml`);
  const sitemap = generateSiteMapIndex(paths);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}
