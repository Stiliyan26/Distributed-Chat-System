FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run messaging:build
RUN npx nx run messaging:build-worker

FROM node:20-alpine
WORKDIR /app

# Setup API
COPY --from=build /app/dist/services/messaging ./api
WORKDIR /app/api
RUN npm ci --omit=dev
RUN npm install zod

# Setup Worker
WORKDIR /app
COPY --from=build /app/dist/services/messaging-worker ./worker
WORKDIR /app/worker
RUN npm ci --omit=dev
RUN npm install zod

WORKDIR /app
ENV NODE_ENV=production 

CMD ["node", "api/main.js"]
