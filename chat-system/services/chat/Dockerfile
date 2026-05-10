FROM node:20-alpine as build
WORKDIR /app
ENV NX_DAEMON=false
ENV NX_PLUGIN_NO_TIMEOUTS=true
ENV CI=true
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx nx run chat:build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/services/chat ./
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
EXPOSE 9230
CMD ["node", "--inspect=0.0.0.0:9230", "main.js"]