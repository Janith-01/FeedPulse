# ---- Stage: production ----
FROM node:20-alpine

WORKDIR /app

# Copy manifests first so npm ci is cached unless dependencies change
COPY package.json package-lock.json ./

RUN npm ci --omit=dev=false

# Copy remaining source (respects .dockerignore)
COPY . .

# Compile TypeScript → dist/
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
