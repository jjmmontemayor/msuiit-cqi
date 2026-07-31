# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

# Applies pending migrations (incl. the reporting views, see
# prisma/migrations/*_add_reporting_views) before starting the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
