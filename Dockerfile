FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun install

EXPOSE 80 443 3333

ENTRYPOINT ["bun", "./src/main.ts"]