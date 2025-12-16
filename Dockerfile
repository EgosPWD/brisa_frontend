# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar solo los archivos de dependencias primero (mejora caché)
COPY package*.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Instalar el adaptador correcto si aún no está en package.json
# (opcional: mejor asegúrate de que ya esté en tu package.json antes de build)
RUN npm install -D @sveltejs/adapter-node

# Cambiar el adaptador en svelte.config.js a adapter-node si aún usas auto
# (esto deberías hacerlo en tu repo, no en Docker, pero por si acaso...)

# Construir la app
RUN npm run build

# Etapa de ejecución (más ligera)
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar solo lo necesario para producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar la app construida
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Exponer el puerto (debe coincidir con el que usas en el código o .env)
EXPOSE 8182

# Comando para iniciar el servidor SSR
CMD ["node", "build"]
