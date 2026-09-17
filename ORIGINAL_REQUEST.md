# Original User Request

## 2026-09-16T22:50:53Z

Build and complete all SRS modules and dashboard pages for Portway, a Railway-class PaaS: implementing the complete deployment lifecycle, Nixpacks/Dockerfile runtime auto-detection, real-time SSE build & runtime console, dual-driver orchestration (local container simulator + cloud edge proxy), managed databases, R2 buckets, custom domains with automated SSL, and GitHub push/PR preview environments.

Working directory: c:/msns/portway
Integrity mode: demo

## Requirements

### R1. Complete Dashboard UI & Page Hierarchy
- Implement all dashboard routes and subpages to eliminate all 404 errors:
  - Dynamic Workspace View (`/dashboard/[slug]`): Workspace overview, project listings, member roles (`OWNER`, `MEMBER`, `VIEWER`), spending caps, and audit activity logs.
  - Project Resource Console (`/dashboard/projects/[id]`): Multi-tab layout for **Services**, **Deployments & Builds**, **Live Logs**, **Metrics & Analytics**, **Databases & Buckets**, **Domains/Networking**, and **Settings**.
  - Global Settings (`/dashboard/settings`): Profile, API access tokens, authentication providers, and billing configurations.
  - New Service & Resource Creation flows (`/dashboard/projects/new`, `/dashboard/services/new`, `/dashboard/databases/new`).

### R2. Runtime Auto-Detection & Buildpack Engine
- Automatically detect runtime environments from connected Git repositories (Node.js, Python, Go, Rust, Ruby, or standard `Dockerfile`).
- Integrate a Nixpacks/Cloud Native Buildpacks (CNB) pipeline to generate OCI-compliant build manifests and container configurations without requiring manual user Dockerfiles.
- Support configurable build commands, run commands, root directories, and environment variable resolution (including inter-service references like `${{ Postgres.URL }}`).

### R3. Deployment Orchestrator & Dual-Driver Execution Engine
- Implement a robust deployment lifecycle with explicit state transitions: `QUEUED` → `BUILDING` → `DEPLOYING` → `ACTIVE` (or `FAILED` / `CRASHED` / `SLEEPING`).
- Provide a **Dual-Driver Architecture**:
  - **Local/Simulated Driver**: Out-of-the-box local execution runner that triggers simulated builds, streams realistic build steps, and activates local container runtimes without requiring external cloud accounts.
  - **Edge/Cloud Driver**: Pluggable drivers for Cloudflare Containers / Docker / Kubernetes backends when API credentials are provided.
- Zero-downtime blue/green deployment switching: new containers must pass automated HTTP health checks before incoming traffic is shifted. Instant rollback triggers if the health check fails.

### R4. Real-Time Log Console & Live Metrics
- Build a real-time console with Server-Sent Events (SSE) / chunked HTTP streaming to stream build steps and container `stdout`/`stderr` logs directly to the browser terminal view (matching Vercel/Railway UI).
- Real-time CPU usage, memory utilization, network egress, and disk usage graphs with historical inspection and live-updating telemetry.

### R5. Edge Reverse Proxy, Custom Domains & SSL
- Dynamic routing for default subdomains (`<service>-<env>.portway.app` or `.portway.run`) and custom hostnames.
- Automated CNAME/TXT verification record generation, status tracking, and automated SSL certificate provisioning flow.

### R6. Managed Databases, Object Storage & Persistent Storage
- Provision and manage Postgres, Redis/Valkey, and MySQL database instances with connection string generation, credential management, and one-click connection details.
- S3/Cloudflare R2 compatible Object Storage bucket provisioning and pre-signed URL generation.
- Persistent volume mounting configurations for stateful services.

### R7. GitHub Integration & Ephemeral PR Preview Environments
- Complete GitHub App/OAuth repository integration: list repos, select branches, and configure auto-deploy webhooks.
- Ephemeral PR Preview Environments: Listen to GitHub `pull_request` webhooks, automatically spin up an isolated preview environment with cloned variables on PR creation, and teardown resources upon merge/closure.

## Acceptance Criteria

### Navigation & Zero 404s
- [ ] Every dashboard link (`/dashboard`, `/dashboard/[slug]`, `/dashboard/projects/[id]`, `/dashboard/settings`, `/dashboard/projects/new`) renders cleanly without 404 or unhandled runtime errors.
- [ ] Responsive navigation with workspace switcher and project resource tabs.

### Deployments & Build Log Console
- [ ] Triggering a deployment transitions through `QUEUED` → `BUILDING` → `DEPLOYING` → `ACTIVE`.
- [ ] Build and runtime logs stream live to the browser terminal window via SSE without full-page reloads.
- [ ] Health checks gate routing; failed deployments auto-rollback to the previous active release.

### Infrastructure & Services
- [ ] Managed Postgres and Redis instances can be provisioned and their connection strings injected into services.
- [ ] Custom domain manager allows adding domains, displays DNS verification TXT/CNAME instructions, and simulates/provisions SSL verification.
- [ ] R2/S3 storage buckets can be created, viewed, and configured with access keys.

### Quality & Verification
- [ ] `npx tsc --noEmit` passes with 0 TypeScript compilation errors.
- [ ] `npm run build` succeeds cleanly.
- [ ] Existing database tables and schema remain consistent with `prisma/schema.prisma`.
