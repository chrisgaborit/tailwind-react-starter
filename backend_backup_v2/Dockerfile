# Simple image with Chromium preinstalled (good for Puppeteer/PDF)
FROM ghcr.io/puppeteer/puppeteer:22.10.0

# Build first with dev deps, then prune them
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PORT=8080

# Install & build as root to avoid EACCES, then switch to pptruser
USER root
WORKDIR /app

# 1) Install deps (incl dev so tsc exists)
COPY package*.json ./
RUN npm ci --include=dev

# 2) Copy source and build
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# 3) Drop dev deps and fix ownership for runtime user
RUN npm prune --omit=dev && chown -R pptruser:pptruser /app

# 4) Run as non-root at runtime
USER pptruser
ENV NODE_ENV=production

# Cloud Run will send traffic to $PORT
EXPOSE 8080
CMD ["node", "dist/index.js"]
