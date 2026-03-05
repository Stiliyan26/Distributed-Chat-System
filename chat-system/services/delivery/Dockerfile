FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run delivery:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/services/delivery ./
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps
ENV NODE_ENV=production
EXPOSE 3005
CMD ["node", "main.js"]
