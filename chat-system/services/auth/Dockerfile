FROM node:20-alpine AS build 
WORKDIR /app
# Nx plugin workers often time out under Docker BuildKit / parallel builds
ENV NX_DAEMON=false
ENV NX_PLUGIN_NO_TIMEOUTS=true
ENV CI=true
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
EXPOSE 9232
CMD ["node", "--inspect=0.0.0.0:9232", "main.js"]

