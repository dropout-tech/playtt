#
# Multi-stage build:
# - Build CRA assets inside container (no need to commit /build to git)
# - Serve static files with nginx
#

FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY public ./public
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
