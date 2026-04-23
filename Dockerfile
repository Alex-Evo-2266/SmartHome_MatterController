FROM node:18-bullseye AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:18-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY . .

# RUN apt-get update && apt-get install -y \
#     bluez \
#     dbus \
#     bluetooth

RUN apt-get update && apt-get install -y \
    bluez \
    dbus \
    python3 \
    make \
    g++ \
    libbluetooth-dev

RUN npm install @stoprocent/noble

RUN npm run build

CMD ["node", "dist/index.js"]