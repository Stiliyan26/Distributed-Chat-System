# Kubernetes manifests (local Docker Desktop)

This tree holds manifests for the distributed chat system. **Apply order** matches cluster dependencies: namespaces → infrastructure → applications → ingress.

## Directory layout

| Path | Purpose |
|------|---------|
| `namespaces/` | Namespace definitions (e.g. `infra`, `apps` or a single combined namespace — align with your Step 4–5 choice). |
| `infra/` | **Stateful** stack: Postgres (three app DBs + defaults), Redis, Kafka + Zookeeper. |
| `infra/postgres/` | StatefulSet, Services, PVCs, init SQL for **`users_db`**, **`channels_db`**, **`messages_db`** (same names as `docker-compose`). Single shared Postgres. |
| `infra/redis/` | Redis StatefulSet + Service (Presence + Chat Pub/Sub). |
| `infra/kafka/` | Kafka + Zookeeper (raw YAML and/or install instructions referencing Bitnami Helm). |
| `apps/<service>/` | **Stateless** workloads: Deployment, ClusterIP Service, ConfigMap, Secret references per microservice. |
| `apps/auth/` | Auth service (deploy first among apps). |
| `apps/channel/` | Channel service. |
| `apps/presence/` | Presence service. |
| `apps/delivery/` | Delivery service. |
| `apps/messaging/` | **Two Deployments** (API + worker), same source repo; optional shared ConfigMap. |
| `apps/chat/` | Chat / Socket.IO — replicas with sticky Ingress in Step 6. |
| `apps/api-gateway/` | API Gateway — deploy last; faces clients via Ingress. |
| `ingress/` | `Ingress` resources (Step 6): REST via gateway, WebSocket with **cookie affinity** for `chat`. |
| `helm-values/` | Value files only (e.g. `ingress-nginx.yaml`, `kafka.yaml`) — no secrets committed. |

## Conventions

- **Image names:** `chat-system/<component>:dev` (see migration plan). Messaging uses **`messaging-api`** and **`messaging-worker`** images built from separate Dockerfiles in this repo.
- **In-cluster DNS:** Prefer stable Service names (e.g. `postgres.infra.svc.cluster.local` if namespace `infra`).
- **Secrets:** `infra/postgres/secret.yaml` contains **local-only** credentials matching docker-compose (`chat` / `chat-secret`). Replace for anything beyond local dev.

## Step 4 — Apply infrastructure (current)

From repo root, with context **`docker-desktop`**:

```bash
kubectl apply -f k8s/namespaces/infra.yaml
kubectl apply -f k8s/infra/postgres/
kubectl apply -f k8s/infra/redis/
kubectl apply -f k8s/infra/kafka/
kubectl get pods -n infra -w
```

Kafka may take **1–3 minutes** after Zookeeper is ready.

### Endpoints (namespace `infra`)

| Service    | DNS (FQDN)                              | Port |
| ---------- | --------------------------------------- | ---- |
| Postgres   | `postgres.infra.svc.cluster.local`      | 5432 |
| Redis      | `redis.infra.svc.cluster.local`         | 6379 |
| Kafka      | `kafka.infra.svc.cluster.local`         | 9092 |
| Zookeeper  | `zookeeper.infra.svc.cluster.local`     | 2181 |

**Messaging / workers (Step 5):** set `KAFKA_BROKER=kafka.infra.svc.cluster.local:9092` (not `29092` from compose).  
**Redis:** one instance for Presence + Chat + Delivery (`redis://redis.infra.svc.cluster.local:6379`).  
**Postgres:** Auth → `users_db`, Channel → `channels_db`, Messaging → `messages_db`. Delivery has **no** Postgres in the current codebase (Redis + SMTP only).

**Kafka (Confluent):** The broker pod sets **`enableServiceLinks: false`**. Otherwise Kubernetes injects link env vars for the **`kafka`** Service that confuse Confluent’s startup (`PORT is deprecated…` / immediate exit). The broker **advertises** `kafka-0.kafka-hl.infra.svc.cluster.local:9092`; clients still bootstrap via **`kafka.infra.svc.cluster.local:9092`** (ClusterIP Service).

### Verification snippets

```bash
kubectl get pods -n infra
# List databases (non-interactive):
kubectl run -n infra pg-check --restart=Never --image=postgres:16-alpine \
  --env="PGPASSWORD=chat-secret" --command -- psql -h postgres -U chat -d postgres -c '\l'
kubectl logs -n infra pg-check && kubectl delete pod -n infra pg-check --wait=false

# Redis PING
kubectl run -n infra redis-check --restart=Never --image=redis:7-alpine --command -- redis-cli -h redis ping
sleep 5 && kubectl logs -n infra redis-check && kubectl delete pod -n infra redis-check --wait=false
```

## Apply order (reference)

1. `namespaces/`
2. `infra/*` (Postgres → Redis → Kafka/ZK, or documented Helm install + minimal YAML)
3. `apps/` in order: auth → channel → presence → delivery → messaging (api + worker) → chat → api-gateway
4. `ingress/` after all Services exist

See `.cursor/kubernetes-migration-progress.md` for step-by-step verification gates.
