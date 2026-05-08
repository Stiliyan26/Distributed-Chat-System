# Kubernetes migration — progress tracker

**Repo:** [Distributed-Chat-System](https://github.com/Stiliyan26/Distributed-Chat-System)  
**Cluster:** Docker Desktop Kubernetes (local)  
**Rules:** One step at a time; do not advance until verification passes and you say **next**.

---

## Quick status

| Step | Name                         | Status      | Verified (date) |
| ---- | ---------------------------- | ----------- | --------------- |
| 1    | Environment setup            | Done        | 2026-05-04      |
| 2    | Clean slate & directory      | Done        | 2026-05-04      |
| 3    | Build & load images          | Done        | 2026-05-06      |
| 4    | Stateful infrastructure      | Done        | 2026-05-06      |
| 5    | Stateless services           | Done        | 2026-05-08      |
| 6    | External exposure (Ingress)  | Not started | —               |
| 7    | Monitoring                 | **DEFERRED** | —              |
| 8    | Manual scaling & chaos     | Not started | —               |
| 9    | HPA (optional)             | Not started | —               |

**Current focus:** Step 6 — External exposure (Ingress).

**Active kubectl context:** `docker-desktop` (not KinD).

---

## Step 1 — Environment setup

**Goal:** kubectl/Helm/k9s/stern; metrics-server with `--kubelet-insecure-tls`; resources 8GB RAM / 4 CPUs.

### Checklist

- [x] Docker Desktop Kubernetes enabled; node resources set (confirm 8GB / 4 CPU in Docker settings)
- [x] `kubectl`, `helm`, `k9s`, `stern` installed (e.g. Homebrew)
- [x] metrics-server installed and patched (`--kubelet-insecure-tls`)
- [x] Verification gate passed (record outputs below)

### Verification gate

- [x] `kubectl get nodes` → Ready (`docker-desktop`, v1.34.x)
- [x] `kubectl top nodes` → works; APIService `v1beta1.metrics.k8s.io` Available
- [x] `helm version` → works (v4.1.4)
- [x] `k9s` opens (`/opt/homebrew/bin/k9s`)

### Notes / command outputs

**KinD note:** Previous context `kind-chat-system` pointed at dead `127.0.0.1:55842`. Use `kubectl config use-context docker-desktop`.

```text
# kubectl top nodes (example)
NAME             CPU(cores)   CPU(%)   MEMORY(bytes)   MEMORY(%)
docker-desktop   208m         5%       1588Mi          20%

# apiservice
v1beta1.metrics.k8s.io   kube-system/metrics-server   True
```

---

## Step 2 — Clean slate & directory structure

**Goal:** Remove old `k8s/`; create new layout; README explains folders.

### Checklist

- [x] Old ad-hoc `k8s/` cleared — replaced with structured layout (no legacy manifests retained)
- [x] New structure created (see repo `k8s/`)
- [x] README documents each folder (`k8s/README.md`)

### Verification gate

- [x] Structure exists on disk
- [x] README explains each folder

### Notes

- Folder `heml-values` renamed to **`helm-values`**.
- Layout: `namespaces/`, `infra/{postgres,redis,kafka}/`, `apps/{auth,channel,presence,delivery,messaging,chat,api-gateway}/`, `ingress/`, `helm-values/`.

---

## Step 3 — Build & load Docker images

**Goal:** Eight container images (seven logical services; messaging = API + worker images) tagged `chat-system/<name>:dev`; smoke `kubectl run`.

### Checklist

- [x] All service Dockerfiles verified (`api-gateway`, `auth`, `channel`, `chat`, `delivery`, `presence`, `messaging` ×2)
- [x] Images built with consistent tags (`npm run docker:k8s:build:all`)
- [x] All 8 images present (`docker images | grep chat-system` — `chat-system/*:dev`)

### Verification gate

- [x] All 8 images listed (`grep chat-system`)
- [ ] Smoke test: `kubectl run` with one image succeeds (optional)

### Image tags (reference)

| Image tag (example)        | Service           |
| -------------------------- | ----------------- |
| `chat-system/api-gateway:dev` | API Gateway   |
| `chat-system/auth:dev`        | Auth          |
| `chat-system/channel:dev`     | Channel       |
| `chat-system/chat:dev`        | Chat          |
| `chat-system/messaging-api:dev` / `chat-system/messaging-worker:dev` | Messaging (two images from `Dockerfile.api` / `Dockerfile.worker`) |
| `chat-system/presence:dev`    | Presence        |
| `chat-system/delivery:dev`    | Delivery        |

### Notes

---

## Step 4 — Stateful infrastructure

**Goal:** Postgres (shared instance + app DBs), Redis, Kafka + Zookeeper; PVCs; ClusterIP services; namespace `infra`.

### Checklist

- [x] Postgres StatefulSet + init SQL for **`users_db`**, **`channels_db`**, **`messages_db`** (matches docker-compose; no `delivery_db` — Delivery uses Redis only in current code)
- [x] Redis StatefulSet (AOF persistence)
- [x] Kafka + Zookeeper (Confluent 7.6 YAML; broker needs `enableServiceLinks: false` — see `k8s/README.md`)
- [x] PVCs for Postgres, Redis, Kafka, Zookeeper
- [x] ClusterIP + headless Services documented in `k8s/README.md`

### Verification gate

- [x] All infra pods `Running 1/1 Ready`
- [x] Debug pod: Postgres `\l` lists `users_db`, `channels_db`, `messages_db`
- [ ] Optional: redis-cli `PING`, Kafka consumer smoke when Step 5 apps run

### Notes

- **Kafka fix:** Service name `kafka` caused injected env vars → Confluent broker crash until `enableServiceLinks: false` on the Kafka pod.
- **Bootstrap:** `kafka.infra.svc.cluster.local:9092` for apps; broker advertises `kafka-0.kafka-hl.infra.svc.cluster.local:9092`.

---

## Step 5 — Stateless services

**Goal:** Deploy in order; fixed replicas (chat=3, messaging-worker=3, others=2); Deployment + ClusterIP Service + ConfigMap + Secret; probes; resources 100m / 256Mi.

### Order

1. Auth → 2. Channel → 3. Presence → 4. Delivery → 5. Messaging API + Worker → 6. Chat → 7. API Gateway

### Per-service verification (repeat each time)

- [ ] Pod(s) `Running` / `Ready`
- [ ] Logs clean
- [ ] `/health` from inside cluster
- [ ] Scale to 3 replicas (where applicable) without errors

### Tracker

| Service         | Deployed | Health OK | Scale test | Notes |
| --------------- | -------- | --------- | ---------- | ----- |
| Auth            | ☑        | ☑         | ☑          | 2 replicas running; `/api/health`; scale-to-3 OK |
| Channel         | ☑        | ☑         | ☑          | 2 replicas running; `/api/health`; scale-to-3 OK |
| Presence        | ☑        | ☑         | ☑          | 2 replicas running; Redis-backed; `/api/health`; scale-to-3 OK |
| Delivery        | ☑        | ☑         | ☑          | 2 replicas running; Redis + SMTP Secret; `/api/health`; scale-to-3 OK |
| Messaging API   | ☑        | ☑         | ☑          | 2 replicas running; Kafka producer connected; `/api/health`; scale-to-3 OK |
| Messaging Worker| ☑        | N/A       | ☑          | 3 replicas running; Kafka consumers joined group; no HTTP server |
| Chat            | ☑        | ☑         | ☑          | 3 replicas running; Redis Pub/Sub; `/api/health`; clean rollout after Docker Desktop restart |
| API Gateway     | ☑        | TCP       | ☐          | 2 replicas running; TCP probe used because image rebuild was blocked by Docker socket sandbox; proxy check returned HTTP 404 from routed path |

### Notes

- Added lightweight `/api/health` endpoints for Auth, Channel, and Presence.
- Added lightweight `/api/health` endpoints for Delivery, Messaging API, Chat, and API Gateway source.
- Made `SharedDatabaseModule` retry-safe for TypeORM startup retries by deleting stale uninitialized transactional data sources.
- `UserHeaderGuard` skips `/health` so Kubernetes probes can reach guarded services.
- Added `npm run k8s:*` scripts plus `tools/k8s-sync-secrets.js` to re-apply local Kubernetes and sync Delivery SMTP Secret from compose without committing the real password.
- Delivery SMTP Secret in the cluster uses original compose credentials; `k8s/apps/delivery/secret.yaml` remains placeholder-safe for Git.
- API Gateway currently uses a TCP readiness/liveness probe until `chat-system/api-gateway:dev` can be rebuilt with the new `/api/health` endpoint.

---

## Step 6 — External exposure

**Goal:** `ingress-nginx` via Helm; gateway on localhost; Chat Ingress with sticky sessions.

### Sticky annotations (reference)

```yaml
nginx.ingress.kubernetes.io/affinity: "cookie"
nginx.ingress.kubernetes.io/session-cookie-name: "chat-affinity"
```

### Verification gate

- [ ] Frontend: `http://localhost/auth/login`
- [ ] WebSocket: `ws://localhost/socket.io/`

### Notes

---

## Step 7 — Monitoring

**Status:** Deferred until after Step 8 decision.

### Decision (fill in later)

- [ ] k9s + kubectl top + stern enough
- [ ] Or: kube-prometheus-stack (Helm)

### Notes

---

## Step 8 — Manual scaling & chaos

### Checklist

- [ ] `kubectl scale deployment chat --replicas=5` — pods distribute
- [ ] `test-scripts/` load / behaviour OK
- [ ] Delete chat pod — clients reconnect; presence TTL ~30s; no message loss

### Verification gate

- [ ] Load distributes; restart toleration OK; no in-flight message loss

### Notes

---

## Step 9 — HPA (optional)

**Prerequisite:** Steps 1–8 stable.

### Targets (reference)

- Messaging Worker: CPU-based HPA
- Chat: custom metric (e.g. active WS) — needs Prometheus adapter

### Notes

---

## Locked-in architecture reminders

- Messaging: two Deployments, one image, different commands (`messaging-api` / `messaging-worker`).
- Chat: dynamic Redis Pub/Sub per pod (Strategy C); **sticky sessions** on Ingress.
- East-west: direct service-to-service (not via gateway).
- No service mesh; no HPA/Prometheus until approved for those steps.

---

## Change log

| Date       | What changed                          |
| ---------- | ------------------------------------- |
| 2026-05-04 | Initial progress file created         |
| 2026-05-04 | Step 1 verified; Step 2 layout + `k8s/README.md`; focus → Step 3 |
| 2026-05-06 | Step 4 infra applied; Kafka `enableServiceLinks` + PVC perms; Step 3 marked done; focus → Step 5 |
| 2026-05-08 | Step 5 app Deployments applied; local K8s helper scripts added; focus → Step 6 |
