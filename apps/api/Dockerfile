# ================================
# Base Stage
# ================================
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./ 2>/dev/null || true

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# ================================
# Dependencies Stage
# ================================
FROM base AS dependencies

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# ================================
# Build Stage
# ================================
FROM dependencies AS build

# Build shared packages first
RUN pnpm --filter @retail/database build
RUN pnpm --filter @retail/types build

# Build API
RUN pnpm --filter @retail/api build

# Generate Prisma Client
RUN pnpm --filter @retail/database prisma generate

# ================================
# Production Dependencies
# ================================
FROM base AS prod-dependencies

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/packages ./packages

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/

# Copy Prisma schema and migrations
COPY --from=build --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start app
CMD ["sh", "-c", "pnpm --filter @retail/database prisma migrate deploy && node apps/api/dist/main.js"]
