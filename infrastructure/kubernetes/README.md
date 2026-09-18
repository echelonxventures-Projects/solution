# Kubernetes Deployment Instructions

## Prerequisites
- Kubernetes cluster (v1.28+)
- kubectl configured
- Helm 3 installed
- cert-manager for TLS certificates
- nginx ingress controller

## Quick Start

### 1. Create namespace and secrets
```bash
kubectl apply -f base/namespace.yaml
kubectl apply -f base/configmap.yaml
kubectl apply -f base/secrets.yaml
```

### 2. Deploy databases
```bash
kubectl apply -f databases/postgres.yaml
kubectl apply -f databases/redis.yaml
kubectl apply -f databases/kafka.yaml
kubectl apply -f databases/mongodb.yaml
```

### 3. Deploy services
```bash
kubectl apply -f deployments/user-service.yaml
kubectl apply -f deployments/consultant-service.yaml
kubectl apply -f deployments/billing-service.yaml
kubectl apply -f deployments/communication-service.yaml
kubectl apply -f deployments/ai-orchestrator-service.yaml
kubectl apply -f deployments/memory-service.yaml
kubectl apply -f deployments/search-service.yaml
kubectl apply -f deployments/analytics-service.yaml
kubectl apply -f deployments/notification-service.yaml
kubectl apply -f deployments/web-app.yaml
kubectl apply -f deployments/admin-dashboard.yaml
```

### 4. Configure ingress
```bash
kubectl apply -f ingress/ingress.yaml
```

### 5. Set up autoscaling
```bash
kubectl apply -f hpa/hpa.yaml
```

## Deploy All (One Command)
```bash
kubectl apply -R -f .
```

## Verify Deployment
```bash
kubectl get pods -n consultancy
kubectl get services -n consultancy
kubectl get ingress -n consultancy
```

## Database Initialization
After deploying PostgreSQL, run migrations:
```bash
kubectl exec -it postgres-pod -n consultancy -- psql -U consultancy -d consultancy -f /path/to/init.sql
```

## Scaling
Manual scaling:
```bash
kubectl scale deployment user-service --replicas=5 -n consultancy
```

Auto-scaling is configured via HPA.

## Monitoring
Install Prometheus and Grafana:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus -n consultancy
helm install grafana prometheus-community/grafana -n consultancy
```

## Secrets Management
For production, use external secrets management:
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

## Backup
Database backups should be configured using:
- PostgreSQL: pg_dump scheduled jobs
- MongoDB: mongodump scheduled jobs
- Redis: AOF persistence (enabled)

## Multi-Region Setup
For multi-region deployment:
1. Deploy in each region
2. Configure global load balancer
3. Set up database replication
4. Configure Kafka mirroring