/** @type {import("next").NextConfig} */
const config = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  reactStrictMode: true,
  transpilePackages: ["geist"],
  productionBrowserSourceMaps: true,
  experimental: {
    useTypeScriptCli: false,
  },
};

export default config;
