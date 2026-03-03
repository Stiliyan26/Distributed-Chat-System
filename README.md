# Distributed Chat System

> *Dedicated to the memory of my father, Ventsislav.*

A production-grade real-time distributed chat system built with microservices architecture. 7 services, event-driven message pipeline, dynamic Pub/Sub fan-out, multi-device presence tracking with crash recovery, and polyglot persistence — all containerized with Docker.

## Tech Stack

**Runtime:** Node.js · NestJS · TypeScript  
**Monorepo:** Nx  
**Databases:** PostgreSQL (Auth, Channel) · PostgreSQL (Messages)  
**Cache / Presence:** Redis  
**Message Broker:** Apache Kafka  
**Real-time:** Socket.IO (WebSocket)  
**Pub/Sub:** Redis Pub/Sub  
**Infrastructure:** Docker · Docker Compose

---

## Architecture Overview

```
┌──────────┐         ┌──────────────┐
│  Client  │◄──REST──►│ API Gateway  │──── JWT validation ────►  Auth / Channel / Messaging API
│ (Browser)│         │   (3000)     │
└────┬─────┘         └──────────────┘
     │
     │  WebSocket (Socket.IO)
     │  Direct connection — bypasses API Gateway
     ▼
┌──────────────┐        ┌─────────────────┐
│ Chat Service │◄──────►│  Redis Pub/Sub  │
│   (3003)     │ subscribe/receive   │  (Fan-out)        │
│ Socket.IO    │        └─────────────────┘
│ + JWT auth   │                ▲
└──────┬───────┘                │ publish
       │                 ┌──────┴──────────────┐
       │                 │ Messaging Service    │──► Presence Service ──► Redis
       │                 │  (Kafka consumer)    │──► Channel Service  ──► PostgreSQL
       │                 └────────▲─────────────┘──► Notification Svc ──► Email
       │                          │
       ▼                   ┌──────┴──────┐
┌──────────────┐           │    Kafka    │
│ Messaging API│──publish──►│  (messages  │
│   (3004)     │           │   topic)    │
│  202 Accepted│           └─────────────┘
└──────────────┘
```

---

## Services

| Service | Port | Database | Role |
|---------|------|----------|------|
| API Gateway | 3000 | — | JWT validation, REST routing, header injection (x-user-id, x-username) |
| Auth Service | 3001 | PostgreSQL | Registration, login, JWT generation (shared secret, 1-year expiry) |
| Channel Service | 3002 | PostgreSQL | Channel CRUD, member management, provides member lists to other services |
| Chat Service | 3003 | Redis Pub/Sub | WebSocket connections (Socket.IO), dynamic topic subscription, in-memory connection maps |
| Messaging Service | 3004 | PostgreSQL + Kafka | Two entry points: messaging-api (HTTP) + messaging-worker (Kafka consumer) |
| Presence Service | 3005 | Redis | Online/offline tracking, TTL heartbeats, multi-device connection counters |
| Notification Service | 3006 | — | Receives constructed payloads, publishes to Redis Pub/Sub + sends email for offline users |

---

## Key Architectural Decisions

### 1. Hybrid Dynamic Pub/Sub Subscription (Strategy C)

**Problem:** Broadcasting every message to every Chat Service instance wastes resources at scale. Connection-aware routing adds complexity and a presence lookup on the hot path.

**Solution:** Each Chat Service instance dynamically subscribes only to Redis Pub/Sub topics for channels where it currently has connected users. Topics are ephemeral — they exist only while at least one subscriber exists.

**Why it matters:** Combines the simplicity of Pub/Sub (one publish, multiple receivers) with the efficiency of targeted delivery (only relevant instances receive messages). This is how Discord and Slack handle message fan-out at scale.

```
User joins "investments" on Chat Service 1
  → Chat Service 1 subscribes to topic "channel:investments"
  
User leaves, no one else on this instance in that channel
  → Chat Service 1 unsubscribes from "channel:investments"

Message published to "channel:investments"
  → Only subscribed instances receive it
```

### 2. Dual-Path Communication: REST vs WebSocket

**Problem:** The mentor's philosophy of services not knowing about each other conflicts with the need for low-latency real-time delivery.

**Solution:** Two communication strategies depending on the path:

- **North-South (client ↔ system):** REST through API Gateway for reads and commands. API Gateway validates JWT, injects user headers, routes to services.
- **East-West (service ↔ service):** Direct calls over Docker network for the hot path. No internal gateway — zero extra hops on the message delivery path.
- **WebSocket:** Client connects directly to Chat Service, bypassing API Gateway entirely. Socket.IO middleware validates JWT during handshake.

**Why not proxy WebSocket through API Gateway?** Socket.IO uses Engine.IO under the hood with a complex handshake protocol (HTTP long-polling → WebSocket upgrade, custom packet encoding like `42["event", data]`). Proxying this through Express with http-proxy-middleware is fragile. Socket.IO's `io.use()` middleware is purpose-built for auth during handshake.

### 3. Messaging Service: Two Processes, One Codebase (Option C)

**Problem:** The Messaging Service needs to both accept HTTP requests (fast) and process messages from a queue (heavy orchestration). Coupling them means you can't scale independently.

**Solution:** Single NestJS project with two entry points:

- **messaging-api** (`main.ts`) — HTTP server. Validates input, generates messageId + timestamp, publishes to Kafka, returns **202 Accepted** immediately. Thin and fast.
- **messaging-worker** (`worker.ts`) — Kafka consumer, **no HTTP server**. Uses `NestFactory.createApplicationContext()`. The Messaging Service does the heavy lifting: store in DB, get channel members, check presence, publish to Pub/Sub, send to Notification Service.

**Scaling:** `docker-compose up --scale messaging-worker=3` adds queue processing power without spinning up unnecessary HTTP servers. `--scale messaging-api=2` handles HTTP spikes without adding redundant consumers.

### 4. Kafka Over BullMQ for Message Persistence

**Problem:** Losing chat messages is unacceptable. BullMQ uses Redis as backend — if Redis crashes or restarts, unprocessed jobs can be lost.

**Solution:** Kafka writes every message to disk immediately and replicates across brokers. Messages are retained even after consumption (configurable retention). If a worker crashes mid-processing, the offset hasn't been committed — another worker picks it up.

**Partition key:** `channelId` — guarantees all messages for the same channel are processed in order (same partition = ordered consumption). With 3 partitions, up to 3 workers can consume in parallel.

**Idempotent writes:** Because Kafka may redeliver, the DB insert uses `ON CONFLICT (id) DO NOTHING` — same message consumed twice, only one row in the database.

### 5. Multi-Device Presence with Crash Recovery

**Problem:** Users connect from multiple devices (phone + laptop). Naive presence tracking marks a user offline when any single device disconnects. Also, if a Chat Service instance crashes without sending disconnect events, presence data becomes stale.

**Solution:**

- **Connection counters per user per channel:** `HINCRBY channel:investments:user_connections "stiliyan" 1` on join, `-1` on leave. User removed from online set only when counter reaches zero. Phone disconnects but laptop is still there → user stays online.
- **TTL-based heartbeats:** Each connection has a Redis key with 30-second TTL. Chat Service refreshes every 10 seconds. If Chat Service crashes → no heartbeats → TTL expires → stale presence auto-cleans within 30 seconds.

```
Redis Presence Model:
  user:{userId}:online           → STRING "true" TTL 30s
  channel:{channelId}:online     → SET of userIds  
  channel:{channelId}:user_connections → HASH { userId: connectionCount }
  heartbeat:{connectionId}       → STRING "1" TTL 30s
```

### 6. Messaging Service as Orchestrator — Constructed Payloads

**Problem:** If the Notification Service needs to send an email, it would need to know about Auth Service (emails), Channel Service (channel names), and Presence Service (who's offline). That's three domain dependencies for a service whose job is "send email."

**Solution:** The Messaging Service orchestrates everything. It gathers channel members from Channel Service, checks presence from Presence Service, then hands off **fully constructed payloads** to downstream services:

- **Redis Pub/Sub:** `{ senderId, content, channelId, messageId, createdAt }` — Chat Service instances just deliver, no lookups needed.
- **Notification Service:** `{ to: "bogdan@email.com", subject: "New message in investments", body: "Peter said: hey" }` — zero domain knowledge, just sends email.

This follows the principle: **commands and events flow directly between services, queries and composed reads go through an orchestration layer.**

### 7. Chat Service In-Memory State Architecture

Each Chat Service instance maintains three data structures that serve as reverse lookups of each other:

```typescript
// Who is this connection? (for switch/disconnect cleanup)
connections: Map<connectionId, { userId, username, activeChannel }>

// Which connections should receive messages for this channel?
channelConnections: Map<channelId, Set<connectionId>>

// Which Pub/Sub topics is this instance subscribed to?
subscribedTopics: Set<string>
```

**Why all three?** When a message arrives from Pub/Sub → `channelConnections` finds the right WebSocket connections. When a user disconnects → `connections` identifies who they were and which channel to clean up. When the last user leaves a channel → `subscribedTopics` knows to unsubscribe.

### 8. Socket.IO Auth: Direct JWT Validation

```typescript
// Chat Service — Socket.IO middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
```

Both API Gateway and Chat Service share the same `JWT_SECRET` environment variable. REST goes through the gateway; WebSocket authenticates directly at the Chat Service during the Socket.IO handshake.

### 9. Polyglot Persistence

Each service uses the database that fits its data model:

| Service | Database | Why |
|---------|----------|-----|
| Auth | PostgreSQL | Relational: users with unique constraints |
| Channel | PostgreSQL | Relational: many-to-many channels ↔ members via join table |
| Messaging | PostgreSQL | Structured messages with composite index on `(channelId, createdAt DESC)` for cursor-based pagination |
| Presence | Redis | In-memory: sub-millisecond SET/GET, native TTL for heartbeat expiry, SET data type for online user tracking |

**Redis Pub/Sub** is used for real-time fan-out (ephemeral, no persistence — messages are already stored in PostgreSQL). **Kafka** is used for the message pipeline (persistent, ordered, replayable).

### 10. Cursor-Based Pagination for Chat History

```
GET /messages/:channelId?limit=50&before=2026-02-10T12:00:00Z
```

Uses `before` timestamp instead of offset-based pagination. Why: when new messages arrive while a user scrolls up, offset-based pagination shows duplicate messages (the window shifts). Cursor-based pagination with `createdAt < :before` is stable regardless of new inserts.

---

## Message Delivery Flow (End-to-End)

```
1. Peter types "hey everyone" in "investments" channel
2. Client sends WebSocket event → Chat Service
3. Chat Service calls POST /messages on Messaging API
     → messaging-api validates, generates messageId, publishes to Kafka
     → returns 202 Accepted
4. Chat Service sends { event: "message_sent", messageId } back to Peter (optimistic UI)
5. Messaging Service consumes from Kafka:
     a. INSERT message into PostgreSQL (idempotent: ON CONFLICT DO NOTHING)
     b. GET /channels/:channelId/members → [stiliyan, peter, bogdan]
     c. GET /presence/users/status?userIds=... → { online: [stiliyan, peter], offline: [bogdan] }
     d. PUBLISH to Redis Pub/Sub "channel:investments" → Chat Service instances deliver via WebSocket
     e. POST to Notification Service → email sent to bogdan with constructed payload
```

**Durability guarantee:** Message is safe from the moment Kafka acknowledges the publish. If Messaging Service crashes before DB write → Kafka redelivers (offset not committed). If it crashes after DB write but before offset commit → Kafka redelivers → idempotent insert ignores duplicate.

---

## Crash Recovery

| Component | Failure Mode | Recovery |
|-----------|-------------|----------|
| Chat Service | Instance crashes | Client auto-reconnects (exponential backoff). Load balancer routes to healthy instance. Stale presence expires via TTL in ≤30s. Redis Pub/Sub auto-detects subscriber gone. |
| Messaging Service | Crashes mid-processing | Kafka redelivers unprocessed messages (offset not committed). Idempotent DB writes prevent duplicates. |
| Redis (Presence) | Crashes | Chat Service continues working (Pub/Sub still delivers). Presence rebuilds as connections send heartbeats and join/leave events. |
| Kafka | Broker crashes | Messages already persisted to disk survive restarts. messaging-api returns 500 until Kafka recovers. |
| PostgreSQL | Crashes | Services return 500. On recovery, all data intact (WAL guarantees). |

---

## Project Structure (Nx Monorepo)

```
services/
  api-gateway/          ← NestJS HTTP server
  auth/                 ← NestJS + PostgreSQL
  channel/              ← NestJS + PostgreSQL
  chat/                 ← NestJS + Socket.IO + Redis Pub/Sub
  messaging/            ← Two entry points (main.ts + worker.ts) + PostgreSQL + Kafka
  presence/             ← NestJS + Redis
  notification/         ← NestJS + Redis Pub/Sub + Email
```
