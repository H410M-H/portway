# Graph Report - syncbay  (2026-09-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 383 nodes · 799 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c2d76f5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- adapter.ts
- trpc-client.tsx
- trpc.ts
- package.json
- engine.ts
- index.ts
- auth.ts
- compilerOptions
- dependencies
- rbac.ts
- app/layout.tsx
- DeploymentStateMachine
- LogEventBus
- eslint.config.mjs

## God Nodes (most connected - your core abstractions)
1. `detectRuntime()` - 16 edges
2. `react` - 16 edges
3. `compilerOptions` - 16 edges
4. `trpc` - 14 edges
5. `zod` - 14 edges
6. `createTRPCRouter` - 13 edges
7. `@prisma/client` - 13 edges
8. `@trpc/server` - 13 edges
9. `protectedProcedure` - 12 edges
10. `resolveEnvironmentVariables()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `detectRuntime()`  [EXTRACTED]
  .agents/auditor_m1/stress-test.ts → src/lib/buildpack/detector.ts
- `run()` --calls--> `resolveEnvironmentVariables()`  [EXTRACTED]
  .agents/auditor_m1/stress-test.ts → src/lib/buildpack/resolver.ts
- `run()` --calls--> `parseDatabaseUrl()`  [EXTRACTED]
  .agents/auditor_m1/stress-test.ts → src/lib/database-provider.ts
- `run()` --calls--> `isValidHostname()`  [EXTRACTED]
  .agents/auditor_m1/stress-test.ts → src/lib/domain-service.ts
- `run()` --calls--> `generatePresignedUrl()`  [EXTRACTED]
  .agents/auditor_m1/stress-test.ts → src/lib/storage-provider.ts

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "adapter.ts"
Cohesion: 0.06
Nodes (67): det, run(), test(), assert(), runAuditorChecks(), RFC-1123, ref_crypto, ref_node_assert (+59 more)

### Community 1 - "trpc-client.tsx"
Cohesion: 0.10
Nodes (19): ref_next_link, ref_next_navigation, react, superjson, @tanstack/react-query, @trpc/client, @trpc/react-query, AuditPage() (+11 more)

### Community 2 - "trpc.ts"
Cohesion: 0.13
Nodes (30): @octokit/rest, @prisma/client, @trpc/server, ref_trpc_server_adapters_fetch, zod, handler(), domainService, createRepoWebhook() (+22 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (37): allowScripts, prisma@5.22.0, @prisma/client@5.22.0, @prisma/engines@5.22.0, devDependencies, eslint, eslint-config-next, @types/node (+29 more)

### Community 4 - "engine.ts"
Cohesion: 0.10
Nodes (16): ref_next_server, dynamic, dynamic, POST(), db, globalForPrisma, executeDeployment(), TriggerOptions (+8 more)

### Community 5 - "index.ts"
Cohesion: 0.19
Nodes (15): args, TIER_TITLES, adapter, assertEqual(), assertFalse(), assertIncludes(), assertMatch(), assertRejects() (+7 more)

### Community 6 - "auth.ts"
Cohesion: 0.11
Nodes (17): next-auth, @next-auth/prisma-adapter, ref_next_auth_providers_credentials, ref_next_auth_providers_github, handler, DashboardShell(), DashboardPage(), getGreeting() (+9 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, bcryptjs, next, next-auth, @next-auth/prisma-adapter, @octokit/rest, prisma, @prisma/client (+9 more)

### Community 9 - "rbac.ts"
Cohesion: 0.14
Nodes (8): ApiTokenData, ApiTokenScope, PERMISSION_RULES, RbacOracle, VolumeConfig, WorkspaceData, WorkspaceMember, WorkspaceRole

### Community 10 - "app/layout.tsx"
Cohesion: 0.17
Nodes (7): nextConfig, next, ref_next_auth_react, metadata, SignInForm(), src_app_globals, metadata

### Community 13 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint_config, ref_eslint_config_next_core_web_vitals, ref_eslint_config_next_typescript

## Knowledge Gaps
- **109 isolated node(s):** `SupportedLanguage`, `NixpacksPhaseConfig`, `BucketRef`, `ServiceRef`, `StressTestResult` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 165 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `trpc.ts` to `adapter.ts`, `trpc-client.tsx`, `package.json`, `engine.ts`?**
  _High betweenness centrality (0.229) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `react` connect `trpc-client.tsx` to `app/layout.tsx`, `package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `SupportedLanguage`, `NixpacksPhaseConfig`, `BucketRef` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `adapter.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05636114911080711 - nodes in this community are weakly interconnected._
- **Should `trpc-client.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0966183574879227 - nodes in this community are weakly interconnected._
- **Should `trpc.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12727272727272726 - nodes in this community are weakly interconnected._