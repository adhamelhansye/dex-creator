FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache --virtual .build-deps build-base python3

COPY package.json yarn.lock ./
COPY api/package.json ./api/
COPY api/prisma/ ./api/prisma/

RUN yarn install --frozen-lockfile

COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY api/tsconfig.json ./api/
COPY api/src/ ./api/src/
COPY config.ts ./
COPY api/types/ ./api/types/

WORKDIR /app/api
RUN yarn db:generate && \
    yarn orderly:generate && \
    yarn nexus:generate && \
    yarn sv:generate && \
    yarn build && \
    apk del .build-deps

FROM node:22-alpine AS runtime

WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3001
ENV MIGRATE_DB=false

COPY --from=builder /app/api/package.json ./
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/prisma ./prisma
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/src/workflows /app/workflows
COPY --from=builder /app/api/src/lib/generated ./src/lib/generated


RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

ENV IS_DOCKER=true

CMD ["node", "dist/index.cjs"]
