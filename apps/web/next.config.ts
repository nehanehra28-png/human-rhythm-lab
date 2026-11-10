import type { NextConfig } from "next";

const config: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOYMENT_ENV:
      process.env.VERCEL_ENV ||
      (process.env.NODE_ENV === "development" ? "development" : "production"),
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  devIndicators: false,
};

export default config;
