# Bun Fullstack App (boilerplate)

Fullstack app with Bun, React, and Mantine UI.

## Stack

- [Bun](https://bun.sh) — runtime, bundler, package manager
- [React](https://react.dev) — frontend
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

## Run

Prod mode with hot reload, no HMR:
```sh
bun start
```

Dev mode with hot reload and HMR:
```sh
bun dev
```

Serves frontend and backend on `http://localhost:3000`.

## Docker

```sh
docker compose up
```

Same hot-reload setup. Source is volume-mounted so edits on the host reflect immediately.
