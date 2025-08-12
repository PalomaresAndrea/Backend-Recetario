# Dockerfile (backend)
FROM node:20-alpine

# Seguridad y rendimiento
ENV NODE_ENV=production
WORKDIR /app

# Copia sólo lo necesario para resolver deps
COPY package*.json ./

# Instala solo deps de prod
RUN npm ci --omit=dev

# Copia el código
COPY . .

# Puerto interno de tu app
ENV PORT=3000
EXPOSE 3000

# Health simple: tu app ya expone /ready y /health
# Arranque
CMD ["npm", "start"]
