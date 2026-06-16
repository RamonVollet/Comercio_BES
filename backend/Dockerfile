FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY backend ./
RUN npx prisma generate

RUN mkdir -p public
COPY index.html manifest.json sw.js ./public/
COPY css ./public/css
COPY js ./public/js
COPY html ./public/html
COPY icons ./public/icons
COPY images ./public/images
COPY data ./public/data

EXPOSE 3000

CMD ["npm", "start"]
