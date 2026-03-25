/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Remova ou comente a linha abaixo para voltar ao padrão ".next"
  // distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",

  // 2. Adicione isso para que seu Dockerfile funcione (standalone mode)
  output: 'standalone', 

  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;