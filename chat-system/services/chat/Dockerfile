FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run chat:build

FROM node:20-alpine 
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/dist/services/chat ./api
RUN npm ci --omit=dev   

ENV NODE_ENV=production
CMD ["node", "--inspect=0.0.0.0:9230", "api/main.js"]