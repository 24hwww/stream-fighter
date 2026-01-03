FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

FROM base AS development
RUN npm install -g concurrently
EXPOSE 3000 5173
# Run backend on 3000, frontend on 5173
CMD ["concurrently", "-k", "\"npm run server\"", "\"npm run dev -- --host\""]

FROM base AS production
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "server"]
