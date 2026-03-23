<p align="center">
  <h1 align="center">Sprava API</h1>
  <p align="center">Real-time conversational API built with TypeScript</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Cloudflare_R2-F38020?logo=cloudflare&logoColor=white" alt="R2" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <a href="https://github.com/daniilsys/sprava-api/actions/workflows/deploy.yml">
    <img src="https://github.com/daniilsys/sprava-api/actions/workflows/deploy.yml/badge.svg" alt="CI/CD" />
  </a>
  <img src="https://img.shields.io/badge/node-22+-339933?logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## Features

| Category | Details |
|----------|---------|
| **Auth** | Register, login, JWT access + refresh token rotation, logout |
| **Users** | Profile management, avatar upload, search with block filtering |
| **Conversations** | DMs and groups (max 50 members), ownership transfer, member management |
| **Messages** | Send, edit, soft-delete, replies, cursor-based pagination |
| **Attachments** | File and voice message uploads via Cloudflare R2, orphan auto-cleanup |
| **Reactions** | Unicode emoji reactions on messages, grouped by emoji in output |
| **Read States** | Per-conversation read tracking, unread counts |
| **Friends** | Requests with auto-accept on cross-request, accept/decline/cancel |
| **Blocks** | Bidirectional blocking, DM restrictions, search filtering |
| **Real-time** | Socket.IO — typing, presence, messages, reactions, read states |
| **Rate Limiting** | IP-based (auth) + user-based (authenticated) via Redis |

## Documentation

<table>
  <tr>
    <th></th>
    <th>English</th>
    <th>French</th>
  </tr>
  <tr>
    <td><strong>REST API</strong></td>
    <td><a href="docs/en/API.md">docs/en/API.md</a></td>
    <td><a href="docs/fr/API.md">docs/fr/API.md</a></td>
  </tr>
  <tr>
    <td><strong>Socket.IO</strong></td>
    <td><a href="docs/en/SOCKET.md">docs/en/SOCKET.md</a></td>
    <td><a href="docs/fr/SOCKET.md">docs/fr/SOCKET.md</a></td>
  </tr>
  <tr>
    <td><strong>Response Examples</strong></td>
    <td><a href="docs/en/EXAMPLES.md">docs/en/EXAMPLES.md</a></td>
    <td><a href="docs/fr/EXAMPLES.md">docs/fr/EXAMPLES.md</a></td>
  </tr>
</table>

## Tech Stack

```
Node.js 22  ·  Express 5  ·  TypeScript 5  ·  Prisma 7  ·  PostgreSQL 17
Redis 7  ·  Socket.IO 4  ·  Cloudflare R2  ·  Zod 4  ·  Vitest  ·  Docker
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 17
- Redis 7

### Development

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sprava"

JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

REDIS_URL="redis://localhost:6379"

R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-key"
R2_SECRET_ACCESS_KEY="your-secret"
R2_BUCKET="your-bucket"
R2_PUBLIC_URL="https://your-cdn.example.com"

PORT=3000
NODE_ENV="development"
```

### Docker (Production)

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
```

### Testing

```bash
pnpm test              # All tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests only
pnpm test:watch        # Watch mode
```

## Project Structure

```
src/
  config/       Database, Redis, S3, environment
  cron/         Scheduled tasks (orphan cleanup)
  mappers/      Output normalization
  middleware/   Auth, validation, rate limiting, upload, errors
  routes/       Express route handlers
  schemas/      Zod validation schemas
  services/     Business logic
  socket/       Socket.IO init and event emitters
  utils/        JWT, passwords, snowflake IDs, error classes
tests/
  unit/         Pure function tests
  integration/  API endpoint tests
  mocks/        Shared mocks (Prisma, Redis, Socket.IO)
docs/
  en/           English documentation
  fr/           French documentation
```

## API Overview

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /users/me
PATCH  /users/me
GET    /users/search?q=
GET    /users/:id

POST   /conversations
GET    /conversations
GET    /conversations/unread/counts
GET    /conversations/:id
POST   /conversations/:id/members
DELETE /conversations/:id/members/:userId
PUT    /conversations/:id/owner
POST   /conversations/:id/leave
PUT    /conversations/:id/read
GET    /conversations/:id/readstates

POST   /messages
GET    /messages/:conversationId
PATCH  /messages/:id
DELETE /messages/:id
PUT    /messages/:messageId/reactions/:emoji
DELETE /messages/:messageId/reactions/:emoji
GET    /messages/:messageId/reactions

PUT    /upload/avatar
PUT    /upload/conversations/:id/icon
POST   /upload/attachments

GET    /friends
DELETE /friends/:friendId
GET    /friends/requests/pending
GET    /friends/requests/sent
POST   /friends/requests/:userId
POST   /friends/requests/:requestId/accept
POST   /friends/requests/:requestId/decline
DELETE /friends/requests/:requestId
GET    /friends/blocked
POST   /friends/block/:userId
DELETE /friends/block/:userId
```

## License

[MIT](LICENSE)
