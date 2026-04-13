# TRPC Bun Fullstack App (boilerplate)

Fullstack app with Bun, tRPC, React, and Mantine UI.

## Stack

- [Bun](https://bun.sh) — runtime, bundler, package manager
- [tRPC](https://trpc.io) — end-to-end typesafe APIs
- [React](https://react.dev) + [TanStack Query](https://tanstack.com/query) — frontend
- [Mantine](https://mantine.dev) — UI components, dark mode
- [Biome](https://biomejs.dev) — linting and formatting (`bun run check`)

## Setup

```sh
bun install
```

## Check (lint & fix)

```sh
bun check
```

## Dev

```sh
bun dev
```

Serves frontend and backend on `http://localhost:3000` with hot reloading.

- Frontend: `/`
- tRPC: `/trpc/*`

## Production

```sh
bun start
```
