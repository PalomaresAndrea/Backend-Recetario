# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependencias (incluye dev por si compilas TS u otros)
COPY package*.json ./
RUN npm ci

# Copia el resto del código
COPY . .

# Si tienes un paso de build (TS, etc.). Si no existe, no falla.
RUN npm run build || echo "no build step"

# Quita devDependencies dejando solo prod
RUN npm prune --omit=dev

# ---------- Runtime ----------
FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Healthcheck necesita curl
RUN apk add --no-cache curl

# Copia todo lo necesario desde el builder (código + node_modules ya pruned)
COPY --from=builder /app /app

# Por seguridad corre como usuario no root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

# Healthcheck opcional (asegúrate de exponer GET /health en tu API)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

# Inicia usando tu script de package.json ("start")
CMD ["npm", "start"]
