# Messaging Service Setup Guide: Separate Worker & API

This guide walks through setting up the messaging service with **two separate entry points**:
1. **messaging-api** - HTTP server (producer)
2. **messaging-worker** - Kafka consumer (background processor)

Both run as separate Docker containers from the same codebase.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│   One NestJS Project (services/messaging)   │
├─────────────────────────────────────────────┤
│                                             │
│  src/                                       │
│  ├── main.ts          ← API entry point     │
│  ├── worker.ts        ← Worker entry point  │
│  ├── app.module.ts    ← API module          │
│  ├── worker.module.ts ← Worker module       │
│  ├── config/          ← Shared config       │
│  └── messages/        ← Shared logic        │
│                                             │
└─────────────────────────────────────────────┘
         ↓
    Docker Build
         ↓
┌─────────────────────┐    ┌──────────────────┐
│  messaging-api      │    │ messaging-worker │
│  (HTTP Server)      │    │ (Kafka Consumer) │
│  Port: 3002         │    │ (No exposed port)│
└─────────────────────┘    └──────────────────┘
```

**Why one NestJS project with two entry points?**
- Shared entities, DTOs, and configuration
- Single build output consumed by both containers
- Easier to maintain consistency
- Both use the same dependencies

---

## Phase 1: Project Structure & Configuration

### Step 1.1: Understand the Current Files

Before making changes, familiarize yourself with:

```
services/messaging/src/
├── main.ts                      # Currently: basic NestJS server
├── worker.ts                    # Currently: empty
├── app.module.ts                # Currently: demo app with AppController
├── worker.module.ts             # Currently: empty
├── config/
│   ├── database.config.ts       # TypeORM config (has syntax errors - check it!)
│   └── kafka.config.ts          # Empty - needs Kafka client setup
└── messages/
    ├── message.entity.ts        # TypeORM entity
    ├── message.dto.ts           # Validation DTO
    ├── message.controller.ts    # HTTP endpoint
    ├── message.producer.service.ts   # Publishes to Kafka
    ├── message.consumer.service.ts   # Consumes from Kafka
    └── message.repository.service.ts # DB operations
```

**Action**: Open each file. Note what's implemented vs. what's a stub.

### Step 1.2: Fix Syntax Error in database.config.ts

Look at `services/messaging/src/config/database.config.ts`. You'll see incomplete code.

**Question for you**: What's missing? Look at a TypeORM config and compare with the NestJS TypeORM docs.

Once you identify the issue, fix it. This file is **shared between API and worker**.

---

## Phase 2: Kafka Configuration

### Step 2.1: Create kafka.config.ts

The `kafka.config.ts` file is currently empty. This needs to export a configuration object.

**Questions to think about**:
1. What connection details does KafkaJS need?
2. What environment variables should you use? (Don't hardcode!)
3. Should Kafka retry failed connections? How many times?

**Action**: Create this file with the necessary exports.

### Step 2.2: Understand the Kafka Producer/Consumer

Look at the already-created files:
- `message.producer.service.ts` - Uses KafkaJS to publish
- `message.consumer.service.ts` - Uses KafkaJS to consume

**Question**: How does the producer know which topic to publish to? How does the consumer know which topic to subscribe to? (Hint: check `KAFKA_CONFIG`)

---

## Phase 3: Database Setup (TypeORM)

### Step 3.1: Configure TypeORM for API

The API (`main.ts`) doesn't import any database module. It needs to connect to PostgreSQL **only if** it needs to query data.

**Question**: Does the API *need* to access PostgreSQL? Or does it just publish to Kafka and return immediately?

### Step 3.2: Configure TypeORM for Worker

The worker **must** connect to PostgreSQL because it writes messages to the database.

`worker.module.ts` is currently empty. This needs:
1. Import TypeOrmModule and configure it
2. Register the MessageEntity
3. Import services that use the database

---

## Phase 4: API Entry Point (messaging-api)

### Step 4.1: Update main.ts

Currently, `main.ts` creates a basic NestJS app. Update it to:
1. Create the app with AppModule
2. Add validation pipe for DTOs
3. Listen on port 3002
4. Add logging

**Questions**:
- Why use ValidationPipe? What does it do?
- Should it be global or per-route?

### Step 4.2: Update app.module.ts

Currently imports demo controllers. Replace with:
1. Import MessageController
2. Import MessageProducerService
3. Import Kafka config (as a provider if needed)

**Action**: Update this file.

---

## Phase 5: Worker Entry Point (messaging-worker)

### Step 5.1: Update worker.ts

Currently empty. This should:
1. Create an application context (not a full HTTP server)
2. Load WorkerModule
3. Start consuming from Kafka

**Why application context instead of full app?** The worker doesn't need HTTP routes—it just needs NestJS dependency injection.

### Step 5.2: Update worker.module.ts

Currently empty. This should:
1. Import TypeOrmModule and configure database
2. Register MessageEntity
3. Import MessageConsumerService
4. Import MessageRepositoryService

**Question**: Why is the worker module different from the API module?

---

## Phase 6: Docker Setup

### Step 6.1: Create Dockerfile

You need a single Dockerfile that can build both entry points.

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy built application
COPY dist/services/messaging ./

# Default to API (can be overridden in docker-compose)
CMD ["node", "main.js"]
```

**Questions**:
- Why `npm ci` instead of `npm install`?
- What does `--omit=dev` do?
- How does the Dockerfile determine whether to run main.js or worker.js?

### Step 6.2: Update docker-compose.yml

Add services for:
1. **zookeeper** - Kafka dependency
2. **kafka** - Message broker
3. **postgres** - Message database
4. **messaging-api** - HTTP server
5. **messaging-worker** - Kafka consumer

**Points to consider**:
- Which service should start first? (dependency order)
- Environment variables for each container
- Port mappings (only API needs an exposed port)
- Health checks

---

## Phase 7: Build & Entry Point Configuration

### Step 7.1: Update webpack.config.js (if needed)

Check if your webpack config supports multiple entry points. You might need:
- Entry: `{ api: './src/main.ts', worker: './src/worker.ts' }`
- Output: Two separate bundles

**Or**: Use the NestJS builder via Nx. Check `project.json`.

### Step 7.2: Update Nx project.json

Currently has a single `serve` target. You might want:
- `serve:api` - Runs messaging-api
- `serve:worker` - Runs messaging-worker
- `build:api` - Builds only main.ts
- `build:worker` - Builds only worker.ts

Or keep a single build that outputs both entry points to dist.

---

## Summary of Files to Create/Modify

### Create/Fix:

1. **services/messaging/src/config/kafka.config.ts** - Kafka configuration
2. **services/messaging/Dockerfile** - Dockerfile for both entry points
3. **docker-compose.yml** - Updated with Kafka, PostgreSQL, and both services

### Modify:

1. **services/messaging/src/config/database.config.ts** - Fix syntax errors
2. **services/messaging/src/main.ts** - Update to proper API bootstrap
3. **services/messaging/src/worker.ts** - Update to worker bootstrap
4. **services/messaging/src/app.module.ts** - Replace demo with actual modules
5. **services/messaging/src/worker.module.ts** - Add database and consumer setup
6. **services/messaging/project.json** - Add worker-specific targets

---

## Order of Implementation

Follow this order for maximum clarity:

1. **Fix config files** (database.config.ts, kafka.config.ts)
2. **Update worker.ts and worker.module.ts** (simpler, no HTTP)
3. **Update main.ts and app.module.ts** (HTTP entry point)
4. **Create Dockerfile**
5. **Update docker-compose.yml**
6. **Update project.json** with build/serve targets

---

## Testing Checklist

Once everything is implemented:

- [ ] `npm run build` produces two runnable entry points
- [ ] `docker-compose up` starts Kafka, PostgreSQL, API, and Worker
- [ ] `curl -X POST http://localhost:3002/messages ...` returns 202
- [ ] Worker consumes the message and logs it
- [ ] PostgreSQL has the message in the `messages` table
- [ ] Stopping worker and restarting reprocesses unacknowledged messages

---

## Key Concepts to Remember

**Shared Code**: DTOs, Entities, Config → used by both API and Worker

**API-Only**: HTTP Controllers, Producers, ValidationPipe

**Worker-Only**: Kafka Consumers, Repository operations, no HTTP

**Environment Variables**: Read from `.env` and passed to containers

**Durability**: Kafka persists messages even if worker crashes
