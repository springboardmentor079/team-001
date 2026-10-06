FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --ignore-scripts
COPY backend backend
RUN npm run db:generate -w backend && npm run build -w backend
WORKDIR /app/backend
ENV HOST=0.0.0.0
EXPOSE 4300
CMD ["node", "dist/src/server.js"]
