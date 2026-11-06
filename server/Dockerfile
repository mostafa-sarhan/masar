# syntax=docker/dockerfile:1
# Masar API. Build from the repository root:  docker build -f server/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --no-audit --no-fund -w @masar/shared -w @masar/server --include-workspace-root
COPY shared shared
COPY server server
RUN npm run build -w @masar/shared && npm run build -w @masar/server

# Production dependencies of shared + server only. (`npm ci -w` would still install every
# workspace's dependencies, so the client workspace is removed from the list first.)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.workspaces=['shared','server'];fs.writeFileSync('package.json',JSON.stringify(p))" \
  && npm install --omit=dev --no-audit --no-fund --ignore-scripts && npm cache clean --force

FROM node:22-alpine
ENV NODE_ENV=production PORT=5000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node shared/package.json shared/
COPY --chown=node:node server/package.json server/
COPY --from=build --chown=node:node /app/shared/dist shared/dist
COPY --from=build --chown=node:node /app/server/dist server/dist
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
LABEL app=masar component=api
USER node
WORKDIR /app/server
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
