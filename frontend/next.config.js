/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Produce a self-contained server bundle (.next/standalone) that the
  // frontend Dockerfile copies. Vercel ignores this and builds normally.
  output: "standalone",
}

module.exports = nextConfig
