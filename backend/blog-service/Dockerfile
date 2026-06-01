FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --audit=false --fund=false --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=300000 \
  && node -e "Promise.all(['express','cors'].map((m)=>import(m))).catch((error)=>{console.error(error);process.exit(1)})"

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3007

CMD ["npm", "start"]
