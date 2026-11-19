# Tekit Sushi — VPS uchun yagona konteyner: frontend build + Node server
# QURISH:   docker build -t tekit-sushi .
# ISHGA TUSHIRISH:  env fayl bilan:  docker run --env-file .env -p 3000:3000 tekit-sushi
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
COPY --from=build /app/server ./server
EXPOSE 3000
CMD ["node", "server/index.js"]
