FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx nx run presence:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/services/presence ./
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm install --omit=dev
ENV NODE_ENV=production
EXPOSE 3004
EXPOSE 9233
CMD ["node", "--inspect=0.0.0.0:9233", "main.js"]
