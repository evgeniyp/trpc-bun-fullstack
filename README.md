# TRPC Bun Fullstack App (boilerplate)

Fullstack app with Bun, tRPC, React, and Mantine UI.

## Stack

- [Bun](https://bun.sh) — runtime, bundler, package manager
- [tRPC](https://trpc.io) — end-to-end typesafe APIs
- [React](https://react.dev) + [TanStack Query](https://tanstack.com/query) — frontend
- [Mantine](https://mantine.dev) — UI components, dark mode
- [Drizzle ORM](https://orm.drizzle.team) + SQLite — database
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

## Database

SQLite via [Drizzle ORM](https://orm.drizzle.team). File stored in `local.db` (gitignored). Migrations in `drizzle/`.

Edit schema in `server/db/schema.ts`, then:

```sh
bun db:generate  # generate migration
bun db:migrate   # apply to local.db
```

## Production

```sh
bun start
```
