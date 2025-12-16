FROM node:20-alpine

WORKDIR /app

# Copiar dependencias primero (mejor cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Build de SvelteKit (SSR)
RUN npm run build

# Exponer el puerto que usará el servidor Node
EXPOSE 8182

# Ejecutar el servidor generado por SvelteKit
CMD ["node", "build"]
