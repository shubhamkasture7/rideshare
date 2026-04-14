# ─── Build stage ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# ─── Production stage ────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY . .

EXPOSE 5000

CMD ["node", "src/main.js"]
