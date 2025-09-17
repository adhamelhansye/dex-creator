# Multi-stage build with fewer dependencies
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install only what's absolutely necessary
RUN apk add --no-cache --virtual .build-deps build-base python3

# Copy workspace files
COPY package.json yarn.lock ./
COPY api/package.json ./api/
COPY api/prisma/ ./api/prisma/

# Install dependencies 
RUN yarn install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY api/tsconfig.json ./api/
COPY api/src/ ./api/src/
COPY config.ts ./
COPY api/types/ ./api/types/

# Generate Prisma client and build with tsup
WORKDIR /app/api
RUN yarn db:generate && \
    yarn orderly:generate && \
    yarn build && \
    # Clean up build deps to reduce image size
    apk del .build-deps

# Stage 2: Runtime image
FROM node:22-alpine AS runtime

# Set working directory 
WORKDIR /app/api

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV MIGRATE_DB=false

# Copy only what's needed from the builder stage
COPY --from=builder /app/api/package.json ./
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/prisma ./prisma
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/src/workflows /app/workflows
COPY --from=builder /app/api/src/lib/generated ./src/lib/generated


# Use non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 3001  

CMD ["node", "dist/index.cjs"]
