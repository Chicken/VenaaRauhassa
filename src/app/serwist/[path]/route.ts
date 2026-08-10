import { createSerwistRoute } from "@serwist/turbopack";

const revision = process.env.GITHUB_SHA ?? "development";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
  }
);
