# Stage 1: build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build (GEMINI_API_KEY optional at build time; set at runtime via env if needed)
ENV NODE_ENV=production
RUN npm run build

# Verify dist was created
RUN ls -la dist/ && test -f dist/index.html

# Stage 2: serve
FROM node:20-slim

WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["serve", "-s", "/app/dist", "-l", "8080"]
