# ---- Stage: production ----
FROM node:20-alpine

WORKDIR /app

# Copy manifests first so npm ci is cached unless dependencies change
COPY package.json package-lock.json ./

RUN npm ci

# Copy remaining source (respects .dockerignore)
COPY . .

# Baked in at image build time so Next.js static bundles resolve the correct URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

EXPOSE 3001

# -p 3001 overrides Next.js default of 3000
CMD ["npm", "run", "start"]
