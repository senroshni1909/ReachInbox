# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build ts
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl curl

# Copy package definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client for linux-musl
RUN npx prisma generate

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 5000

# Run prisma db push/migration and start node server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/index.js"]
