// Static export for GitHub Pages project site: olatechie.github.io/evd-ocular-explorer
const repo = "evd-ocular-explorer";
const isProd = process.env.NODE_ENV === "production";
const base = isProd ? `/${repo}` : "";

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  images: { unoptimized: true },
  basePath: base,
  assetPrefix: base || undefined,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: base },
  reactStrictMode: true,
};
