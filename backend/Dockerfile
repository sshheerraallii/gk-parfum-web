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
EXPOSE 9000
# Migrations are idempotent; the GK seed only runs on the very first migrate.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
