FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
CMD ["sh", "-c", "bun start"]
