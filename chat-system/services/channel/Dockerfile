FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run channel:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/dist/services/channel ./api
RUN npm ci --omit=dev
ENV NODE_ENV=production
CMD ["node", "api/main.js"]
