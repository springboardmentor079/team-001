# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Optionally point the bundle at an API on another origin:  --build-arg API_URL=https://api.example.com/api
ARG API_URL=/api
RUN sed -i "s#apiUrl: '.*'#apiUrl: '${API_URL}'#" src/environments/environment.prod.ts
RUN npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/buildtrack-frontend/browser /usr/share/nginx/html
EXPOSE 80
