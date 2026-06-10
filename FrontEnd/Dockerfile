FROM node:22-alpine@sha256:968df39aedcea65eeb078fb336ed7191baf48f972b4479711397108be0966920 AS build
WORKDIR /app

COPY . .
RUN npm run build

FROM node:22-alpine@sha256:968df39aedcea65eeb078fb336ed7191baf48f972b4479711397108be0966920 AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs
EXPOSE 4173
CMD ["node", "server.mjs"]
