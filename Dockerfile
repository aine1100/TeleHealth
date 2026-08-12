# syntax=docker/dockerfile:1

# ---- Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ .
# Same-origin API (served by Express in one process)
ENV REACT_APP_API_URL=
ENV CI=true
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ---- Backend runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY backend/ .
COPY --from=frontend-build /frontend/build ./public

RUN mkdir -p uploads/consult && chown -R app:app /app

USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=50s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["node", "docker-entrypoint.js"]
