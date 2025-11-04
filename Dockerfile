FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:22-slim

ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE=/tmp

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
