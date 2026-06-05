FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S ninja && \
    adduser -S ninja -u 1001 -G ninja

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R ninja:ninja /app
USER ninja

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENV NODE_ENV=production
ENV PORT=8080
ENV NINJAONE_INSTANCE=app.ninjarmm.com

CMD ["node", "dist/httpServer.js"]
