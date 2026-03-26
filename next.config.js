/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Remova ou comente a linha abaixo para voltar ao padrão ".next"
  // distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",

  // 2. Adicione isso para que seu Dockerfile funcione (standalone mode)
  // Nota: Se o build falhar localmente no Windows com EPERM, ative o 'Modo de Desenvolvedor' no Windows.
  output: 'standalone', 

  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;