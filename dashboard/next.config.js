/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
  // Disable prefetching for external API routes to prevent 401 errors
  async rewrites() {
    return [];
  },
  // Suppress console warnings in production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig

