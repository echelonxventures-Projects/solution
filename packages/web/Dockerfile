FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Final image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules

EXPOSE 1112

CMD ["npm", "run", "start"]