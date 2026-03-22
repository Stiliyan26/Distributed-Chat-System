FROM node:20-alpine AS build 
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx nx run auth:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/services/auth .
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm install --omit=dev
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "main.js"]

