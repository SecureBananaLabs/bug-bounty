/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
