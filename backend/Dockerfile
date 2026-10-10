# GK Parfum backend (Medusa + admin panel)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json apps/backend/
RUN npm ci
COPY . .
ARG MEDUSA_BACKEND_URL=/
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN cd apps/backend && npx medusa build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/.medusa/server ./
RUN npm install --omit=dev --no-audit --no-fund
COPY docker-start.sh ./docker-start.sh
RUN chmod +x ./docker-start.sh
# Keeps memory inside a 512 MB free server; raise on bigger machines.
ENV NODE_OPTIONS=--max-old-space-size=320
EXPOSE 9000
# Migrations are idempotent; the GK seed only runs on the very first migrate.
CMD ["./docker-start.sh"]
