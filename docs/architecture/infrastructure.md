# Infrastructure - Deployment & DevOps

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ CI/CD PIPELINE  │ │ KUBERNETES      │ │ MONITORING      │              │
│   │                 │ │ CLUSTER         │ │ & OBSERVABILITY │              │
│   │ GitHub Actions  │ │                 │ │                 │              │
│   │ ArgoCD          │ │ Multi-region    │ │ Prometheus      │              │
│   │                 │ │ Auto-scaling    │ │ Grafana         │              │
│   └─────────────────┘ └─────────────────┘ │ DataDog         │              │
│                                             └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ DATABASE        │ │ MEDIA           │ │ CDN             │              │
│   │ INFRASTRUCTURE  │ │ INFRASTRUCTURE  │ │                 │              │
│   │                 │ │                 │ │ CloudFlare      │              │
│   │ PostgreSQL      │ │ WebRTC Media    │ │ Global Edge     │              │
│   │ MongoDB         │ │ Servers         │ │ DDoS Protection │              │
│   │ Redis           │ │ S3/MinIO        │ │ SSL/TLS         │              │
│   │ TimescaleDB     │ │                 │ │                 │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kubernetes Deployment

### 2.1 Cluster Configuration

```yaml
KubernetesConfiguration:
  
  # Primary Cluster (US-West)
  cluster_primary:
    name: consultancy-platform-us-west
    provider: AWS EKS
    region: us-west-2
    version: "1.28"
    
    node_groups:
      general:
        instance_type: m6i.xlarge
        min_nodes: 3
        max_nodes: 10
        labels: {type: general}
      
      compute_intensive:
        instance_type: c6i.2xlarge
        min_nodes: 2
        max_nodes: 20
        labels: {type: compute}
      
      memory_intensive:
        instance_type: r6i.xlarge
        min_nodes: 2
        max_nodes: 10
        labels: {type: memory}
      
      gpu_nodes:
        instance_type: g5.xlarge
        min_nodes: 1
        max_nodes: 10
        labels: {type: gpu}
        taints: [{key: nvidia.com/gpu, effect: NoSchedule}]
  
  # European Cluster
  cluster_eu:
    name: consultancy-platform-eu-west
    provider: GCP GKE
    region: europe-west1
    version: "1.28"
  
  # APAC Cluster
  cluster_apac:
    name: consultancy-platform-apac-east
    provider: AWS EKS
    region: ap-northeast-1
    version: "1.28"
```

### 2.2 Service Deployments

```yaml
# Example: User Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: consultancy-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: user-service
        version: v1.0.0
    spec:
      containers:
      - name: user-service
        image: consultancy-platform/user-service:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: postgres-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values: [user-service]
              topologyKey: kubernetes.io/hostname
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: consultancy-platform

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=sha,prefix=
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment: staging
    steps:
    - name: Deploy to staging
      uses: argoproj/argo-cd-action@v1
      with:
        server: ${{ secrets.ARGOCD_SERVER }}
        token: ${{ secrets.ARGOCD_TOKEN }}
        app: consultancy-platform-staging
        action: sync

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - name: Deploy to production (canary)
      uses: argoproj/argo-cd-action@v1
      with:
        server: ${{ secrets.ARGOCD_SERVER }}
        token: ${{ secrets.ARGOCD_TOKEN }}
        app: consultancy-platform-production
        action: sync
        strategy: canary
    
    - name: Wait for canary validation
      run: sleep 300 && ./scripts/validate-canary.sh
    
    - name: Promote to full rollout
      uses: argoproj/argo-cd-action@v1
      with:
        server: ${{ secrets.ARGOCD_SERVER }}
        token: ${{ secrets.ARGOCD_TOKEN }}
        app: consultancy-platform-production
        action: promote
```

---

## 4. Monitoring & Observability

### 4.1 Prometheus Configuration

```yaml
PrometheusConfig:
  
  scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
    
    - job_name: 'kubernetes-services'
      kubernetes_sd_configs:
      - role: service
    
    - job_name: 'kubernetes-nodes'
      kubernetes_sd_configs:
      - role: node
  
  alerting_rules:
    - alert: HighCPUUsage
      expr: container_cpu_usage_seconds_total > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: High CPU usage detected
    
    - alert: HighMemoryUsage
      expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
      for: 5m
      labels:
        severity: warning
    
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
      for: 10m
      labels:
        severity: critical
    
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
      for: 5m
      labels:
        severity: critical
    
    - alert: LowAvailability
      expr: sum(up{job="api-gateway"}) / count(up{job="api-gateway"}) < 0.99
      for: 5m
      labels:
        severity: critical
```

### 4.2 Grafana Dashboards

```yaml
GrafanaDashboards:
  
  platform_health:
    panels:
      - title: "API Gateway Requests"
        type: graph
        metrics:
          - http_requests_total
          - http_request_duration_seconds
      
      - title: "Active Sessions"
        type: gauge
        metrics:
          - active_sessions_count
      
      - title: "Error Rate"
        type: graph
        metrics:
          - rate(http_requests_total{status=~"5.."}[5m])
      
      - title: "Latency Distribution"
        type: heatmap
        metrics:
          - http_request_duration_seconds_bucket
      
      - title: "Database Connections"
        type: graph
        metrics:
          - pg_stat_activity_count
      
      - title: "Cache Hit Rate"
        type: gauge
        metrics:
          - redis_hit_rate
  
  business_metrics:
    panels:
      - title: "Daily Bookings"
        type: stat
        metrics:
          - bookings_created_total
      
      - title: "Active Consultants"
        type: gauge
        metrics:
          - consultants_active_count
      
      - title: "Revenue Today"
        type: stat
        metrics:
          - payments_amount_total
      
      - title: "Session Completion Rate"
        type: gauge
        metrics:
          - sessions_completed / sessions_started
      
      - title: "Average Rating"
        type: gauge
        metrics:
          - reviews_rating_avg
```

---

## 5. Database Infrastructure

### 5.1 PostgreSQL Configuration

```yaml
PostgreSQLInfrastructure:
  
  primary_cluster:
    provider: AWS RDS
    engine: postgres
    version: "15.4"
    instance_class: db.r6g.xlarge
    storage:
      type: gp3
      allocated: 500 GB
      auto_scaling: true
      max_allocated: 1000 GB
    
    high_availability:
      multi_az: true
      standby_instances: 2
    
    backup:
      retention_period: 30 days
      backup_window: "03:00-04:00 UTC"
      point_in_time_recovery: enabled
    
    performance:
      parameter_group:
        max_connections: 500
        shared_buffers: "256MB"
        work_mem: "64MB"
        maintenance_work_mem: "256MB"
        effective_cache_size: "768MB"
    
    read_replicas:
      - region: us-east-1
        instance_class: db.r6g.large
      - region: eu-west-1
        instance_class: db.r6g.large
  
  sharding:
    strategy: hash-based on user_id
    shard_count: 16
    shard_key: user_id
```

### 5.2 MongoDB Configuration

```yaml
MongoDBInfrastructure:
  
  cluster:
    provider: MongoDB Atlas
    tier: M30 (General Purpose)
    region: us-west-2
    
    replication:
      type: replica set
      nodes: 3
      priority: [primary: 1, secondary1: 0.5, secondary2: 0.5]
    
    sharding:
      enabled: true
      collections:
        - messages (shard key: conversation_id)
        - transcripts (shard key: session_id)
        - content_transcripts (shard key: content_id)
    
    backup:
      cloud_backup: enabled
      retention: 30 days
      point_in_time_recovery: enabled
    
    indexing:
      auto_indexing: enabled
      custom_indexes:
        - messages: {conversation_id: 1, created_at: -1}
        - transcripts: {session_id: 1}
```

### 5.3 Redis Configuration

```yaml
RedisInfrastructure:
  
  cluster:
    provider: AWS ElastiCache
    engine: redis
    version: "7.0"
    node_type: cache.r6g.large
    
    cluster_mode:
      enabled: true
      shards: 6
      replicas_per_shard: 2
    
    parameters:
      maxmemory-policy: allkeys-lru
      timeout: 0
      tcp-keepalive: 60
    
    security:
      at_rest_encryption: enabled
      in_transit_encryption: enabled
      auth_token: enabled
```

---

## 6. Media Infrastructure

### 6.1 WebRTC Media Servers

```yaml
MediaServerInfrastructure:
  
  mediasoup_config:
    regions:
      - region: us-west-2
        servers: 5
        bandwidth: 10 Gbps
        capacity: 5000 concurrent sessions
      
      - region: eu-west-1
        servers: 3
        bandwidth: 5 Gbps
        capacity: 3000 concurrent sessions
      
      - region: ap-northeast-1
        servers: 3
        bandwidth: 5 Gbps
        capacity: 3000 concurrent sessions
    
    codec_preferences:
      video:
        - h264
        - vp9
      audio:
        - opus
    
    quality_presets:
      high:
        video_bitrate: 3000 kbps
        audio_bitrate: 128 kbps
      medium:
        video_bitrate: 1500 kbps
        audio_bitrate: 64 kbps
      low:
        video_bitrate: 500 kbps
        audio_bitrate: 32 kbps
```

### 6.2 Object Storage

```yaml
ObjectStorage:
  
  primary:
    provider: AWS S3
    region: us-west-2
    
    buckets:
      - name: consultancy-recordings
        storage_class: STANDARD_IA
        lifecycle:
          - transition_to_GLACIER after 30 days
          - expire after 90 days
      
      - name: consultancy-content
        storage_class: STANDARD
        versioning: enabled
      
      - name: consultancy-attachments
        storage_class: STANDARD
    
    encryption:
      type: SSE-KMS
      key_rotation: enabled
    
    replication:
      - destination_region: eu-west-1
        status: enabled
```

---

## 7. Disaster Recovery

### 7.1 DR Strategy

```yaml
DisasterRecovery:
  
  rpo_rto:
    critical_services:
      RPO: 1 hour
      RTO: 15 minutes
    standard_services:
      RPO: 4 hours
      RTO: 1 hour
  
  backup_schedule:
    databases:
      full_backup: daily at 03:00 UTC
      incremental: hourly
    
    object_storage:
      cross_region_replication: real-time
    
    configuration:
      backup: every 6 hours
  
  failover_regions:
    primary_to_failover:
      us-west-2 → us-east-1
      eu-west-1 → eu-north-1
      ap-northeast-1 → ap-southeast-1
  
  recovery_procedures:
    database_recovery:
      - Restore from latest backup
      - Apply incremental logs
      - Verify data integrity
      - Switch application connections
    
    application_recovery:
      - Deploy to failover region
      - Update DNS records
      - Verify service health
      - Notify stakeholders
```

---

## Next Steps

1. See [Multi-Region Configuration](../specifications/multi-region.md) for regional deployment
2. Review [Security & Privacy](../specifications/security-privacy.md) for infrastructure security
3. Check [System Architecture](../architecture/system-architecture.md) for overview

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index