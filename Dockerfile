# ============================
# 🏗️ Etapa 1 - Build do projeto
# ============================
FROM node:22-alpine AS builder

# Define diretório de trabalho
WORKDIR /usr/src/app

# Copia arquivos essenciais primeiro (para melhor cache)
COPY package*.json ./

# Instala dependências com cache otimizado
RUN npm ci

# Copia o restante do código do projeto
COPY . .

# Define variáveis de ambiente padrão para o build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Gera o build de produção do Next.js
RUN npm run build


# ============================
# 🚀 Etapa 2 - Servidor de produção
# ============================
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo

# Copia apenas o necessário do build anterior
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY .env .env

# Exponha a porta padrão do Next.js
EXPOSE 3000

# Comando padrão para iniciar o servidor
CMD ["npm", "run", "start"]
