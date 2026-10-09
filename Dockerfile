FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY start.sh ./
RUN chmod +x start.sh

RUN mkdir -p /app/data
ENV DATA_DIR=/app/data
ENV PORT=80

EXPOSE 80 6061

CMD ["sh", "start.sh"]