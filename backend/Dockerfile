# Backend Dockerfile - Production Ready
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev for ts-node-dev in development)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src ./src

# Note: We don't build here - for development we use ts-node-dev
# For production, build happens in CI/CD or use docker-compose.prod.yml

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for ts-node-dev in development)
# In production, use docker-compose.prod.yml which uses --only=production
RUN npm ci && npm cache clean --force

# Copy source code (always needed)
# Note: In development mode, volumes override this with live code
COPY --from=builder /app/src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
# In development, docker-compose overrides this with: npm run dev (ts-node-dev)
# For production, you should build first and use: node dist/server.js
CMD ["npm", "run", "dev"]
