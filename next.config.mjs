import { withSerwist } from "@serwist/turbopack";

/** @type {import("next").NextConfig} */
const config = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  reactStrictMode: true,
  transpilePackages: ["geist"],
  productionBrowserSourceMaps: true,
  experimental: {
    useTypeScriptCli: false,
  },
  headers() {
    return Promise.resolve([
      {
        source: "/serwist/:path*",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; connect-src 'self' https:",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ]);
  },
};

export default withSerwist(config);
