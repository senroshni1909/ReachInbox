# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_API_URL=/api

ENV VITE_API_URL=$VITE_API_URL

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build Vite SPA
RUN npm run build

# Web server stage with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
