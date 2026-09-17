# Test Infrastructure & Specification: Portway PaaS E2E Test Suite

## 1. Test Philosophy & Principles

Portway is a Railway-class Developer Platform as a Service (PaaS) engineered to handle automated buildpack runtime detection, Nixpacks container plan generation, dynamic variable resolution with inter-service references, zero-downtime blue/green deployment orchestration, real-time SSE log/metrics streaming, managed databases, object storage, custom domain SSL provisioning, and ephemeral GitHub PR preview environments.

The Portway E2E test suite adheres to five core testing principles:

1. **Opaque-Box & Requirement-Driven**:
   Tests are derived strictly from user requirements in `ORIGINAL_REQUEST.md` and architectural interface contracts in `PROJECT.md`. Tests verify external observable behavior, API responses, state transitions, and contract invariants without coupling to internal private implementation details.

2. **Real Logic & Zero-Facade Integrity**:
   No facade tests that pass unconditionally without exercising real logic. Every test exercises concrete inputs, deterministic algorithms, schema validations, state machines, or streaming protocols, and asserts against authoritative expected outputs.

3. **Progressive Testability & Milestone Resilience**:
   The test suite is executable across all milestone stages (M1 through M4). Through the `tests/harness/` abstraction, tests exercise production modules directly as they become available (`src/lib/buildpack/`, `src/lib/storage-provider.ts`, `src/lib/domain-service.ts`, `src/lib/database-provider.ts`, `src/server/routers/`), while maintaining contract-accurate reference oracles for downstream systems.

4. **Self-Contained & Deterministic**:
   Every test creates its own fixtures, isolates its execution state, cleans up resources, and avoids non-deterministic dependencies or flaky external network calls.

5. **Granular 4-Tier Test Hierarchy**:
   Every feature is tested across primary happy paths (Tier 1), boundary and corner cases (Tier 2), cross-feature pairwise interactions (Tier 3), and complex real-world application deployments (Tier 4).

---

## 2. Feature Inventory (F1 – F20)

| ID | Feature Name | Description | Milestone | Interface Contract / Route |
|---|---|---|---|---|
| **F1** | Workspace Dynamic View | `/dashboard/[slug]` workspace overview, project list, member roles (`OWNER`, `MEMBER`, `VIEWER`), spending caps, audit logs | M3 | `/dashboard/[slug]`, `workspaceRouter` |
| **F2** | Project 7-Tab Console | `/dashboard/projects/[id]` multi-tab console: Services, Deployments & Builds, Live Logs, Metrics, Databases & Buckets, Domains, Settings | M3 | `/dashboard/projects/[id]`, `projectRouter` |
| **F3** | Global Settings Console | `/dashboard/settings` profile, API access tokens with scopes (`READ_ONLY`, `DEPLOY_ONLY`, `FULL_ACCESS`), auth providers, billing configurations | M3 | `/dashboard/settings`, `apiTokenRouter` |
| **F4** | Resource Creation Flows | Modal/page creation flows: `/dashboard/projects/new`, `/dashboard/services/new`, `/dashboard/databases/new` | M3 | `/dashboard/projects/new`, `/dashboard/services/new`, `/dashboard/databases/new` |
| **F5** | Navigation Zero-404s | Topbar workspace switcher dropdown, sidebar routes `/dashboard/members`, `/dashboard/usage`, `/dashboard/audit` | M3 | `/dashboard/layout`, `/dashboard/{members,usage,audit}` |
| **F6** | Multi-Language Detection | Runtime auto-detection from repo structure: Node.js, Python, Go, Rust, Ruby, Dockerfile | M1 | `src/lib/buildpack/detector.ts` -> `detectRuntime` |
| **F7** | Nixpacks / CNB Engine | Deterministic 4-phase Nixpacks plan generation (setup, install, build, start) and OCI build manifests | M1 | `src/lib/buildpack/nixpacks.ts` -> `generateNixpacksPlan` |
| **F8** | Env Var & Reference Engine | Build/run customization, root dir support, `${{ Service.VAR }}` & `${{ Database.URL }}` inter-service resolution | M1 | `src/lib/buildpack/resolver.ts` -> `resolveEnvironmentVariables` |
| **F9** | Deployment State Machine | Strict transition lifecycle: `QUEUED` -> `BUILDING` -> `DEPLOYING` -> `ACTIVE` (or `FAILED`/`CRASHED`/`SLEEPING`) | M2 | `src/lib/orchestrator/orchestrator.ts` |
| **F10** | Dual-Driver Execution Engine | Local/Simulated Driver (zero-cloud demo mode) + Cloud Driver (Cloudflare / Docker) | M2 | `src/lib/orchestrator/drivers/` -> `DeploymentDriver` |
| **F11** | Blue/Green Health Checks | Automated HTTP health checks gating traffic shift with instant auto-rollback on failure | M2 | `src/lib/orchestrator/orchestrator.ts` -> `checkHealth`, `rollbackDeployment` |
| **F12** | Real-Time SSE Log Console | In-memory ring buffer event bus streaming build steps and container stdout/stderr | M2 | `src/lib/telemetry/event-bus.ts`, `/api/deployments/[id]/logs/stream` |
| **F13** | Real-Time Live Metrics | Live CPU, memory, network egress, and disk usage telemetry stream and area chart formatting | M2 | `src/lib/telemetry/metrics-generator.ts`, `/api/deployments/[id]/metrics/stream` |
| **F14** | Dynamic Subdomains & Domains | Default subdomains (`<service>-<env>.portway.app`) and custom hostname registration | M1 | `src/lib/domain-service.ts` -> `generateDefaultSubdomain` |
| **F15** | CNAME/TXT & SSL Flow | Automated CNAME/TXT verification record generation, status tracking, and SSL certificate provisioning | M1 | `src/lib/domain-service.ts` -> `generateVerificationRecords`, `verifyDomain` |
| **F16** | Managed Databases | Postgres, Redis/Valkey, MySQL provisioning, connection string generation, and credential management | M1 | `src/lib/database-provider.ts` -> `provision`, `parseDatabaseUrl` |
| **F17** | Object Storage & Presigned URLs | S3/Cloudflare R2 compatible bucket provisioning, access keys, and presigned upload/download URLs | M1 | `src/lib/storage-provider.ts` -> `provisionBucket`, `generatePresignedUrl` |
| **F18** | Persistent Storage Volumes | Persistent volume configurations, mount paths, size allocation, and service mounting definitions | M1 | `src/server/routers/volume.ts`, volume management contracts |
| **F19** | GitHub Push Webhook | GitHub repo listing, branch selection, and push webhook triggering automated builds | M2 | `/api/webhooks/github`, `githubRouter` |
| **F20** | Ephemeral PR Previews | GitHub PR webhook handler (`opened`, `synchronize`, `closed`), dynamic `pr-<num>` env provisioning, variable cloning, cleanup | M2 | `src/lib/orchestrator/pr-preview-manager.ts`, `/api/webhooks/github` |

---

## 3. 4-Tier Test Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │            E2E Test Runner                   │
                               │        npx tsx tests/e2e/run-all.ts          │
                               └──────────────────────┬───────────────────────┘
                                                      │
         ┌─────────────────────┬──────────────────────┴──────┬─────────────────────┐
         ▼                     ▼                             ▼                     ▼
┌──────────────────┐  ┌──────────────────┐         ┌──────────────────┐  ┌──────────────────┐
│     Tier 1       │  │     Tier 2       │         │     Tier 3       │  │     Tier 4       │
│ Feature Coverage │  │ Boundary & Corner│         │  Cross-Feature   │  │   Real-World     │
│   (100 tests)    │  │   (100 tests)    │         │  (15+ tests)     │  │   Scenarios      │
│  >=5 per feature │  │  >=5 per feature │         │ Pairwise Matrix  │  │   (10 Scenarios) │
└────────┬─────────┘  └────────┬─────────┘         └────────┬─────────┘  └────────┬─────────┘
         │                     │                            │                     │
         └─────────────────────┴──────────────┬─────────────┴─────────────────────┘
                                              ▼
                               ┌──────────────────────────────┐
                               │     tests/harness/           │
                               │  - Unified Test Adapter      │
                               │  - Production / Oracle Bridge│
                               │  - Fixtures & Assertions     │
                               └──────────────┬───────────────┘
                                              │
                    ┌─────────────────────────┴────────────────────────┐
                    ▼                                                  ▼
      ┌───────────────────────────┐                      ┌───────────────────────────┐
      │   Production Code (src/)  │                      │ Reference Contract Oracle │
      │ - detector, nixpacks      │                      │ - State machines, SSE bus │
      │ - resolver, db-provider   │                      │ - HTTP mocks, SigV4 checks│
      │ - storage, domain-service │                      │ - RBAC, PR lifecycle      │
      └───────────────────────────┘                      └───────────────────────────┘
```

### Tier 1: Feature Coverage (>=5 tests per feature, >=100 tests total)
Focuses on the primary behavior and happy-path specifications for each of the 20 features:
- **F1**: Workspace retrieval, project listing, member role badges (`OWNER`/`MEMBER`/`VIEWER`), spending cap tracking, audit entry creation.
- **F2**: 7 tabs presence & state, service listing tab, deployment history tab, live logs tab, metrics tab, database tab, domain tab.
- **F3**: User profile retrieval, API token generation, token scope verification (`READ_ONLY`, `DEPLOY_ONLY`, `FULL_ACCESS`), auth provider listing, billing details.
- **F4**: Project creation payload validation, service creation with GitHub source, service creation with Docker image, database creation flow, project environment setup.
- **F5**: Workspace switcher options, `/dashboard/members` route, `/dashboard/usage` route, `/dashboard/audit` route, 404 elimination.
- **F6**: Detection for Node.js (package.json), Python (requirements.txt), Go (go.mod), Rust (Cargo.toml), Ruby (Gemfile), Dockerfile.
- **F7**: 4-phase plan generation (setup, install, build, start), OCI multi-stage manifest syntax, cache directories, dependency packages, custom build command overrides.
- **F8**: Basic variable resolution, inter-service `${{ Service.URL }}` resolution, database `${{ Postgres.URL }}` injection, bucket `${{ Bucket.ENDPOINT }}` reference, system variables.
- **F9**: State transition `QUEUED` -> `BUILDING`, `BUILDING` -> `DEPLOYING`, `DEPLOYING` -> `ACTIVE`, `BUILDING` -> `FAILED`, `ACTIVE` -> `SLEEPING`.
- **F10**: Local driver simulated build execution, simulated container activation, Cloud driver registration, driver selection by environment, driver execution contract.
- **F11**: Health check endpoint querying, successful HTTP 200 promotion, unhealthy HTTP 500 rejection, traffic gating invariant, automatic rollback invocation.
- **F12**: Event bus publishing, subscriber event reception, log streaming format (`stdout`/`stderr`/`system`), historical log buffer retention, SSE stream header correctness.
- **F13**: CPU metric generation, memory metric generation, network egress calculation, disk usage tracking, interval polling updates.
- **F14**: Platform default subdomain generation (`<service>-<env>.portway.app`), custom domain creation, RFC 1123 hostname validation, domain association with service.
- **F15**: CNAME verification target generation, TXT record token generation, verification state check (`PENDING` -> `ACTIVE`), SSL certificate provisioning state, DNS mismatch handling.
- **F16**: Managed PostgreSQL provisioning, Redis provisioning, MySQL provisioning, connection string parsing into structured credentials, CLI connect command generation.
- **F17**: Bucket provisioning, R2 bucket reference generation, SigV4 presigned PUT URL generation, SigV4 presigned GET URL generation, expiration timestamp validation.
- **F18**: Volume creation, mount path normalization, volume size allocation, multi-volume attachment definition, service volume association.
- **F19**: Push webhook JSON payload parsing, branch filtering match, commit SHA extraction, automated build record creation, status callback invocation.
- **F20**: PR `opened` event handling, isolated `pr-<num>` environment creation, service variable cloning to preview environment, PR comment deployment link, PR `closed` cleanup.

### Tier 2: Boundary & Corner Cases (>=5 tests per feature, >=100 tests total)
Focuses on edge cases, invalid inputs, boundary limits, and adversarial conditions:
- **F1**: 0-length workspace slug, spending cap at 0 cents, maximum spending cap overflow, role escalation attempt by `VIEWER`, audit log with empty metadata.
- **F2**: Project with 0 services, project with 100+ deployments pagination, missing active deployment in live tab, malformed project ID (invalid CUID), extreme tab switching.
- **F3**: Token with 0 scopes, expired token handling, token revocation idempotency, profile update with invalid email, empty API token name.
- **F4**: Project creation with duplicate name in same workspace, service creation with empty repo URL, invalid port number (<1 or >65535), database creation with unsupported engine, special characters in project name.
- **F5**: Switcher with single workspace, navigating to malformed workspace slug, unauthorized access to private workspace, boundary query params, non-existent sub-resource 404 handler.
- **F6**: Ambiguous multi-language repository (e.g. Node + Python together), empty repository (0 files), deeply nested root directory (`/packages/backend`), malformed package.json, Dockerfile with missing EXPOSE.
- **F7**: Empty install/build commands, circular phase dependencies, Nixpacks plan with empty packages, special characters in build command, unsupported target architecture.
- **F8**: Circular variable reference detection (`A -> B -> A`), unresolvable variable reference `${{ NonExistent.VAR }}`, nested variable expressions, secret masking in logs, empty string variable value.
- **F9**: Invalid state transition `ACTIVE` -> `QUEUED`, double `ACTIVE` transition, transition from terminal `FAILED` to `ACTIVE`, cancellation mid-build, crash during `DEPLOYING`.
- **F10**: Local driver timeout during simulated build, driver failure during container start, unsupported driver type fallback, concurrent build execution on same driver, local driver disk space simulation.
- **F11**: Health check endpoint returning HTTP 301 redirect, health check socket timeout, flapping health check (pass -> fail -> pass), rollback when no previous active release exists, non-standard health check port.
- **F12**: High-frequency log flood (>1,000 lines/sec), ring buffer overflow eviction (FIFO retention), multibyte UTF-8 characters and emoji in log stream, client disconnect mid-stream, subscriber memory leak prevention.
- **F13**: Negative metric values clamp to zero, CPU usage spike > 100%, zero memory allocation boundary, metrics stream disconnect recovery, clock skew in metric timestamps.
- **F14**: Hostname exceeding 253 characters, hostname starting or ending with hyphen, subdomain with uppercase characters, conflicting custom domain across services, internationalized domain name (IDN).
- **F15**: Verification with expired TXT token, CNAME pointing to wrong target, SSL certificate renewal edge case, verification retry backoff, SSL provisioning timeout.
- **F16**: Database URL with special characters in password (`!@#$%^&*()`), Redis connection URL without password, port number outside standard range, database provisioning partner timeout, duplicate database name in environment.
- **F17**: Bucket name with invalid S3 characters (uppercase, spaces), presigned URL with expiration > 7 days (SigV4 limit), presigned URL with expiration <= 0, presigned URL for empty key, bucket deletion with active objects.
- **F18**: Volume mount path not absolute (missing leading `/`), duplicate mount paths on same service, volume size 0 GB or negative, mount path overlapping root filesystem (`/`), volume name with spaces.
- **F19**: Push webhook with missing commit array, push to non-watched branch (no deployment triggered), webhook with invalid HMAC signature, push event with 0 changed files, push payload > 5MB.
- **F20**: PR webhook for deleted branch, duplicate PR opened webhook (idempotency), PR closed when environment already deleted, PR environment name collision, PR with empty environment variables.

### Tier 3: Cross-Feature Combinations (Pairwise Interaction Matrix)
Focuses on integration between interdependent subsystems:
1. **F6 (Multi-Language) + F7 (Nixpacks) + F8 (Env Var Resolution)**: Auto-detecting a Next.js app, generating a Nixpacks build plan, and injecting resolved `${{ Postgres.URL }}` into the build phase environment.
2. **F9 (State Machine) + F10 (Dual Driver) + F12 (SSE Logs)**: Launching a deployment through the state machine, running via Local Driver, and streaming build steps line-by-line into the SSE event bus.
3. **F9 (State Machine) + F11 (Blue/Green) + F14 (Domains)**: Completing a deployment, passing health checks, promoting to `ACTIVE`, and shifting the default subdomain route.
4. **F9 (State Machine) + F11 (Blue/Green Failure) + F12 (SSE Logs)**: Deployment failing health check, streaming failure reason to SSE logs, executing auto-rollback to previous active release, and preserving previous domain routing.
5. **F16 (Managed DB) + F8 (Env Var Resolution) + F10 (Driver Build)**: Provisioning a PostgreSQL instance, resolving `${{ Postgres.CONNECTION_STRING }}` in service variables, and verifying container startup with injected credentials.
6. **F17 (Object Storage) + F8 (Env Var Resolution) + F14 (Custom Domain)**: Provisioning an R2 bucket, resolving `${{ Bucket.PUBLIC_URL }}` in service environment variables, and binding custom domain for assets.
7. **F19 (GitHub Push) + F6 (Detection) + F9 (Deployment Lifecycle)**: Receiving a GitHub push webhook, auto-detecting Python runtime, creating build record, and driving lifecycle to `ACTIVE`.
8. **F20 (PR Previews) + F8 (Variable Cloning) + F14 (Ephemeral Domain) + F11 (Health Check)**: Opening a PR, cloning production variables, spinning up `pr-42.portway.app`, validating health checks, and generating PR preview URL comment.
9. **F20 (PR Previews) + F18 (Volume Isolation) + F9 (Teardown Lifecycle)**: Closing a PR, tearing down ephemeral preview containers, cleaning up temporary volumes, and transitioning environment state.
10. **F1 (Workspace RBAC) + F3 (API Tokens) + F4 (Service Creation) + F18 (Volume Mount)**: Authenticating with a `DEPLOY_ONLY` API token, creating a new service with attached storage volume, and verifying audit log entry.
11. **F12 (SSE Logs) + F13 (Live Metrics) + F10 (Dual Driver Concurrency)**: Running concurrent builds on the local driver while verifying independent SSE log buffers and isolated metric streams.
12. **F15 (Domain & SSL) + F14 (Subdomains) + F11 (Blue/Green Shift)**: Custom domain verification completing, updating SSL status to `ACTIVE`, and mapping traffic to the blue/green container endpoint.

### Tier 4: Real-World Application Scenarios (10 Comprehensive Scenarios)
1. **Scenario 1: Full-Stack Next.js 16 App with Managed PostgreSQL & R2 Storage**: Complete project creation, Next.js repo auto-detection, PostgreSQL instance provisioning, R2 bucket creation, variable reference resolution (`${{ Postgres.URL }}`, `${{ Storage.ENDPOINT }}`), Nixpacks plan compilation, deployment to `ACTIVE`, and live log verification.
2. **Scenario 2: Python Flask REST API with Redis Cache & Custom Domain with SSL**: Python auto-detection (requirements.txt + gunicorn), Redis instance provisioning, custom domain addition (`api.example.com`), CNAME/TXT verification record generation, SSL verification, deployment promotion, and health check pass.
3. **Scenario 3: Ephemeral GitHub PR Preview Lifecycle (Open -> Deploy -> Sync -> Merge Cleanup)**: GitHub PR #101 `opened` event, automatic provisioning of `pr-101` isolated environment, inheritance of sanitized production variables, deployment to `pr-101-app.portway.app`, PR `synchronize` new commit redeploy, and PR `closed` event triggering clean resource teardown.
4. **Scenario 4: Zero-Downtime Blue/Green Deployment with Health Check Auto-Rollback**: Active release `v1` serving traffic on `app.portway.app`. Trigger release `v2` with failing health check (`/healthz` returning 500). Health check probe fails threshold, marks `v2` as `FAILED`, triggers instant auto-rollback, keeping `v1` in `ACTIVE` state with zero traffic interruption.
5. **Scenario 5: Go Microservice with Persistent Volume Mount & Storage State**: Go repository detection (`go.mod`), persistent volume configuration (`/data`, 10GB), service compilation and startup, volume attachment verification, restart simulation preserving volume reference.
6. **Scenario 6: Ruby on Rails Application with Multi-Phase Nixpacks & Asset Precompilation**: Rails detection (`Gemfile`), Nixpacks 4-phase plan with `bundle exec rails assets:precompile` and Puma start command, managed PostgreSQL linkage, deployment progression, and SSE build log capture.
7. **Scenario 7: Rust Web Service with Custom Dockerfile Override**: Rust repository with custom `Dockerfile` overriding buildpack detection, container port extraction from `EXPOSE 8080`, simulated container build and startup, metrics telemetry streaming.
8. **Scenario 8: Multi-Tenant Team Workspace with RBAC Role Enforcement & Spending Cap Alerts**: Creation of multi-user workspace, member role assignment (`OWNER`, `MEMBER`, `VIEWER`), verification of permission gates (viewer cannot deploy; member can deploy; only owner can adjust spending cap), spending cap alert calculation against usage records.
9. **Scenario 9: Microservices Mesh with Inter-Service Variable References**: Deploying a 3-service architecture (`auth-service`, `api-gateway`, `notification-worker`). `api-gateway` referencing `${{ auth-service.URL }}` and `${{ notification-worker.PORT }}`. Dynamic topological resolution, build sequencing, and cross-service environment injection.
10. **Scenario 10: High-Concurrency SSE Log & Metric Telemetry Streaming**: Executing 5 simultaneous deployments across distinct services. Verifying that each deployment maintains an isolated in-memory ring buffer, concurrent SSE subscribers receive non-interleaved logs, and live metrics update independently without memory leakage.

---

## 4. Coverage Thresholds & Pass Criteria

| Metric | Target / Threshold |
|---|---|
| **Tier 1 Feature Coverage Tests** | >= 100 tests (>= 5 per feature F1–F20) |
| **Tier 2 Boundary & Corner Case Tests** | >= 100 tests (>= 5 per feature F1–F20) |
| **Tier 3 Cross-Feature Combination Tests** | >= 10 pairwise interaction tests |
| **Tier 4 Real-World Application Scenarios** | >= 10 comprehensive multi-step workflows |
| **Total Test Count** | >= 220 tests total |
| **Pass Rate** | 100% (0 failures, 0 skips on production/reference suite) |
| **Execution Time** | < 30 seconds for entire suite |
| **Exit Code** | Code `0` on 100% pass; non-zero on any failure |
