import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Playwright drives the app via http://127.0.0.1:3100 while Next dev
  // advertises itself as localhost; without this, dev HMR (and the dev
  // client bootstrap) is blocked as a cross-origin request, leaving the
  // page non-interactive in E2E runs. Both origins are allowed so the dev
  // server behaves the same for the test runner and for humans.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;