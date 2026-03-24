/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita conflito com locks em ".next" quando há processo de dev em paralelo.
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
