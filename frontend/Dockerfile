FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install --production
COPY . /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
