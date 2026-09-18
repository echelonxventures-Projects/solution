FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN npm install

COPY src/ ./src/

RUN npm run build || npx tsup src/index.ts --format cjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]