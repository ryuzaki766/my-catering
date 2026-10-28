FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./

# Prisma: schema harus ada sebelum npm ci agar @prisma/client ter-generate
COPY prisma ./prisma
RUN npm ci

COPY src ./src
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./

# @prisma/client otomatis menjalankan `prisma generate` saat instal
# karena prisma/schema.prisma sudah tersedia di konteks ini
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]
