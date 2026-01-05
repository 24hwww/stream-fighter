FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install
RUN apk add --no-cache lsof curl
COPY . .
RUN npx prisma generate

FROM base AS development
RUN npm install -g concurrently
EXPOSE 3000 3010
# Run backend on 3010, frontend on 3000
CMD ["concurrently", "-k", "\"npm run server\"", "\"npm run dev -- --host\""]

FROM base AS production
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "server"]
