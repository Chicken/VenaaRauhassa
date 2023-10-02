import dayjs from "dayjs";
import type { GetServerSidePropsContext } from "next";
import { getJSON } from "~/lib/http";

function generateSiteMap(paths: string[]): string {
  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://venaarauhassa.fi</loc>
        <priority>1.0</priority>
        <changefreq>weekly</changefreq>
      </url>${paths
        .map(
          (path) =>
            `
      <url>
          <loc>https://venaarauhassa.fi${path}</loc>
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

// TODO: proxy this endpoint to a selfhosted instance to avoid serverless function timeouts

export async function getServerSideProps({ res }: GetServerSidePropsContext) {
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  const nextTwoWeeks = Array(15)
    .fill("")
    .map((_, i) => dayjs().add(i, "day").format("YYYY-MM-DD"));

  const paths: string[] = (
    await Promise.all(
      nextTwoWeeks.map(async (date) => {
        const trains = (await getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}`).catch(
          () => []
        )) as {
          trainNumber: number;
          trainType: string;
        }[];
        const trainNumbers = trains
          .filter((t) => ["IC", "S"].includes(t.trainType))
          .map((train) => train.trainNumber);
        return trainNumbers.map((n) => `/train/${date}/${n}`);
      })
    )
  ).flat();

  const sitemap = generateSiteMap(paths);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}
