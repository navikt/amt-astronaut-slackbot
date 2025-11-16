FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:22-dev AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN ["npm", "ci", "--omit=dev"]
COPY src ./src

FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:22-slim
ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE=/tmp
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["src/server.js"]
