import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";

const withNextIntl = createNextIntlPlugin(
  path.resolve(__dirname, "./i18n/request.ts")
);

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
