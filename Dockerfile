FROM node:20-alpine AS runtime
WORKDIR /app
COPY /app/dist ./dist
COPY /app/node_modules ./node_modules
COPY /app/.nuxt ./.nuxt
ENV NITRO_PRESET=node
EXPOSE 3000
CMD ["node", "dist/_worker.js/index.js"]