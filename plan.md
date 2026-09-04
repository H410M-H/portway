# Portway: Phase 1-4 Implementation Plan

This document outlines the detailed technical plan for implementing Phases 1 through 4 of Portway, building upon the Phase 0 control-plane skeleton.

## Phase 1: MVP Deploy Loop ("It Works")

**Goal:** Enable a user to connect a GitHub repository, build a Docker image (via Dockerfile or Nixpacks/Buildpacks), and deploy it to a Cloudflare Container with a generated URL and environment variables.

### 1. GitHub Integration (Source Connection)
*   **Logic:**
    *   Create a GitHub App (not just an OAuth App) to request repository-scoped permissions (Contents, Metadata, Pull Requests, Webhooks).
    *   Implement an OAuth flow specifically for the GitHub App installation process (`/api/auth/github/install`).
    *   **tRPC Endpoints:** `github.listRepos`, `github.installApp`.
    *   **Webhook Handler:** `POST /api/webhooks/github` to receive `push` and `pull_request` events.
    *   **Webhook Logic:**
        1. Validate HMAC signature.
        2. Find the Portway `Service` matching the repo URL and branch.
        3. If a match is found and auto-deploy is enabled, trigger a new `Build`.

### 2. The Orchestrator (Job Queue)
*   **Logic:** Vercel serverless functions have timeouts (10-60s), so long-running tasks (builds, deploys) must be asynchronous.
*   **Implementation:** Use a queueing system. Since we are on Vercel, we can use Vercel Functions with `waitUntil` or a third-party queue like Upstash QStash (Redis-based HTTP queue) to trigger background workers.
*   **Jobs:**
    *   `job.build`: Orchestrates the build process.
    *   `job.deploy`: Orchestrates the deployment process.

### 3. Build System (Cloudflare Containers)
*   **Logic:**
    *   When `job.build` runs, it calls the Cloudflare Containers API to spin up an *ephemeral* build container.
    *   This container clones the repo, reads the `Dockerfile` (or uses Nixpacks if absent), builds the OCI image, and pushes it to Cloudflare's internal registry (or a private registry like GitHub Container Registry).
    *   **Logs:** The build container streams logs back to Portway (e.g., via WebSocket or writing to a temporary R2 bucket/Redis stream which the control plane polls).
    *   Upon success, the job updates the `Build` record to `SUCCEEDED` and enqueues `job.deploy`.

### 4. Deployment & Networking
*   **Logic:**
    *   `job.deploy` calls the Cloudflare Containers API to create/update the runtime container using the newly built image.
    *   It passes down `EnvironmentVariables` (resolving reference variables like `${{ Postgres.URL }}` just before injection).
    *   **Routing:** Cloudflare Workers act as the ingress router. We maintain a KV store (Cloudflare KV) mapping `hostname` -> `containerId`. The routing worker looks up the container ID and forwards the HTTP request.
*   **tRPC Endpoints:** `deployment.trigger` (creates records and queues job), `deployment.logs` (fetches logs).

### 5. Managed Postgres (Partner API)
*   **Logic:** Integrate with a serverless Postgres provider (e.g., Neon, Supabase, or Aiven) via their REST API.
*   **tRPC Endpoints:** `database.provision`.
*   **Flow:** Call partner API -> Receive connection string -> Store encrypted string in `DatabaseInstance` -> Expose as a reference variable for services.

---

## Phase 2: Team & Confidence ("I Trust It With Production")

**Goal:** Add multi-user collaboration, custom domains, auto-rollbacks, and billing to make the platform viable for real projects.

### 1. Custom Domains
*   **Logic:**
    *   Users add a custom domain to a `Service`.
    *   Portway calls the Cloudflare API (`POST /client/v4/zones/{zone_id}/custom_hostnames` - Cloudflare for SaaS) to provision the hostname and generate SSL certificates.
    *   Portway provides TXT/CNAME records to the user for validation.
    *   A cron job or webhook verifies the domain status and updates the `Domain` record.

### 2. Auto-Rollback & Health Checks
*   **Logic:**
    *   Deployments must pass a health check (e.g., HTTP 200 on `/health`) before traffic is fully routed to the new container.
    *   If the health check fails within a grace period, `job.deploy` flags the deployment as `FAILED`.
    *   The orchestrator automatically updates the routing KV to point back to the previous successful `containerId`.

### 3. Observability (Metrics & Logs)
*   **Logic:**
    *   **Logs:** Cloudflare Containers stream `stdout`/`stderr`. We route this via a Cloudflare Worker to a time-series/log database (e.g., Axiom, Datadog, or self-hosted ClickHouse on another instance) tagged by `serviceId`.
    *   **Metrics:** Cloudflare provides CPU/Memory usage via GraphQL API. A cron job periodically aggregates this into our `UsageRecord` table.
    *   **Dashboard:** Build UI to query and visualize these logs and metrics.

### 4. Usage-Based Billing (Stripe)
*   **Logic:**
    *   Integrate Stripe Checkout for adding a payment method.
    *   Use Stripe's Meters API (or standard usage records) to report CPU-seconds, memory GiB-hours, and egress GB.
    *   **Spending Caps:** Before starting a build or keeping a container alive, check if the workspace has exceeded its cap. If so, pause non-essential services.

### 5. PR Environments
*   **Logic:**
    *   When the GitHub webhook receives a `pull_request` (opened) event, create a temporary `Environment` (e.g., `pr-123`).
    *   Clone environment variables from the base environment (usually `preview` or `staging`).
    *   Trigger a build and deploy.
    *   When the PR is closed/merged, delete the environment and destroy the Cloudflare Containers.

---

## Phase 3: Platform Depth

**Goal:** Achieve feature parity with established PaaS providers by adding advanced networking, persistent storage, and feature flags.

### 1. Private Networking
*   **Logic:**
    *   Services within the same environment need to communicate without going over the public internet.
    *   Cloudflare Containers (via Durable Objects/Workers) can route traffic internally. We configure internal hostnames (e.g., `web.internal`) that resolve to the specific container instances within that project's namespace.

### 2. TCP Proxying
*   **Logic:** Support non-HTTP protocols (e.g., raw TCP connections for databases or custom protocols). This requires Cloudflare Spectrum or configuring the Cloudflare Workers to handle raw sockets (TCP over WebSockets/Cloudflare Tunnels).

### 3. Volumes & Object Storage (Cloudflare R2)
*   **Logic:**
    *   **Volumes:** Attach persistent disk to Cloudflare Containers (if supported by CF Containers API, otherwise use DO storage). Note: This pins the service to a single replica.
    *   **Object Storage:** Call Cloudflare R2 API to provision buckets per project. Generate short-lived pre-signed URLs for client-side uploads.

### 4. Feature Flags
*   **Logic:**
    *   Implement a fast key-value lookup (e.g., Redis or Cloudflare KV) for flag evaluation.
    *   Provide a lightweight SDK/endpoint for deployed services to query flag state (`GET /api/flags?project=123`).
    *   Updates to flags instantly invalidate the cache and propagate to running services.

---

## Phase 4: Ecosystem

**Goal:** Expand beyond the dashboard with developer tools, automation, and AI.

### 1. Public API & CLI
*   **Logic:**
    *   Since the dashboard uses tRPC, we can expose the underlying logic via a REST API (using `trpc-openapi`) or provide a typed SDK.
    *   Implement API Token authentication (validating tokens passed in the `Authorization: Bearer` header).
    *   Build a Go or Node.js based CLI (`portway up`, `portway logs`) that communicates with this public API.

### 2. Templates (1-Click Deploys)
*   **Logic:**
    *   Define a YAML/JSON manifest format (e.g., `portway.yml`) that describes services, env vars, and databases.
    *   Build an engine that parses the manifest, prompts for required secrets, and orchestrates the creation of all resources in a new project.

### 3. AI Operations Agent
*   **Logic:**
    *   Integrate an LLM (e.g., OpenAI or Anthropic).
    *   **Deploy Diagnosis:** On a failed build/deploy, fetch the last 100 log lines and prompt the LLM to identify the root cause and suggest a fix. Display this in the dashboard.
    *   **Chat Assistant:** Provide a chat interface with context about the user's workspace, allowing them to query metrics or configurations.

## Summary of External Integrations Required

1.  **Cloudflare API:** DNS, SSL (Custom Hostnames), Workers, Containers, R2, KV.
2.  **GitHub API & Webhooks:** App installation, repository access, push/PR webhooks, commit statuses.
3.  **Managed Database Partner API:** (e.g., Neon, Aiven) Provisioning and managing Postgres/Redis instances.
4.  **Stripe API:** Customers, Subscriptions, Meters (Usage reporting), Invoices.
5.  **Logging/Metrics Sink:** (e.g., Axiom, Datadog) For storing and querying high-volume container logs.
6.  **Email Provider:** (e.g., Resend, Postmark) For invites, billing alerts, and system notifications.
