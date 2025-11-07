# ================================
# Base Stage
# ================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat

# Install pnpm
RUN npm install -g pnpm@8

# Skip Puppeteer chromium download
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy .npmrc if it exists (optional)
COPY .npmrc* ./

# Copy workspace packages
COPY packages ./packages
COPY apps/web ./apps/web

# ================================
# Dependencies Stage
# ================================
FROM base AS dependencies

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ================================
# Build Stage
# ================================
FROM dependencies AS build

# Build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build shared packages
RUN pnpm --filter @retail/ui build
RUN pnpm --filter @retail/types build

# Build Next.js app
RUN pnpm --filter @retail/web build

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/web/server.js"]
