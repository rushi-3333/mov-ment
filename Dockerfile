# ── Stage 1: Build React frontend ──
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# Same-origin deploy: API serves /api and static files — no VITE_API_URL needed
RUN npm run build

# ── Stage 2: Production API + static frontend ──
FROM node:20-alpine AS production
WORKDIR /app/server
ENV NODE_ENV=production
ENV SERVE_CLIENT=true
ENV TRUST_PROXY=true

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:5000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]
