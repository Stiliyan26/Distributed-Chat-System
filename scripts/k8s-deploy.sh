#!/usr/bin/env bash
# Build images, load into kind, apply manifests. Run from repo root: ./scripts/k8s-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CTX="$ROOT/chat-system"
CLUSTER_NAME="${CLUSTER_NAME:-chat-system}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing dependency: $1"
    case "$(uname -s)" in
      Darwin)
        echo "On macOS: brew install $2"
        ;;
      *)
        echo "Install $1 from your package manager or https://kubernetes.io/docs/tasks/tools/"
        ;;
    esac
    exit 1
  }
}

require docker docker
require kubectl kubectl
require kind kind

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running."
  exit 1
fi

if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "Creating kind cluster '${CLUSTER_NAME}'..."
  kind create cluster --name "$CLUSTER_NAME" --config "$ROOT/k8s/kind-config.yaml"
else
  echo "Using existing kind cluster '${CLUSTER_NAME}'."
fi

echo "Building application images (this runs nx builds inside Docker)..."
docker build -t chat-system/api-gateway:latest -f "$CTX/services/api-gateway/Dockerfile" "$CTX"
docker build -t chat-system/auth:latest -f "$CTX/services/auth/Dockerfile" "$CTX"
docker build -t chat-system/channel:latest -f "$CTX/services/channel/Dockerfile" "$CTX"
docker build -t chat-system/chat:latest -f "$CTX/services/chat/Dockerfile" "$CTX"
docker build -t chat-system/messaging-api:latest -f "$CTX/services/messaging/Dockerfile.api" "$CTX"
docker build -t chat-system/messaging-worker:latest -f "$CTX/services/messaging/Dockerfile.worker" "$CTX"
docker build -t chat-system/delivery:latest -f "$CTX/services/delivery/Dockerfile" "$CTX"
docker build -t chat-system/presence:latest -f "$CTX/services/presence/Dockerfile" "$CTX"

echo "Loading images into kind..."
for img in \
  chat-system/api-gateway:latest \
  chat-system/auth:latest \
  chat-system/channel:latest \
  chat-system/chat:latest \
  chat-system/messaging-api:latest \
  chat-system/messaging-worker:latest \
  chat-system/delivery:latest \
  chat-system/presence:latest; do
  kind load docker-image "$img" --name "$CLUSTER_NAME"
done

echo "Applying Kubernetes manifests..."
kubectl apply -k "$ROOT/k8s"

echo "Waiting for core workloads (first image pull / PVC bind can exceed 2 minutes)..."
kubectl wait --namespace chat-system --for=condition=available deployment/zookeeper --timeout=300s
kubectl wait --namespace chat-system --for=condition=available deployment/kafka --timeout=600s
kubectl wait --namespace chat-system --for=condition=available deployment --all --timeout=900s || true

echo ""
echo "Done. With kind-config port mappings:"
echo "  API gateway: http://127.0.0.1:3000"
echo "  Kafka UI:    http://127.0.0.1:8080"
echo ""
echo "Check pods: kubectl get pods -n chat-system"
echo "If the cluster was created without k8s/kind-config.yaml, use: kubectl port-forward -n chat-system svc/api-gateway 3000:3000"
