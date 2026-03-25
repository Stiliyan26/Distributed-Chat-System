FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx nx run api-gateway:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/dist/services/api-gateway ./
RUN npm install --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
EXPOSE 9236
CMD ["node", "--inspect=0.0.0.0:9236", "main.js"]