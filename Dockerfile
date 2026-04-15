FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY . .

# RUN apt-get update && apt-get install -y \
#     bluez \
#     dbus \
#     bluetooth

RUN apk add --no-cache \
    bluez \
    dbus

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers

RUN npm install @stoprocent/noble

RUN npm run build

CMD ["node", "dist/index.js"]