FROM node:20-alpine AS build 
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run auth:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/services/auth .
RUN npm ci --omit=dev
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "main.js"]

