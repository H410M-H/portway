# Project: Syncbay PaaS

## Architecture
Syncbay is a high-performance, developer-centric Platform-as-a-Service (PaaS) built with Next.js 16 (App Router), React 19, TypeScript, tRPC, and Prisma ORM.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                      Client Layer                       │
                  │   /dashboard/[slug]      /dashboard/projects/[id]       │
                  │   Workspace Console      7-Tab Resource Console         │
                  │   /dashboard/settings    Resource Creation Flows        │
                  └──────────────┬──────────────────────────┬───────────────┘
                                 │ HTTP / tRPC              │ SSE Streams
                                 ▼                          ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                    Server Control Plane                 │
                  │  tRPC Routers: workspace, project, service, deployment, │
                  │               database, bucket, domain, volume, metrics │
                  │  SSE Handlers: /api/deployments/[id]/logs/stream        │
                  │               /api/deployments/[id]/metrics/stream      │
                  │  Webhooks:    /api/webhooks/github (push & PR preview)  │
                  └──────────────┬──────────────────────────┬───────────────┘
                                 │                          │
            ┌────────────────────┴────────┐        ┌────────┴─────────────────┐
            │   Core Runtime & Infra      │        │       Data Layer         │
            │  - Buildpack Engine         │        │  - PostgreSQL (Prisma)   │
            │  - Dual-Driver Orchestrator │        │  - Managed DB Generator  │
            │  - Blue/Green Health Checks │        │  - S3/R2 Storage & URLs  │
            │  - Event Bus & Telemetry    │        │  - Domain & SSL Manager  │
            │  - PR Preview Manager       │        │                          │
            └─────────────────────────────┘        └──────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Workspace Dynamic View | `/dashboard/[slug]` overview, project list, member roles (OWNER, MEMBER, VIEWER), spending caps, audit activity logs | M3 | R1 |
| F2 | Project 7-Tab Console | `/dashboard/projects/[id]` multi-tab console: Services, Deployments & Builds, Live Logs, Metrics, Databases & Buckets, Domains, Settings | M3 | R1 |
| F3 | Global Settings Console | `/dashboard/settings` profile, API access tokens, authentication providers, billing configurations | M3 | R1 |
| F4 | Resource Creation Flows | `/dashboard/projects/new`, `/dashboard/services/new`, `/dashboard/databases/new` creation modals/pages | M3 | R1 |
| F5 | Navigation Zero-404s | Topbar workspace switcher dropdown, sidebar routes `/dashboard/members`, `/dashboard/usage`, `/dashboard/audit` | M3 | R1 |
| F6 | Multi-Language Detection | Auto-detection for Node.js, Python, Go, Rust, Ruby, and Dockerfile from repository structure | M1 | R2 |
| F7 | Nixpacks / CNB Engine | Nixpacks 4-phase plan generation (setup, install, build, start) and OCI-compliant build manifests | M1 | R2 |
| F8 | Env Var & Reference Engine | Build/run command customization, root directory support, and `${{ Service/DB.VAR }}` inter-service resolution | M1 | R2 |
| F9 | Deployment State Machine | Strict transition lifecycle: `QUEUED` → `BUILDING` → `DEPLOYING` → `ACTIVE` (and `FAILED` / `CRASHED` / `SLEEPING`) | M2 | R3 |
| F10 | Dual-Driver Execution Engine | Local/Simulated Driver (zero-cloud demo mode) + Edge/Cloud Driver (Cloudflare Containers / Docker) | M2 | R3 |
| F11 | Blue/Green Health Checks | Automated HTTP health checks gating traffic shift with instant auto-rollback on failure | M2 | R3 |
| F12 | Real-Time SSE Log Console | In-memory ring buffer event bus streaming build steps and container stdout/stderr to browser terminal | M2 | R4 |
| F13 | Real-Time Live Metrics | Live CPU, memory, network egress, and disk usage telemetry stream and visualization area charts | M2 | R4 |
| F14 | Dynamic Subdomains & Domains | Default subdomains (`<service>-<env>.syncbay.app`) and custom hostname registration | M1 | R5 |
| F15 | CNAME/TXT & SSL Flow | Automated CNAME/TXT verification record generation, status tracking, and SSL certificate provisioning | M1 | R5 |
| F16 | Managed Databases | Postgres, Redis/Valkey, MySQL provisioning, connection string generation, and credential management | M1 | R6 |
| F17 | Object Storage & Presigned URLs | S3/Cloudflare R2 compatible bucket provisioning, access keys, and presigned upload/download URLs | M1 | R6 |
| F18 | Persistent Storage Volumes | Persistent volume configurations and service mounting definitions | M1 | R6 |
| F19 | GitHub Push Webhook | GitHub OAuth/App repo listing, branch selection, and push webhook triggering automated builds | M2 | R7 |
| F20 | Ephemeral PR Previews | GitHub PR webhook handler (`opened`, `synchronize`, `closed`), dynamic `pr-<num>` env provisioning, variable cloning, cleanup | M2 | R7 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Engines, Data Layer & API Routers | Buildpack engine (F6, F7, F8), Database/Bucket/Domain/Volume services & tRPC routers (F14, F15, F16, F17, F18), bug fixes in service.ts & database-provider.ts | none | COMPLETED ✔ |
| M2 | Deployment Orchestrator, Dual-Driver, Logs/Metrics & GitHub | Deployment state machine & Dual-Driver (F9, F10, F11), SSE Log & Metrics streams (F12, F13), GitHub webhooks & PR preview manager (F19, F20) | M1 | COMPLETED ✔ |
| M3 | Complete Dashboard UI & Page Hierarchy (Zero 404s) | Dynamic workspace view (F1), 7-tab project console (F2), global settings (F3), resource creation flows (F4), navigation zero-404 routes & switcher (F5) | M1, M2 | COMPLETED ✔ |
| M4 | Final Milestone: 100% E2E Test Pass & Coverage Hardening | Phase 1: Pass 100% of E2E test suite (Tiers 1-4, 222/222 passing). Phase 2: Adversarial coverage hardening. Type-check (`npx tsc --noEmit` = 0) and production build (`npm run build` = 17/17 routes) | M1, M2, M3 | COMPLETED ✔ |
| M5 | Multi-Region Edge Networking & Cloud Container Proxy | 6 Tier-1 global POPs, latency routing, automated failover cascade, TLS 1.3/HTTP3 | M1-M4 | COMPLETED ✔ |
| M6 | Syncbay Developer CLI (`syncbay`) & Public OpenAPI Platform | Standalone CLI, `syncbay.json` manifest engine, GitHub Actions deploy step, `/api/v1/*` OpenAPI 3.1 platform | M1-M4 | COMPLETED ✔ |
| M7 | Interactive Web Shell & Database Query Studio | VT100 web terminal connecting to container environment, embedded SQL & Redis query studio with schema browser | M1-M4 | COMPLETED ✔ |
| M8 | DevOps Hyper-Plane, WAF, Crons, Canary, Responsive Sidebar & Plans | Automated scheduled crons, Edge WAF & rate limiter, canary traffic shifting, auto-tuner, AI deploy diagnoser, collapsible sidebar & mobile drawer, RBAC, competitor pricing matrix, and American company compliance | M1-M7 | COMPLETED ✔ |

## Interface Contracts

### 1. Buildpack Engine (`src/lib/buildpack/`)
- `detectRuntime(files: string[]): { language: string; framework?: string; buildCommand: string; startCommand: string; dockerfile?: string }`
- `generateNixpacksPlan(runtime: DetectedRuntime, options?: BuildOptions): NixpacksPlan`
- `resolveEnvironmentVariables(variables: EnvVar[], context: ResolutionContext): ResolvedEnvVar[]`

### 2. Deployment Orchestrator & Dual-Driver (`src/lib/orchestrator/`)
- `DeploymentDriver` interface:
  - `startBuild(deploymentId: string, buildId: string, config: BuildConfig): Promise<void>`
  - `checkHealth(deploymentId: string, healthEndpoint: string): Promise<{ healthy: boolean; statusCode?: number }>`
  - `promoteDeployment(deploymentId: string, serviceId: string): Promise<void>`
  - `rollbackDeployment(failedDeploymentId: string, serviceId: string): Promise<void>`
- `executeDeployment(deploymentId: string, driverType: "LOCAL" | "CLOUD"): Promise<void>`

### 3. Telemetry & Log Streaming (`src/lib/telemetry/`)
- `logEventBus`:
  - `publish(deploymentId: string, logLine: { timestamp: string; stream: "stdout" | "stderr" | "system"; message: string }): void`
  - `subscribe(deploymentId: string, listener: (log: LogEntry) => void): () => void`
  - `getHistory(deploymentId: string): LogEntry[]`
- SSE endpoints:
  - `GET /api/deployments/[id]/logs/stream` -> `text/event-stream`
  - `GET /api/deployments/[id]/metrics/stream` -> `text/event-stream`

### 4. Managed Services & Domain Providers (`src/lib/`)
- `databaseProvider`:
  - `provision(params: { provider: "POSTGRES" | "REDIS" | "MYSQL"; name: string }): Promise<DatabaseCredentials>`
- `storageProvider`:
  - `provisionBucket(params: { name: string; projectId: string }): Promise<BucketDetails>`
  - `generatePresignedUrl(bucketName: string, key: string, operation: "get" | "put"): Promise<string>`
- `domainService`:
  - `generateDefaultSubdomain(serviceName: string, envName: string): string`
  - `generateVerificationRecords(domain: string): { cnameTarget: string; txtRecord: string }`
  - `verifyDomain(domainId: string): Promise<DomainStatus>`

## Code Layout
```
src/
├── app/
│   ├── api/
│   │   ├── deployments/[id]/logs/stream/route.ts   # SSE log stream
│   │   ├── deployments/[id]/metrics/stream/route.ts # SSE metrics stream
│   │   └── webhooks/github/route.ts                # GitHub push & PR webhooks
│   ├── dashboard/
│   │   ├── [slug]/page.tsx                         # Workspace overview
│   │   ├── projects/
│   │   │   ├── [id]/page.tsx                       # 7-Tab Project console
│   │   │   └── new/page.tsx                        # New project flow
│   │   ├── services/new/page.tsx                   # New service flow
│   │   ├── databases/new/page.tsx                  # New database flow
│   │   ├── settings/page.tsx                       # Global settings
│   │   ├── members/page.tsx                        # Workspace members shortcut
│   │   ├── usage/page.tsx                          # Usage & billing shortcut
│   │   ├── audit/page.tsx                          # Audit log shortcut
│   │   ├── layout.tsx                              # Topbar workspace switcher & nav
│   │   └── page.tsx                                # Dashboard root
├── components/
│   ├── dashboard/
│   │   ├── workspace-switcher.tsx                  # Workspace dropdown selector
│   │   ├── log-terminal.tsx                        # Live SSE terminal viewer
│   │   ├── metrics-chart.tsx                       # Live telemetry graphs
│   │   └── project-tabs/                           # Multi-tab subcomponents
├── lib/
│   ├── buildpack/
│   │   ├── detector.ts                             # Multi-language runtime detection
│   │   ├── nixpacks.ts                             # Nixpacks plan & manifest generator
│   │   └── resolver.ts                             # ${{ ... }} variable resolver
│   ├── orchestrator/
│   │   ├── orchestrator.ts                         # Deployment lifecycle state machine
│   │   ├── pr-preview-manager.ts                   # Ephemeral PR environments lifecycle
│   │   └── drivers/
│   │       ├── driver.interface.ts                 # Dual-driver abstract interface
│   │       ├── local-driver.ts                     # Local / simulated execution driver
│   │       └── cloud-driver.ts                     # Edge / cloud container driver
│   ├── telemetry/
│   │   ├── event-bus.ts                            # In-memory ring buffer log pub/sub
│   │   └── metrics-generator.ts                    # Real-time metrics telemetry provider
│   ├── database-provider.ts                        # Managed Postgres/Redis/MySQL provider
│   ├── storage-provider.ts                         # S3/R2 bucket & presigned URL provider
│   └── domain-service.ts                           # Dynamic subdomains & SSL verification
└── server/
    ├── root.ts                                     # Root tRPC router
    └── routers/
        ├── workspace.ts                            # Workspace operations
        ├── project.ts                              # Project operations
        ├── service.ts                              # Service operations
        ├── deployment.ts                           # Deployment operations
        ├── database.ts                             # Managed database operations
        ├── bucket.ts                               # Object storage operations
        ├── domain.ts                               # Custom domain operations
        ├── volume.ts                               # Persistent volume operations
        └── metrics.ts                              # Telemetry operations
```
