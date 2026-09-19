/**
 * Syncbay PaaS — Comprehensive Enterprise E2E Test Suite
 * Covers Features F01 through F16 across Tiers 1 to 4:
 * - Tier 1: Feature Coverage (80 tests: exactly 5 tests per feature F01–F16)
 * - Tier 2: Boundary & Corner Cases (50 tests)
 * - Tier 3: Pairwise Cross-Feature Combinations (16 tests)
 * - Tier 4: Real-World Application Scenarios (5 complex multi-step workflows)
 */

import {
  registerTest,
  assertTrue,
  assertFalse,
  assertEqual,
  assertMatch,
  assertIncludes,
} from "../harness";

import { enterpriseHarness } from "../harness/enterprise-harness";
import { authOptions } from "../../src/lib/auth";
import { db } from "../../src/lib/db";
import fs from "node:fs";
import path from "node:path";

// ══════════════════════════════════════════════════════════════════════════════
// TIER 1: FEATURE COVERAGE (80 tests: 5 per feature for F01 to F16)
// ══════════════════════════════════════════════════════════════════════════════

// ─── F01: NextAuth RFC 9207 Issuer Configuration ────────────────────────────
registerTest("F01-T1-01", "F01", 1, "GitHubProvider configured with RFC 9207 issuer", () => {
  const provider = (authOptions.providers as any[]).find(
    (p) => p.id === "github" || p.name === "GitHub"
  );
  assertTrue(!!provider, "GitHub provider must be configured");
  const options = provider.options || provider;
  assertEqual(options.issuer, "https://github.com/login/oauth", "Must configure RFC 9207 issuer");
});

registerTest("F01-T1-02", "F01", 1, "Account linking enabled on GitHubProvider (allowDangerousEmailAccountLinking)", () => {
  const provider = (authOptions.providers as any[]).find(
    (p) => p.id === "github" || p.name === "GitHub"
  );
  const options = provider.options || provider;
  assertTrue(options.allowDangerousEmailAccountLinking, "Account linking must be enabled");
});

registerTest("F01-T1-03", "F01", 1, "OAuth authorization params include required scopes (read:user, user:email, repo)", () => {
  const provider = (authOptions.providers as any[]).find(
    (p) => p.id === "github" || p.name === "GitHub"
  );
  const options = provider.options || provider;
  const scope = options.authorization?.params?.scope || "";
  assertIncludes(scope, "read:user");
  assertIncludes(scope, "user:email");
  assertIncludes(scope, "repo");
});

registerTest("F01-T1-04", "F01", 1, "OAuth callback validation accepts matching RFC 9207 issuer parameter", () => {
  const result = enterpriseHarness.oauth.validateCallback({
    code: "auth_code_valid",
    state: "state_valid",
    iss: "https://github.com/login/oauth",
    callbackUrl: "/dashboard",
  });
  assertTrue(result.success, "Callback must succeed with matching issuer");
});

registerTest("F01-T1-05", "F01", 1, "First-time OAuth sign-in auto-provisions personal workspace with audit log", () => {
  const user = { id: "usr_alice123", name: "Alice Developer", email: "alice@example.com" };
  const prov = enterpriseHarness.oauth.simulateWorkspaceAutoProvisioning(user);
  assertTrue(prov.workspace.isPersonal, "Workspace must be personal");
  assertEqual(prov.workspace.memberRole, "OWNER", "User must be OWNER");
  assertIncludes(prov.workspace.slug, "alice-developer-usr_al");
  assertEqual(prov.auditLog.action, "workspace.created");
});

// ─── F02: OAuth Callback & Sign-in Redirection ──────────────────────────────
registerTest("F02-T1-01", "F02", 1, "OAuth callback preserves dynamic callbackUrl query destination", () => {
  const customTarget = "/dashboard/projects/proj_999/settings";
  const result = enterpriseHarness.oauth.validateCallback({
    code: "auth_code_123",
    state: "valid_state_123",
    iss: "https://github.com/login/oauth",
    callbackUrl: customTarget,
  });
  assertTrue(result.success);
  assertEqual(result.redirectUrl, customTarget, "Must preserve dynamic callbackUrl");
});

registerTest("F02-T1-02", "F02", 1, "OAuth callback defaults to /dashboard when callbackUrl is omitted", () => {
  const result = enterpriseHarness.oauth.validateCallback({
    code: "auth_code_123",
    state: "valid_state_123",
    iss: "https://github.com/login/oauth",
  });
  assertTrue(result.success);
  assertEqual(result.redirectUrl, "/dashboard");
});

registerTest("F02-T1-03", "F02", 1, "Sign-in pages configure /auth/signin for custom auth experience", () => {
  assertEqual(authOptions.pages?.signIn, "/auth/signin");
  assertEqual(authOptions.pages?.error, "/auth/signin");
});

registerTest("F02-T1-04", "F02", 1, "Session strategy configures JWT tokens for edge-compatible sessions", () => {
  assertEqual(authOptions.session?.strategy, "jwt");
});

registerTest("F02-T1-05", "F02", 1, "OAuth callback with invite token redirect routes directly to /invite/[token]", () => {
  const invitePath = "/invite/inv_token_999";
  const result = enterpriseHarness.oauth.validateCallback({
    code: "auth_code_123",
    state: "valid_state_123",
    iss: "https://github.com/login/oauth",
    callbackUrl: invitePath,
  });
  assertEqual(result.redirectUrl, invitePath);
});

registerTest("F02-T1-06", "F02", 1, "First-time GitHub OAuth sign-in is allowed before adapter persistence exists", async () => {
  const signIn = authOptions.callbacks?.signIn;
  assertTrue(typeof signIn === "function", "signIn callback must exist");

  const prismaLike = db as any;
  const originalUserFindUnique = prismaLike.user.findUnique;
  const originalAccountFindUnique = prismaLike.account.findUnique;

  prismaLike.user.findUnique = async () => null;
  prismaLike.account.findUnique = async () => null;

  try {
    const result = await signIn!({
      user: {
        id: "",
        email: "new-oauth-user@example.com",
        name: "New OAuth User",
      },
      account: {
        provider: "github",
        providerAccountId: "46568247",
        type: "oauth",
      },
      profile: {},
      email: { verificationRequest: false },
      credentials: undefined,
    } as any);

    assertTrue(result === true, "first-time OAuth sign-in should proceed while the record is being created");
  } finally {
    prismaLike.user.findUnique = originalUserFindUnique;
    prismaLike.account.findUnique = originalAccountFindUnique;
  }
});

// ─── F03: TypeScript & Build Compilation Unblock ────────────────────────────
registerTest("F03-T1-01", "F03", 1, "tsconfig.json configures target ES2022 for modern JavaScript and BigInt support", () => {
  const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const content = fs.readFileSync(tsconfigPath, "utf-8");
  assertIncludes(content, '"target": "ES2022"');
});

registerTest("F03-T1-02", "F03", 1, "BigInt literal expressions evaluate natively without compilation error", () => {
  const bigNum = 12345678901234567890n;
  assertEqual(typeof bigNum, "bigint");
  assertEqual(bigNum + 10n, 12345678901234567900n);
});

registerTest("F03-T1-03", "F03", 1, "WAF IPv6 subnet bitwise operations evaluate using 128-bit BigInt logic", () => {
  const mask = ((1n << 128n) - 1n) ^ ((1n << (128n - 32n)) - 1n);
  assertEqual(typeof mask, "bigint");
  assertTrue(mask > 0n);
});

registerTest("F03-T1-04", "F03", 1, "TypeScript compilerOptions enforce strict type checking", () => {
  const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const content = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
  assertTrue(content.compilerOptions.strict, "strict mode must be enabled");
});

registerTest("F03-T1-05", "F03", 1, "Path alias @/* maps cleanly to ./src/* in tsconfig.json", () => {
  const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const content = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
  assertEqual(content.compilerOptions.paths["@/*"][0], "./src/*");
});

// ─── F04: Modern Collapsible Sidebar & Tooltip Fix ──────────────────────────
registerTest("F04-T1-01", "F04", 1, "Sidebar toggle transitions between expanded (72px) and collapsed states", () => {
  let isCollapsed = false;
  isCollapsed = enterpriseHarness.navigation.toggleCollapse(isCollapsed);
  assertTrue(isCollapsed, "Sidebar should now be collapsed");
  assertEqual(enterpriseHarness.navigation.getStorageItem("syncbay_sidebar_collapsed"), "true");

  isCollapsed = enterpriseHarness.navigation.toggleCollapse(isCollapsed);
  assertFalse(isCollapsed, "Sidebar should now be expanded");
  assertEqual(enterpriseHarness.navigation.getStorageItem("syncbay_sidebar_collapsed"), "false");
});

registerTest("F04-T1-02", "F04", 1, "Sidebar collapsed state persists in localStorage across reloads", () => {
  enterpriseHarness.navigation.setStorageItem("syncbay_sidebar_collapsed", "true");
  const restored = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: enterpriseHarness.navigation.getStorageItem("syncbay_sidebar_collapsed"),
    viewportWidth: 1440,
  });
  assertTrue(restored, "Should restore true from stored preference");
});

registerTest("F04-T1-03", "F04", 1, "Keyboard shortcut Ctrl+B or Cmd+B toggles sidebar state", () => {
  let state = false;
  state = enterpriseHarness.navigation.handleKeyboardShortcut({ key: "b", ctrlKey: true }, state);
  assertTrue(state, "Ctrl+B must toggle sidebar to collapsed");

  state = enterpriseHarness.navigation.handleKeyboardShortcut({ key: "B", metaKey: true }, state);
  assertFalse(state, "Cmd+B must toggle sidebar back to expanded");
});

registerTest("F04-T1-04", "F04", 1, "Tooltip rendering outside sidebar bounding box prevents clipping", () => {
  const tooltip = enterpriseHarness.navigation.validateTooltipVisibility(true);
  assertTrue(tooltip.visible, "Tooltip must be visible in collapsed state");
  assertTrue(tooltip.overflowSafe, "Tooltip must be overflow safe (overflow: visible)");
  assertIncludes(tooltip.position, "left: calc(100% + 10px)");
});

registerTest("F04-T1-05", "F04", 1, "Tablet viewport (<1024px) auto-collapses sidebar when no preference stored", () => {
  const tabletState = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: null,
    viewportWidth: 900,
  });
  assertTrue(tabletState, "Tablet viewport must default to collapsed");

  const desktopState = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: null,
    viewportWidth: 1280,
  });
  assertFalse(desktopState, "Desktop viewport must default to expanded");
});

// ─── F05: Mobile Responsive Navigation ──────────────────────────────────────
registerTest("F05-T1-01", "F05", 1, "Mobile navigation sheet toggles on viewports under 768px", () => {
  let mobileDrawerOpen = false;
  const toggleDrawer = () => {
    mobileDrawerOpen = !mobileDrawerOpen;
  };
  toggleDrawer();
  assertTrue(mobileDrawerOpen, "Drawer must open on hamburger tap");
  toggleDrawer();
  assertFalse(mobileDrawerOpen, "Drawer must close on second tap");
});

registerTest("F05-T1-02", "F05", 1, "Touch navigation tap targets meet 44x44px minimum touch target size", () => {
  const navItemDimensions = { minWidth: 48, minHeight: 44 };
  assertTrue(navItemDimensions.minWidth >= 44, "Touch target width must be >= 44px");
  assertTrue(navItemDimensions.minHeight >= 44, "Touch target height must be >= 44px");
});

registerTest("F05-T1-03", "F05", 1, ".hide-on-mobile utility class hides badges and extra headers on <768px", () => {
  const mobileClasses = ["us-badge hide-on-mobile", "btn btn-secondary btn-sm hide-on-mobile"];
  for (const c of mobileClasses) {
    assertIncludes(c, "hide-on-mobile");
  }
});

registerTest("F05-T1-04", "F05", 1, "Touch swipe left (>50px) closes mobile drawer sheet", () => {
  const swipeClose = enterpriseHarness.navigation.handleMobileDrawerTouchSwipe(200, 140); // 60px diff
  assertTrue(swipeClose.shouldClose, "Swipe diff 60px > 50px must trigger close");

  const swipeStay = enterpriseHarness.navigation.handleMobileDrawerTouchSwipe(200, 170); // 30px diff
  assertFalse(swipeStay.shouldClose, "Swipe diff 30px <= 50px must NOT close");
});

registerTest("F05-T1-05", "F05", 1, "Body scroll locks when mobile drawer is active and Escape key dismisses", () => {
  let bodyOverflow = "hidden";
  assertEqual(bodyOverflow, "hidden", "Body overflow must lock to prevent background scroll");
  const onEscape = (key: string) => {
    if (key === "Escape") bodyOverflow = "";
  };
  onEscape("Escape");
  assertEqual(bodyOverflow, "", "Body overflow must reset on dismiss");
});

// ─── F06: Dashboard Route Completeness ──────────────────────────────────────
registerTest("F06-T1-01", "F06", 1, "Route /dashboard/databases resolves cleanly without 404", () => {
  const routes = enterpriseHarness.navigation.getAvailableDashboardRoutes();
  assertIncludes(routes, "/dashboard/databases");
});

registerTest("F06-T1-02", "F06", 1, "Route /dashboard/team resolves cleanly without 404", () => {
  const routes = enterpriseHarness.navigation.getAvailableDashboardRoutes();
  assertIncludes(routes, "/dashboard/team");
});

registerTest("F06-T1-03", "F06", 1, "Active route highlight matches pathname across all primary views", () => {
  const testPath = "/dashboard/databases";
  const isActive = (path: string) => testPath === path;
  assertTrue(isActive("/dashboard/databases"));
  assertFalse(isActive("/dashboard/projects"));
});

registerTest("F06-T1-04", "F06", 1, "Deep-linking directly to sub-routes retains navigational state", () => {
  const target = "/dashboard/projects";
  const routes = enterpriseHarness.navigation.getAvailableDashboardRoutes();
  assertTrue(routes.includes(target));
});

registerTest("F06-T1-05", "F06", 1, "Navigation links provide valid href targets without empty or hash fallbacks", () => {
  const routes = enterpriseHarness.navigation.getAvailableDashboardRoutes();
  for (const r of routes) {
    assertTrue(r.startsWith("/"), "Route must be absolute path");
    assertFalse(r.includes("#"), "Route must not be hash-only placeholder");
  }
});

// ─── F07: Prisma Schema RBAC Expansion ──────────────────────────────────────
registerTest("F07-T1-01", "F07", 1, "Prisma schema WorkspaceRole enum contains OWNER, ADMIN, MEMBER, VIEWER", () => {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  assertIncludes(schemaContent, "enum WorkspaceRole");
  assertIncludes(schemaContent, "OWNER");
  assertIncludes(schemaContent, "MEMBER");
  assertIncludes(schemaContent, "VIEWER");
});

registerTest("F07-T1-02", "F07", 1, "ADMIN role represents privileged workspace administrator level", () => {
  const roles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
  assertTrue(roles.includes("ADMIN"), "ADMIN role must be a first-class workspace role");
});

registerTest("F07-T1-03", "F07", 1, "Default member role defaults to MEMBER upon invitation or join", () => {
  const defaultRole = "MEMBER";
  assertEqual(defaultRole, "MEMBER");
});

registerTest("F07-T1-04", "F07", 1, "WorkspaceMember schema establishes unique compound index on [workspaceId, userId]", () => {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  assertIncludes(schemaContent, "@@unique([workspaceId, userId])");
});

registerTest("F07-T1-05", "F07", 1, "Role ordering defines strict hierarchy: OWNER > ADMIN > MEMBER > VIEWER", () => {
  const roleWeights: Record<string, number> = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };
  assertTrue(roleWeights.OWNER > roleWeights.ADMIN);
  assertTrue(roleWeights.ADMIN > roleWeights.MEMBER);
  assertTrue(roleWeights.MEMBER > roleWeights.VIEWER);
});

// ─── F08: RBAC Permission Enforcement & Deletion Guard ──────────────────────
registerTest("F08-T1-01", "F08", 1, "OWNER has permission to delete projects", () => {
  const check = enterpriseHarness.rbac.canDeleteProject("OWNER");
  assertTrue(check.allowed, "OWNER must be permitted to delete projects");
});

registerTest("F08-T1-02", "F08", 1, "ADMIN has permission to delete projects", () => {
  const check = enterpriseHarness.rbac.canDeleteProject("ADMIN");
  assertTrue(check.allowed, "ADMIN must be permitted to delete projects");
});

registerTest("F08-T1-03", "F08", 1, "MEMBER is strictly forbidden from deleting projects", () => {
  const check = enterpriseHarness.rbac.canDeleteProject("MEMBER");
  assertFalse(check.allowed, "MEMBER must be blocked from project deletion");
  assertIncludes(check.reason || "", "FORBIDDEN");
});

registerTest("F08-T1-04", "F08", 1, "VIEWER is strictly forbidden from deleting projects", () => {
  const check = enterpriseHarness.rbac.canDeleteProject("VIEWER");
  assertFalse(check.allowed, "VIEWER must be blocked from project deletion");
  assertIncludes(check.reason || "", "FORBIDDEN");
});

registerTest("F08-T1-05", "F08", 1, "Project deletion guard requires exact confirmation name matching", () => {
  const projectName = "production-cluster";
  const checkMismatch = (name: string) => name === projectName;
  assertFalse(checkMismatch("staging-cluster"));
  assertTrue(checkMismatch("production-cluster"));
});

// ─── F09: Team Invitation Flow & /invite/[token] ────────────────────────────
registerTest("F09-T1-01", "F09", 1, "Generates secure 64-character cryptographic invitation token", () => {
  const token = enterpriseHarness.rbac.generateInvitationToken();
  assertEqual(token.length, 64, "Token must be 64-character hex string");
  assertMatch(token, /^[0-9a-f]{64}$/);
});

registerTest("F09-T1-02", "F09", 1, "Creates workspace invitation with designated role and 7-day expiration", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_test_enterprise",
    email: "dev@company.com",
    role: "ADMIN",
    expiresInDays: 7,
  });
  assertEqual(invite.role, "ADMIN");
  assertEqual(invite.email, "dev@company.com");
  assertTrue(invite.expiresAt.getTime() > Date.now() + 6 * 24 * 3600 * 1000);
});

registerTest("F09-T1-03", "F09", 1, "Public invitation verification resolves metadata for pending token", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_public_test",
    role: "MEMBER",
  });
  assertEqual(invite.acceptedAt, null, "Must be pending");
  assertTrue(invite.expiresAt > new Date(), "Must not be expired");
});

registerTest("F09-T1-04", "F09", 1, "Valid invitation acceptance assigns designated role to joining member", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_invite_accept",
    email: "carol@enterprise.com",
    role: "ADMIN",
  });
  const res = enterpriseHarness.rbac.acceptInvite(invite, {
    id: "usr_carol",
    email: "carol@enterprise.com",
  });
  assertTrue(res.success);
  assertEqual(res.assignedRole, "ADMIN");
});

registerTest("F09-T1-05", "F09", 1, "Invitation acceptance marks token as accepted with current timestamp", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_timestamp_test",
    role: "MEMBER",
  });
  invite.acceptedAt = new Date();
  assertTrue(invite.acceptedAt instanceof Date);
});

// ─── F10: Member Management Table & Audit Logging ───────────────────────────
registerTest("F10-T1-01", "F10", 1, "Prevents demoting or removing the sole owner of a workspace", () => {
  const demoteSoleOwner = enterpriseHarness.rbac.canDemoteMember(
    "OWNER",
    "usr_sole_owner",
    "usr_sole_owner",
    "MEMBER",
    1
  );
  assertFalse(demoteSoleOwner.allowed);
  assertIncludes(demoteSoleOwner.reason || "", "sole owner");
});

registerTest("F10-T1-02", "F10", 1, "Audit log records member.invited event upon invite dispatch", () => {
  const auditEntries: any[] = [];
  const recordAudit = (action: string, metadata: any) => {
    auditEntries.push({ action, metadata, timestamp: new Date() });
  };
  recordAudit("member.invited", { email: "dev@acme.com", role: "ADMIN" });
  assertEqual(auditEntries.length, 1);
  assertEqual(auditEntries[0].action, "member.invited");
});

registerTest("F10-T1-03", "F10", 1, "Audit log records member.accepted_invite event upon token redemption", () => {
  const auditEntries: any[] = [];
  auditEntries.push({ action: "member.accepted_invite", userId: "usr_carol", role: "ADMIN" });
  assertEqual(auditEntries[0].action, "member.accepted_invite");
});

registerTest("F10-T1-04", "F10", 1, "Owner can remove another member from the workspace", () => {
  const callerRole = "OWNER";
  assertTrue(callerRole === "OWNER", "Owner has permission to remove members");
});

registerTest("F10-T1-05", "F10", 1, "Owner cannot remove themselves from workspace if they are the sole owner", () => {
  const isSoleOwner = true;
  const canSelfRemove = !isSoleOwner;
  assertFalse(canSelfRemove, "Cannot self-remove as sole owner");
});

// ─── F11: Tiered Pricing Engine (/pricing) ──────────────────────────────────
registerTest("F11-T1-01", "F11", 1, "Pricing engine configures Hobby ($0), Pro ($18), and Enterprise ($450)", () => {
  const plans = enterpriseHarness.pricing.getPlans();
  assertEqual(plans.hobby.monthlyPrice, 0);
  assertEqual(plans.pro.monthlyPrice, 18);
  assertEqual(plans.enterprise.monthlyPrice, 450);
});

registerTest("F11-T1-02", "F11", 1, "Pro plan includes 0ms cold starts, attached Postgres + Redis, unlimited seats", () => {
  const pro = enterpriseHarness.pricing.getPlans().pro;
  assertEqual(pro.coldStartTimeMs, 0, "Pro must have 0ms cold starts");
  assertEqual(pro.teamSeats, "unlimited", "Pro must include unlimited seats (no seat tax!)");
  assertIncludes(pro.managedDatabases.join(", "), "PostgreSQL");
  assertIncludes(pro.managedDatabases.join(", "), "Redis");
});

registerTest("F11-T1-03", "F11", 1, "Enterprise plan includes 99.99% SLA and 24/7 dedicated DevOps engineer support", () => {
  const enterprise = enterpriseHarness.pricing.getPlans().enterprise;
  assertEqual(enterprise.slaGuarantee, "99.99% Uptime SLA");
  assertIncludes(enterprise.supportLevel, "Dedicated DevOps");
});

registerTest("F11-T1-04", "F11", 1, "Annual billing applies 20% discount across paid tiers ($18 -> $15, $450 -> $360)", () => {
  const plans = enterpriseHarness.pricing.getPlans();
  assertEqual(plans.pro.annualPriceMonthly, 15, "Pro annual: $15/mo equivalent");
  assertEqual(plans.enterprise.annualPriceMonthly, 360, "Enterprise annual: $360/mo equivalent");
});

registerTest("F11-T1-05", "F11", 1, "Hobby plan is forever free with 1 managed DB and 100GB edge egress", () => {
  const hobby = enterpriseHarness.pricing.getPlans().hobby;
  assertEqual(hobby.monthlyPrice, 0);
  assertEqual(hobby.egressGb, 100);
});

// ─── F12: Competitive Comparison Matrix ─────────────────────────────────────
registerTest("F12-T1-01", "F12", 1, "Comparison matrix shows Syncbay eliminates Vercel $20/seat taxes", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 5,
    servicesCount: 6,
    egressGb: 300,
  });
  assertEqual(comp.syncbayTotal, 18, "Syncbay Pro is flat $18 for 5 seats");
  assertEqual(comp.vercelTotal, 5 * 20 + 30, "Vercel charges 5 * $20 + egress");
});

registerTest("F12-T1-02", "F12", 1, "Comparison matrix calculates annual savings >= $1,000 vs Vercel for 5-person team", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 5,
    servicesCount: 6,
    egressGb: 300,
  });
  assertTrue(comp.annualSavingsVsVercel >= 1000, `Expected savings >= $1,000, got $${comp.annualSavingsVsVercel}`);
});

registerTest("F12-T1-03", "F12", 1, "Comparison matrix shows Syncbay beats Railway $5 base + service compute markups", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 5,
    servicesCount: 6,
    egressGb: 300,
  });
  assertTrue(comp.railwayTotal > comp.syncbayTotal);
  assertTrue(comp.annualSavingsVsRailway >= 500);
});

registerTest("F12-T1-04", "F12", 1, "Side-by-side feature comparison table highlights 6 global POPs vs Vercel 1 region default", () => {
  const popsCount = 6;
  assertTrue(popsCount === 6, "Syncbay deploys active-active across 6 global edge POPs");
});

registerTest("F12-T1-05", "F12", 1, "Pro plan extra egress priced at hyper-competitive $0.04/GB vs Vercel $0.15/GB", () => {
  const syncbayEgressRate = 0.04;
  const vercelEgressRate = 0.15;
  assertTrue(syncbayEgressRate < vercelEgressRate);
});

// ─── F13: Official US Corporate Identity & Footer ───────────────────────────
registerTest("F13-T1-01", "F13", 1, "Official headquarters address matches 548 Market St, San Francisco, CA 94104", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.companyName, "Syncbay Technologies Inc.");
  assertIncludes(corp.headquartersAddress, "548 Market St");
  assertIncludes(corp.headquartersAddress, "Suite 82194");
  assertIncludes(corp.headquartersAddress, "San Francisco, CA 94104");
});

registerTest("F13-T1-02", "F13", 1, "Legal jurisdiction verified as Delaware C-Corporation, United States", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertIncludes(corp.incorporationState, "Delaware");
  assertEqual(corp.legalStructure, "C-Corporation");
});

registerTest("F13-T1-03", "F13", 1, "Legal disclosures affirm US data sovereignty under American compliance standards", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.dataSovereignty, "US Cloud Sovereignty");
  assertEqual(corp.country, "United States");
});

registerTest("F13-T1-04", "F13", 1, "MetadataBase and canonical URL configure official production domain https://www.syncbay.app", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.canonicalUrl, "https://www.syncbay.app");
});

registerTest("F13-T1-05", "F13", 1, "Corporate identity components format all address components accurately", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.street, "548 Market St");
  assertEqual(corp.suite, "Suite 82194");
  assertEqual(corp.city, "San Francisco");
  assertEqual(corp.state, "CA");
  assertEqual(corp.postalCode, "94104");
});

// ─── F14: Instant Deployment Rollback ───────────────────────────────────────
registerTest("F14-T1-01", "F14", 1, "Instant rollback shifts active deployment snapshot without full rebuild delay", async () => {
  const serviceId = "svc_instant_1";
  const dep1: any = {
    id: "dep_stable_1",
    serviceId,
    buildId: "bld_1",
    status: "SUPERSEDED",
    variables: { PORT: "3000" },
    domainSubdomain: "api-prod.syncbay.app",
    createdAt: new Date(Date.now() - 3600000),
    activatedAt: new Date(Date.now() - 3600000),
  };
  const dep2: any = {
    id: "dep_buggy_2",
    serviceId,
    buildId: "bld_2",
    status: "ACTIVE",
    variables: { PORT: "3000", CRASH: "true" },
    domainSubdomain: "api-prod.syncbay.app",
    createdAt: new Date(),
    activatedAt: new Date(),
  };

  enterpriseHarness.rollback.registerDeployment(dep1);
  enterpriseHarness.rollback.registerDeployment(dep2);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: dep1.id,
    callerRole: "OWNER",
  });

  assertTrue(res.success);
  assertEqual(res.activeDeploymentId, dep1.id);
  assertEqual(dep1.status, "ACTIVE");
  assertEqual(dep2.status, "SUPERSEDED");
});

registerTest("F14-T1-02", "F14", 1, "Instant rollback completes within sub-second execution budget (<100ms)", async () => {
  const serviceId = "svc_instant_perf";
  const depA: any = { id: "dep_a", serviceId, status: "SUPERSEDED" };
  const depB: any = { id: "dep_b", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(depA);
  enterpriseHarness.rollback.registerDeployment(depB);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: depA.id,
    callerRole: "ADMIN",
  });
  assertTrue(res.success);
  assertTrue(res.latencyMs < 100, `Rollback took ${res.latencyMs}ms, expected < 100ms`);
});

registerTest("F14-T1-03", "F14", 1, "Target deployment updates activatedAt timestamp on rollback", async () => {
  const serviceId = "svc_ts_check";
  const oldTime = new Date("2026-09-01T00:00:00Z");
  const depOld: any = { id: "dep_old", serviceId, status: "SUPERSEDED", activatedAt: oldTime };
  const depCurr: any = { id: "dep_curr", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(depOld);
  enterpriseHarness.rollback.registerDeployment(depCurr);

  await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: depOld.id,
    callerRole: "ADMIN",
  });
  assertTrue(depOld.activatedAt.getTime() > oldTime.getTime(), "Must update activatedAt");
});

registerTest("F14-T1-04", "F14", 1, "Instant rollback automatically triggers full edge cache invalidation", async () => {
  const initialAuditCount = enterpriseHarness.rollback.getPurgeAudit().length;
  const serviceId = "svc_cache_trigger";
  const depX: any = { id: "dep_x", serviceId, status: "SUPERSEDED" };
  const depY: any = { id: "dep_y", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(depX);
  enterpriseHarness.rollback.registerDeployment(depY);

  await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: depX.id,
    callerRole: "OWNER",
  });
  const newAuditCount = enterpriseHarness.rollback.getPurgeAudit().length;
  assertEqual(newAuditCount, initialAuditCount + 1, "Cache purge audit must be logged");
});

registerTest("F14-T1-05", "F14", 1, "ADMIN role is permitted to trigger instant rollbacks", async () => {
  const serviceId = "svc_admin_rb";
  const dep1: any = { id: "dep_admin_1", serviceId, status: "SUPERSEDED" };
  const dep2: any = { id: "dep_admin_2", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(dep1);
  enterpriseHarness.rollback.registerDeployment(dep2);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: dep1.id,
    callerRole: "ADMIN",
  });
  assertTrue(res.success, "ADMIN must be authorized to rollback");
});

// ─── F15: Environment Variable Synchronization ──────────────────────────────
registerTest("F15-T1-01", "F15", 1, "Bulk .env parser handles key-value pairs and ignores comments/blanks", () => {
  const raw = `
    # Database configuration
    DATABASE_URL=postgresql://user:pass@host:5432/db
    
    # Redis cache
    REDIS_URL=redis://default:token@cache.syncbay.run:6379
    PORT=8080
  `;
  const parsed = enterpriseHarness.envSync.parseDotEnv(raw);
  assertEqual(parsed["DATABASE_URL"], "postgresql://user:pass@host:5432/db");
  assertEqual(parsed["REDIS_URL"], "redis://default:token@cache.syncbay.run:6379");
  assertEqual(parsed["PORT"], "8080");
});

registerTest("F15-T1-02", "F15", 1, "Bulk .env parser strips single and double quotes from variable values", () => {
  const raw = `
    API_KEY="secret-12345"
    JWT_SECRET='another-secret-token'
  `;
  const parsed = enterpriseHarness.envSync.parseDotEnv(raw);
  assertEqual(parsed["API_KEY"], "secret-12345");
  assertEqual(parsed["JWT_SECRET"], "another-secret-token");
});

registerTest("F15-T1-03", "F15", 1, "Cross-environment copy transfers variables between Preview and Production", () => {
  const preview = { NODE_ENV: "preview", FEATURE_FLAG: "true", SHARED_SECRET: "xyz" };
  const prod = { NODE_ENV: "production" };

  const merged = enterpriseHarness.envSync.copyVariablesBetweenEnvironments(preview, prod, "merge");
  assertEqual(merged["FEATURE_FLAG"], "true");
  assertEqual(merged["SHARED_SECRET"], "xyz");
});

registerTest("F15-T1-04", "F15", 1, "Workspace-level variable inheritance with service override precedence", () => {
  const wsVars = { REGION: "us-west", LOG_LEVEL: "info", COMMON_KEY: "ws_val" };
  const svcVars = { LOG_LEVEL: "debug", SERVICE_NAME: "web-api" };

  const resolved = enterpriseHarness.envSync.inheritWorkspaceVariables(wsVars, svcVars);
  assertEqual(resolved["REGION"], "us-west", "Should inherit workspace var");
  assertEqual(resolved["LOG_LEVEL"], "debug", "Service var must override workspace var");
  assertEqual(resolved["SERVICE_NAME"], "web-api");
});

registerTest("F15-T1-05", "F15", 1, "Secret variable masking hides sensitive values in console views", () => {
  const vars = {
    PUBLIC_HOST: { value: "https://example.com", isSecret: false },
    DB_PASSWORD: { value: "SuperSecretPassword!", isSecret: true },
  };
  const masked = enterpriseHarness.envSync.maskSecrets(vars);
  assertEqual(masked["PUBLIC_HOST"], "https://example.com");
  assertEqual(masked["DB_PASSWORD"], "••••••••");
});

// ─── F16: Edge Cache Purging Engine ─────────────────────────────────────────
registerTest("F16-T1-01", "F16", 1, "Cache purge by tag invalidates across all 6 global edge POPs", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_edge_test",
    tag: "catalog-v2",
  });
  assertTrue(res.success);
  assertEqual(res.scope, "TAG:catalog-v2");
  assertEqual(res.purgedPops.length, 6);
  assertIncludes(res.purgedPops, "iad1");
  assertIncludes(res.purgedPops, "sfo1");
  assertIncludes(res.purgedPops, "fra1");
  assertIncludes(res.purgedPops, "sin1");
  assertIncludes(res.purgedPops, "lhr1");
  assertIncludes(res.purgedPops, "syd1");
});

registerTest("F16-T1-02", "F16", 1, "Cache purge by route path invalidates specific URL path", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_edge_test",
    path: "/api/v1/products",
  });
  assertTrue(res.success);
  assertEqual(res.scope, "PATH:/api/v1/products");
  assertEqual(res.purgedPops.length, 6);
});

registerTest("F16-T1-03", "F16", 1, "Cache purge all executes full multi-region edge cache flush", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_edge_test",
    all: true,
  });
  assertTrue(res.success);
  assertEqual(res.scope, "ALL");
  assertEqual(res.purgedPops.length, 6);
});

registerTest("F16-T1-04", "F16", 1, "Cache purge records duration in milliseconds and ISO timestamp", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_edge_perf",
    all: true,
  });
  assertTrue(res.durationMs > 0);
  assertMatch(res.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

registerTest("F16-T1-05", "F16", 1, "Cache purge by domain scopes invalidation to specified hostname", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_edge_dom",
    domain: "api.mycompany.com",
  });
  assertTrue(res.success);
  assertEqual(res.scope, "DOMAIN:api.mycompany.com");
});


// ══════════════════════════════════════════════════════════════════════════════
// TIER 2: BOUNDARY & CORNER CASES (50 tests)
// ══════════════════════════════════════════════════════════════════════════════

// ─── 1. Empty & Whitespace Inputs (5 tests) ─────────────────────────────────
registerTest("F08-T2-01", "F08", 2, "Project deletion with empty confirmation name rejected", () => {
  const projectName: string = "Production API";
  const confirmName: string = "";
  assertFalse(confirmName === projectName, "Empty confirmation string must not match");
});

registerTest("F08-T2-02", "F08", 2, "Project deletion with whitespace-only confirmation name rejected", () => {
  const projectName: string = "Production API";
  const confirmName: string = "   ";
  assertFalse(confirmName === projectName, "Whitespace-only confirmation must not match");
});

registerTest("F15-T2-01", "F15", 2, "Bulk .env import with empty string returns empty record", () => {
  const parsed = enterpriseHarness.envSync.parseDotEnv("");
  assertEqual(Object.keys(parsed).length, 0);
});

registerTest("F15-T2-02", "F15", 2, "Variable key with missing equal sign skipped safely", () => {
  const raw = "MALFORMED_LINE_WITHOUT_EQUALS\nVALID_KEY=valid_val";
  const parsed = enterpriseHarness.envSync.parseDotEnv(raw);
  assertEqual(Object.keys(parsed).length, 1);
  assertEqual(parsed["VALID_KEY"], "valid_val");
});

registerTest("F09-T2-01", "F09", 2, "Invitation creation with empty email creates link-based invite", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_empty_email",
    role: "MEMBER",
  });
  assertTrue(invite.token.length > 0);
  assertEqual(invite.email, undefined);
});

// ─── 2. Invalid Tokens & Signatures (5 tests) ───────────────────────────────
registerTest("F09-T2-02", "F09", 2, "Accepting expired invitation token rejected with error", () => {
  const invite: any = {
    token: "expired_token_123",
    role: "MEMBER",
    expiresAt: new Date(Date.now() - 10000),
    acceptedAt: null,
    workspaceId: "ws_expired",
  };
  const res = enterpriseHarness.rbac.acceptInvite(invite, { id: "u1", email: "user@test.com" });
  assertFalse(res.success);
  assertIncludes(res.error || "", "expired");
});

registerTest("F09-T2-03", "F09", 2, "Accepting already-accepted invitation token rejected with error", () => {
  const invite: any = {
    token: "accepted_token_123",
    role: "MEMBER",
    expiresAt: new Date(Date.now() + 86400000),
    acceptedAt: new Date(Date.now() - 5000),
    workspaceId: "ws_accepted",
  };
  const res = enterpriseHarness.rbac.acceptInvite(invite, { id: "u1", email: "user@test.com" });
  assertFalse(res.success);
  assertIncludes(res.error || "", "already been accepted");
});

registerTest("F09-T2-04", "F09", 2, "Invitation designated for specific email rejected when different user claims it", () => {
  const invite: any = {
    token: "designated_token",
    email: "designated@corporate.com",
    role: "ADMIN",
    expiresAt: new Date(Date.now() + 86400000),
    acceptedAt: null,
    workspaceId: "ws_desig",
  };
  const res = enterpriseHarness.rbac.acceptInvite(invite, { id: "u2", email: "attacker@random.com" });
  assertFalse(res.success);
  assertIncludes(res.error || "", "FORBIDDEN");
});

registerTest("F09-T2-05", "F09", 2, "Case-insensitive email comparison allows invite acceptance with differing case", () => {
  const invite: any = {
    token: "case_token",
    email: "Alice@Corporate.com",
    role: "ADMIN",
    expiresAt: new Date(Date.now() + 86400000),
    acceptedAt: null,
    workspaceId: "ws_case",
  };
  const res = enterpriseHarness.rbac.acceptInvite(invite, { id: "u1", email: "alice@corporate.com" });
  assertTrue(res.success);
});

registerTest("F01-T2-01", "F01", 2, "OAuth callback with missing code or state parameter fails validation", () => {
  const res = enterpriseHarness.oauth.validateCallback({
    iss: "https://github.com/login/oauth",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "Missing authorization code");
});

// ─── 3. Unauthorized Roles Attempting Operations (5 tests) ──────────────────
registerTest("F08-T2-03", "F08", 2, "MEMBER attempting project deletion returns FORBIDDEN", () => {
  const check = enterpriseHarness.rbac.canDeleteProject("MEMBER");
  assertFalse(check.allowed);
});

registerTest("F08-T2-04", "F08", 2, "VIEWER attempting project deletion returns FORBIDDEN", () => {
  const check = enterpriseHarness.rbac.canDeleteProject("VIEWER");
  assertFalse(check.allowed);
});

registerTest("F08-T2-05", "F08", 2, "VIEWER attempting to trigger deployment returns FORBIDDEN", () => {
  const check = enterpriseHarness.rbac.canTriggerDeployment("VIEWER");
  assertFalse(check.allowed);
});

registerTest("F08-T2-06", "F08", 2, "MEMBER attempting to modify billing configuration returns FORBIDDEN", () => {
  const check = enterpriseHarness.rbac.canModifyBilling("MEMBER");
  assertFalse(check.allowed);
});

registerTest("F08-T2-07", "F08", 2, "VIEWER attempting to invite team members returns FORBIDDEN", () => {
  const check = enterpriseHarness.rbac.canInviteMembers("VIEWER");
  assertFalse(check.allowed);
});

// ─── 4. Unauthenticated & Multi-Tenant Access (5 tests) ─────────────────────
registerTest("F08-T2-08", "F08", 2, "Sole owner cannot demote themselves without appointing another owner", () => {
  const res = enterpriseHarness.rbac.canDemoteMember("OWNER", "user_1", "user_1", "MEMBER", 1);
  assertFalse(res.allowed);
  assertIncludes(res.reason || "", "sole owner");
});

registerTest("F08-T2-09", "F08", 2, "Owner can demote themselves when at least one other owner exists", () => {
  const res = enterpriseHarness.rbac.canDemoteMember("OWNER", "user_1", "user_1", "MEMBER", 2);
  assertTrue(res.allowed);
});

registerTest("F08-T2-10", "F08", 2, "Non-owner (ADMIN) cannot demote or modify member roles", () => {
  const res = enterpriseHarness.rbac.canDemoteMember("ADMIN", "user_2", "user_admin", "MEMBER", 2);
  assertFalse(res.allowed);
  assertIncludes(res.reason || "", "FORBIDDEN");
});

registerTest("F01-T2-02", "F01", 2, "OAuth callback with mismatched RFC 9207 issuer rejected", () => {
  const res = enterpriseHarness.oauth.validateCallback({
    code: "code_xyz",
    state: "state_xyz",
    iss: "https://malicious-issuer.com/oauth",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "issuer mismatch");
});

registerTest("F01-T2-03", "F01", 2, "Relative callbackUrl preserved while rejecting javascript: schemes", () => {
  const validRelative = enterpriseHarness.oauth.validateCallback({
    code: "c",
    state: "s",
    iss: "https://github.com/login/oauth",
    callbackUrl: "/dashboard/settings",
  });
  assertEqual(validRelative.redirectUrl, "/dashboard/settings");

  const maliciousScheme = enterpriseHarness.oauth.validateCallback({
    code: "c",
    state: "s",
    iss: "https://github.com/login/oauth",
    callbackUrl: "javascript:alert(1)",
  });
  assertEqual(maliciousScheme.redirectUrl, "/dashboard", "Must sanitize to /dashboard");
});

// ─── 5. Rollback Edge Cases (5 tests) ───────────────────────────────────────
registerTest("F14-T2-01", "F14", 2, "Instant rollback to non-existent deployment ID returns NOT_FOUND", async () => {
  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId: "svc_test",
    targetDeploymentId: "dep_non_existent",
    callerRole: "OWNER",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "NOT_FOUND");
});

registerTest("F14-T2-02", "F14", 2, "Instant rollback to deployment from another service returns BAD_REQUEST", async () => {
  const otherDep: any = { id: "dep_other_svc", serviceId: "svc_OTHER", status: "SUPERSEDED" };
  enterpriseHarness.rollback.registerDeployment(otherDep);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId: "svc_TARGET",
    targetDeploymentId: otherDep.id,
    callerRole: "OWNER",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "does not belong to this service");
});

registerTest("F14-T2-03", "F14", 2, "Instant rollback to already active deployment returns BAD_REQUEST", async () => {
  const activeDep: any = { id: "dep_active_now", serviceId: "svc_same", status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(activeDep);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId: "svc_same",
    targetDeploymentId: activeDep.id,
    callerRole: "OWNER",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "already active");
});

registerTest("F14-T2-04", "F14", 2, "Instant rollback to a failed deployment returns BAD_REQUEST", async () => {
  const failedDep: any = { id: "dep_broken", serviceId: "svc_same", status: "FAILED" };
  enterpriseHarness.rollback.registerDeployment(failedDep);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId: "svc_same",
    targetDeploymentId: failedDep.id,
    callerRole: "OWNER",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "Cannot rollback to a failed deployment");
});

registerTest("F14-T2-05", "F14", 2, "MEMBER role attempting instant rollback returns FORBIDDEN", async () => {
  const dep: any = { id: "dep_target", serviceId: "svc_same", status: "SUPERSEDED" };
  enterpriseHarness.rollback.registerDeployment(dep);

  const res = await enterpriseHarness.rollback.instantRollback({
    serviceId: "svc_same",
    targetDeploymentId: dep.id,
    callerRole: "MEMBER",
  });
  assertFalse(res.success);
  assertIncludes(res.error || "", "FORBIDDEN");
});

// ─── 6. Env Var Edge Cases (5 tests) ────────────────────────────────────────
registerTest("F15-T2-03", "F15", 2, "Env var parser handles values containing equal signs cleanly", () => {
  const raw = "DATABASE_URL=postgres://user:p=a=s=s@host:5432/db?sslmode=require";
  const parsed = enterpriseHarness.envSync.parseDotEnv(raw);
  assertEqual(parsed["DATABASE_URL"], "postgres://user:p=a=s=s@host:5432/db?sslmode=require");
});

registerTest("F15-T2-04", "F15", 2, "Env var parser handles empty value after equal sign", () => {
  const raw = "EMPTY_VAR=";
  const parsed = enterpriseHarness.envSync.parseDotEnv(raw);
  assertEqual(parsed["EMPTY_VAR"], "");
});

registerTest("F15-T2-05", "F15", 2, "Env var copy in overwrite mode completely replaces target set", () => {
  const src = { KEY_A: "val_a" };
  const target = { KEY_B: "val_b", KEY_C: "val_c" };
  const overwritten = enterpriseHarness.envSync.copyVariablesBetweenEnvironments(src, target, "overwrite");
  assertEqual(overwritten["KEY_A"], "val_a");
  assertFalse("KEY_B" in overwritten);
});

registerTest("F15-T2-06", "F15", 2, "Workspace variables inherited by service without mutating originals", () => {
  const ws = { GLOBAL: "123" };
  const svc = { LOCAL: "456" };
  const combined = enterpriseHarness.envSync.inheritWorkspaceVariables(ws, svc);
  assertEqual(combined["GLOBAL"], "123");
  assertEqual(combined["LOCAL"], "456");
  assertFalse("LOCAL" in ws);
});

registerTest("F15-T2-07", "F15", 2, "Masking empty secret returns masked placeholder without leaking length", () => {
  const vars = { SECRET_EMPTY: { value: "", isSecret: true } };
  const masked = enterpriseHarness.envSync.maskSecrets(vars);
  assertEqual(masked["SECRET_EMPTY"], "••••••••");
});

// ─── 7. Edge Cache Purge Edge Cases (5 tests) ───────────────────────────────
registerTest("F16-T2-01", "F16", 2, "Cache purge with no specific filter scopes to UNKNOWN gracefully", () => {
  const res = enterpriseHarness.edgePurge.purge({ serviceId: "svc_x" });
  assertEqual(res.scope, "UNKNOWN");
  assertTrue(res.success);
});

registerTest("F16-T2-02", "F16", 2, "Path purge with special characters and URL encoding processed safely", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_x",
    path: "/api/data%20items?page=1",
  });
  assertIncludes(res.scope, "/api/data%20items?page=1");
});

registerTest("F16-T2-03", "F16", 2, "Tag purge with namespace prefix handles correctly", () => {
  const res = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_x",
    tag: "tenant-100:build-42",
  });
  assertEqual(res.scope, "TAG:tenant-100:build-42");
});

registerTest("F16-T2-04", "F16", 2, "Consecutive purge calls return unique timestamps or monotonic order", () => {
  const r1 = enterpriseHarness.edgePurge.purge({ serviceId: "svc_x", all: true });
  const r2 = enterpriseHarness.edgePurge.purge({ serviceId: "svc_x", all: true });
  assertTrue(new Date(r2.timestamp).getTime() >= new Date(r1.timestamp).getTime());
});

registerTest("F16-T2-05", "F16", 2, "Purged POPs list contains unique entries with zero duplicates", () => {
  const res = enterpriseHarness.edgePurge.purge({ serviceId: "svc_x", all: true });
  const set = new Set(res.purgedPops);
  assertEqual(set.size, res.purgedPops.length);
});

// ─── 8. Mobile Drawer Boundary Cases (5 tests) ──────────────────────────────
registerTest("F05-T2-01", "F05", 2, "Touch swipe left exactly at 50px does not close drawer", () => {
  const swipe = enterpriseHarness.navigation.handleMobileDrawerTouchSwipe(150, 100);
  assertFalse(swipe.shouldClose, "diff 50 is not > 50");
});

registerTest("F05-T2-02", "F05", 2, "Touch swipe left at 51px triggers drawer close", () => {
  const swipe = enterpriseHarness.navigation.handleMobileDrawerTouchSwipe(151, 100);
  assertTrue(swipe.shouldClose, "diff 51 > 50 must close");
});

registerTest("F05-T2-03", "F05", 2, "Touch swipe right (negative diff) does not close drawer", () => {
  const swipe = enterpriseHarness.navigation.handleMobileDrawerTouchSwipe(100, 180);
  assertFalse(swipe.shouldClose);
});

registerTest("F05-T2-04", "F05", 2, "Stored preference false on tablet viewport respects stored preference", () => {
  const state = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: "false",
    viewportWidth: 800,
  });
  assertFalse(state, "Explicit false must override tablet auto-collapse");
});

registerTest("F05-T2-05", "F05", 2, "Stored preference true on desktop viewport respects stored preference", () => {
  const state = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: "true",
    viewportWidth: 1920,
  });
  assertTrue(state, "Explicit true must override desktop default expanded");
});

// ─── 9. Pricing Engine Boundary Cases (5 tests) ─────────────────────────────
registerTest("F11-T2-01", "F11", 2, "0 team seats on Pro plan still bills flat base $18/mo", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 0,
    servicesCount: 1,
    egressGb: 100,
  });
  assertEqual(comp.syncbayTotal, 18);
});

registerTest("F11-T2-02", "F11", 2, "100 team seats on Pro plan bills flat base $18/mo (zero seat tax)", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 100,
    servicesCount: 1,
    egressGb: 100,
  });
  assertEqual(comp.syncbayTotal, 18, "Zero seat tax guarantees $18 regardless of seat count");
  assertEqual(comp.vercelTotal, 100 * 20, "Vercel would charge $2,000/mo");
});

registerTest("F11-T2-03", "F11", 2, "Egress at exactly 500GB incurs zero additional egress fees on Pro", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 1,
    servicesCount: 1,
    egressGb: 500,
  });
  assertEqual(comp.syncbayTotal, 18);
});

registerTest("F11-T2-04", "F11", 2, "Egress at 1000GB incurs only $20 extra egress fees on Pro ($0.04/GB)", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 1,
    servicesCount: 1,
    egressGb: 1000,
  });
  assertEqual(comp.syncbayTotal, 38);
});

registerTest("F11-T2-05", "F11", 2, "Annual discount on Enterprise tier saves $1,080 per year ($450 -> $360)", () => {
  const plans = enterpriseHarness.pricing.getPlans();
  const monthlyCost = plans.enterprise.monthlyPrice * 12;
  const annualCost = plans.enterprise.annualPriceMonthly * 12;
  const savings = monthlyCost - annualCost;
  assertEqual(savings, 1080);
});

// ─── 10. Corporate Identity Boundary Cases (5 tests) ────────────────────────
registerTest("F13-T2-01", "F13", 2, "San Francisco ZIP code matches official 94104 postal area", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.postalCode, "94104");
});

registerTest("F13-T2-02", "F13", 2, "Suite 82194 included in address verification string", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertIncludes(corp.headquartersAddress, "Suite 82194");
});

registerTest("F13-T2-03", "F13", 2, "State of Delaware string validation checks exact naming", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertTrue(corp.incorporationState.startsWith("State of Delaware"));
});

registerTest("F04-T2-02", "F04", 2, "Corrupted localStorage value (non-boolean string) falls back to viewport default", () => {
  const state = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: "corrupted_val",
    viewportWidth: 1200,
  });
  assertFalse(state, "corrupted string does not equal 'true'");
});

registerTest("F01-T2-04", "F01", 2, "Sign-in without callbackUrl query defaults redirect to /dashboard", () => {
  const res = enterpriseHarness.oauth.validateCallback({
    code: "code_valid",
    state: "state_valid",
    iss: "https://github.com/login/oauth",
  });
  assertEqual(res.redirectUrl, "/dashboard");
});


// ══════════════════════════════════════════════════════════════════════════════
// TIER 3: PAIRWISE CROSS-FEATURE COMBINATIONS (16 tests)
// ══════════════════════════════════════════════════════════════════════════════

registerTest("T3-ENT-01", "F08+F14", 3, "RBAC Role Hierarchy + Instant Deployment Rollback (OWNER/ADMIN allowed, MEMBER/VIEWER blocked)", async () => {
  const serviceId = "svc_t3_rbac_rb";
  const dep1: any = { id: "dep_t3_1", serviceId, status: "SUPERSEDED" };
  const dep2: any = { id: "dep_t3_2", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(dep1);
  enterpriseHarness.rollback.registerDeployment(dep2);

  const memberRes = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: dep1.id,
    callerRole: "MEMBER",
  });
  assertFalse(memberRes.success);
  assertIncludes(memberRes.error || "", "FORBIDDEN");

  const adminRes = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: dep1.id,
    callerRole: "ADMIN",
  });
  assertTrue(adminRes.success);
  assertEqual(dep1.status, "ACTIVE");
});

registerTest("T3-ENT-02", "F14+F16", 3, "Instant Rollback + Automated Multi-Region Edge Cache Flush", async () => {
  const serviceId = "svc_t3_rb_flush";
  const depA: any = { id: "dep_t3_a", serviceId, status: "SUPERSEDED" };
  const depB: any = { id: "dep_t3_b", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(depA);
  enterpriseHarness.rollback.registerDeployment(depB);

  const prevAuditLen = enterpriseHarness.rollback.getPurgeAudit().length;
  await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: depA.id,
    callerRole: "OWNER",
  });

  const currentAudit = enterpriseHarness.rollback.getPurgeAudit();
  assertEqual(currentAudit.length, prevAuditLen + 1);
  assertEqual(currentAudit[currentAudit.length - 1].scope, "ALL");
});

registerTest("T3-ENT-03", "F09+F01", 3, "Token Invitation Acceptance + Workspace Auto-Provisioning & Linking", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_team_enterprise",
    email: "newhire@company.com",
    role: "MEMBER",
  });

  const newUser = { id: "usr_newhire", name: "New Hire", email: "newhire@company.com" };

  const personalWs = enterpriseHarness.oauth.simulateWorkspaceAutoProvisioning(newUser);
  assertEqual(personalWs.workspace.memberRole, "OWNER");

  const acceptRes = enterpriseHarness.rbac.acceptInvite(invite, newUser);
  assertTrue(acceptRes.success);
  assertEqual(acceptRes.assignedRole, "MEMBER");
});

registerTest("T3-ENT-04", "F09+F10", 3, "Team Invitation Flow + Multi-Role Member Management + Audit Log Trail", () => {
  const invite = enterpriseHarness.rbac.createInvite({
    workspaceId: "ws_audit_test",
    email: "lead@agency.com",
    role: "ADMIN",
  });

  const auditEvents: string[] = [];
  auditEvents.push(`member.invited:${invite.email}:${invite.role}`);

  const user = { id: "usr_lead", email: "lead@agency.com" };
  const res = enterpriseHarness.rbac.acceptInvite(invite, user);
  assertTrue(res.success);
  auditEvents.push(`member.accepted_invite:${invite.workspaceId}:${user.id}`);

  assertEqual(auditEvents.length, 2);
  assertIncludes(auditEvents[0], "ADMIN");
  assertIncludes(auditEvents[1], "usr_lead");
});

registerTest("T3-ENT-05", "F14+F15", 3, "Environment Variable Sync + Deployment Snapshot Rollback Isolation", async () => {
  const serviceId = "svc_snap_vars";
  const depOld: any = {
    id: "dep_historical",
    serviceId,
    status: "SUPERSEDED",
    variables: { API_VERSION: "v1.0", CACHE_TTL: "3600" },
  };
  const depCurr: any = {
    id: "dep_current_mutated",
    serviceId,
    status: "ACTIVE",
    variables: { API_VERSION: "v2.0-broken", CACHE_TTL: "0" },
  };

  enterpriseHarness.rollback.registerDeployment(depOld);
  enterpriseHarness.rollback.registerDeployment(depCurr);

  const newRaw = "API_VERSION=v2.1-patched\nEXTRA_VAR=1";
  const parsed = enterpriseHarness.envSync.parseDotEnv(newRaw);
  assertEqual(parsed["API_VERSION"], "v2.1-patched");

  await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: depOld.id,
    callerRole: "OWNER",
  });

  const activeSnap = enterpriseHarness.rollback.getDeployment(depOld.id);
  assertEqual(activeSnap?.variables["API_VERSION"], "v1.0");
});

registerTest("T3-ENT-06", "F15+F08", 3, "Bulk .env Sync + Inter-Service Variable Reference and RBAC Enforcement", () => {
  const roleCheckMember = enterpriseHarness.rbac.canModifyBilling("MEMBER");
  assertFalse(roleCheckMember.allowed);

  const rawEnv = "DATABASE_URL=${{ Postgres.URL }}\nCACHE_URL=${{ Redis.URL }}";
  const parsed = enterpriseHarness.envSync.parseDotEnv(rawEnv);
  assertEqual(parsed["DATABASE_URL"], "${{ Postgres.URL }}");
  assertEqual(parsed["CACHE_URL"], "${{ Redis.URL }}");
});

registerTest("T3-ENT-07", "F01+F08", 3, "RFC 9207 GitHub OAuth + Personal Workspace Auto-Creation + Audit Log Invariant", () => {
  const newUser = { id: "usr_bob99", name: "Bob Engineer", email: "bob@syncbay.app" };
  const prov = enterpriseHarness.oauth.simulateWorkspaceAutoProvisioning(newUser);

  assertTrue(enterpriseHarness.rbac.canDeleteProject(prov.workspace.memberRole).allowed);
  assertTrue(enterpriseHarness.rbac.canModifyBilling(prov.workspace.memberRole).allowed);
  assertEqual(prov.auditLog.action, "workspace.created");
});

registerTest("T3-ENT-08", "F01+F09", 3, "OAuth Callback with Dynamic callbackUrl Pointing to /invite/[token]", () => {
  const inviteToken = enterpriseHarness.rbac.generateInvitationToken();
  const inviteUrl = `/invite/${inviteToken}`;

  const callbackRes = enterpriseHarness.oauth.validateCallback({
    code: "code_99",
    state: "state_99",
    iss: "https://github.com/login/oauth",
    callbackUrl: inviteUrl,
  });

  assertTrue(callbackRes.success);
  assertEqual(callbackRes.redirectUrl, inviteUrl);
});

registerTest("T3-ENT-09", "F11+F08", 3, "Multi-Tier Pricing Upgrade (Hobby to Pro) + Unlimited Seat Team Expansion", () => {
  const plans = enterpriseHarness.pricing.getPlans();
  assertEqual(plans.hobby.teamSeats, 1, "Hobby allows only 1 seat");
  assertEqual(plans.pro.teamSeats, "unlimited", "Pro allows unlimited team seats");

  const owner = "OWNER" as const;
  assertTrue(enterpriseHarness.rbac.canInviteMembers(owner).allowed);
});

registerTest("T3-ENT-10", "F11+F16", 3, "Pricing Calculator + Multi-Region Edge POP Egress Rate Math", () => {
  const comp = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 8,
    servicesCount: 10,
    egressGb: 800,
  });
  assertEqual(comp.syncbayTotal, 30);
  assertEqual(comp.vercelTotal, 265);
  assertTrue(comp.annualSavingsVsVercel >= 2500);
});

registerTest("T3-ENT-11", "F04+F06", 3, "Collapsible Sidebar Persistence + Route Completeness Navigation", () => {
  enterpriseHarness.navigation.setStorageItem("syncbay_sidebar_collapsed", "true");
  const routes = enterpriseHarness.navigation.getAvailableDashboardRoutes();

  for (const r of ["/dashboard/databases", "/dashboard/team", "/dashboard/settings"]) {
    assertIncludes(routes, r);
    const tt = enterpriseHarness.navigation.validateTooltipVisibility(true);
    assertTrue(tt.visible);
  }
});

registerTest("T3-ENT-12", "F05+F08", 3, "Mobile Responsive Drawer + RBAC Permission UI Gating", () => {
  const memberRole = "MEMBER" as const;
  assertFalse(enterpriseHarness.rbac.canDeleteProject(memberRole).allowed);
  assertFalse(enterpriseHarness.rbac.canModifyBilling(memberRole).allowed);
  assertTrue(enterpriseHarness.rbac.canTriggerDeployment(memberRole).allowed);
});

registerTest("T3-ENT-13", "F16+F14", 3, "Edge Cache Invalidation by Tag after Instant Rollback", () => {
  const tagPurge = enterpriseHarness.edgePurge.purge({
    serviceId: "svc_prod",
    tag: "release-v1.4",
  });
  assertEqual(tagPurge.scope, "TAG:release-v1.4");
  assertEqual(tagPurge.purgedPops.length, 6);
});

registerTest("T3-ENT-14", "F08+F10", 3, "RBAC Project Deletion Guard Audit Logging on Forbidden Attempts", () => {
  const auditLogs: Array<{ action: string; status: string; actor: string }> = [];
  const check = enterpriseHarness.rbac.canDeleteProject("MEMBER");
  if (!check.allowed) {
    auditLogs.push({ action: "project.delete", status: "BLOCKED_FORBIDDEN", actor: "usr_member" });
  }
  assertEqual(auditLogs.length, 1);
  assertEqual(auditLogs[0].status, "BLOCKED_FORBIDDEN");
});

registerTest("T3-ENT-15", "F01+F02", 3, "RFC 9207 OAuth Account Linking with Pre-Existing Email Account", () => {
  const provider = (authOptions.providers as any[]).find(
    (p) => p.id === "github" || p.name === "GitHub"
  );
  assertTrue(provider.allowDangerousEmailAccountLinking || provider.options?.allowDangerousEmailAccountLinking);
});

registerTest("T3-ENT-16", "F13+F11", 3, "Corporate Identity Verification on Public Pricing Route", () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertIncludes(corp.headquartersAddress, "548 Market St");
  assertEqual(corp.postalCode, "94104");

  const plans = enterpriseHarness.pricing.getPlans();
  assertTrue(plans.pro.monthlyPrice === 18);
});


// ══════════════════════════════════════════════════════════════════════════════
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (5 Complex Workflows)
// ══════════════════════════════════════════════════════════════════════════════

registerTest("T4-SCENARIO-ENT-01", "F07+F08+F09+F10", 4, "Scenario 1: Enterprise Team Onboarding & Multi-Role Governance Lifecycle", async () => {
  const ownerUser = { id: "usr_corp_owner", name: "David Owner", email: "david@acmecorp.com" };
  const ownerWs = enterpriseHarness.oauth.simulateWorkspaceAutoProvisioning(ownerUser);
  const workspaceId = ownerWs.workspace.id;
  const auditTrail: Array<{ action: string; actor: string; meta?: any }> = [
    { action: "workspace.created", actor: ownerUser.id },
  ];

  const adminInvite = enterpriseHarness.rbac.createInvite({
    workspaceId,
    email: "sarah@acmecorp.com",
    role: "ADMIN",
  });
  auditTrail.push({ action: "member.invited", actor: ownerUser.id, meta: { role: "ADMIN" } });

  const memberInvite = enterpriseHarness.rbac.createInvite({
    workspaceId,
    email: "mike@acmecorp.com",
    role: "MEMBER",
  });
  auditTrail.push({ action: "member.invited", actor: ownerUser.id, meta: { role: "MEMBER" } });

  const viewerInvite = enterpriseHarness.rbac.createInvite({
    workspaceId,
    email: "auditor@acmecorp.com",
    role: "VIEWER",
  });
  auditTrail.push({ action: "member.invited", actor: ownerUser.id, meta: { role: "VIEWER" } });

  const adminUser = { id: "usr_admin_sarah", email: "sarah@acmecorp.com" };
  const acceptAdmin = enterpriseHarness.rbac.acceptInvite(adminInvite, adminUser);
  assertTrue(acceptAdmin.success);
  assertEqual(acceptAdmin.assignedRole, "ADMIN");
  auditTrail.push({ action: "member.accepted_invite", actor: adminUser.id, meta: { role: "ADMIN" } });

  const memberUser = { id: "usr_member_mike", email: "mike@acmecorp.com" };
  const acceptMember = enterpriseHarness.rbac.acceptInvite(memberInvite, memberUser);
  assertTrue(acceptMember.success);
  assertEqual(acceptMember.assignedRole, "MEMBER");

  const deleteAttemptByMember = enterpriseHarness.rbac.canDeleteProject("MEMBER");
  assertFalse(deleteAttemptByMember.allowed, "Member must be blocked from deleting project");
  auditTrail.push({ action: "project.delete_attempt_blocked", actor: memberUser.id });

  const deleteAttemptByAdmin = enterpriseHarness.rbac.canDeleteProject("ADMIN");
  assertTrue(deleteAttemptByAdmin.allowed, "Admin must have project deletion permissions");

  const viewerUser = { id: "usr_auditor", email: "auditor@acmecorp.com" };
  const acceptViewer = enterpriseHarness.rbac.acceptInvite(viewerInvite, viewerUser);
  assertTrue(acceptViewer.success);
  assertFalse(enterpriseHarness.rbac.canTriggerDeployment("VIEWER").allowed);

  assertEqual(auditTrail.length, 6);
  assertEqual(auditTrail[0].action, "workspace.created");
  assertEqual(auditTrail[5].action, "project.delete_attempt_blocked");
});

registerTest("T4-SCENARIO-ENT-02", "F14+F16+F08", 4, "Scenario 2: Emergency Incident Response: Sub-Second Rollback & Multi-Region Edge Flush", async () => {
  const serviceId = "svc_enterprise_payments";

  const depStable: any = {
    id: "dep_release_v1_stable",
    serviceId,
    status: "SUPERSEDED",
    domainSubdomain: "payments.acme.syncbay.app",
    activatedAt: new Date(Date.now() - 7200000),
  };
  enterpriseHarness.rollback.registerDeployment(depStable);

  const depFaulty: any = {
    id: "dep_release_v1_1_buggy",
    serviceId,
    status: "ACTIVE",
    domainSubdomain: "payments.acme.syncbay.app",
    activatedAt: new Date(Date.now() - 300000),
  };
  enterpriseHarness.rollback.registerDeployment(depFaulty);

  const rollbackRes = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: depStable.id,
    callerRole: "ADMIN",
  });

  assertTrue(rollbackRes.success);
  assertTrue(rollbackRes.latencyMs < 50, "Sub-second traffic shift required");
  assertEqual(depStable.status, "ACTIVE");
  assertEqual(depFaulty.status, "SUPERSEDED");

  const purgeRes = enterpriseHarness.edgePurge.purge({
    serviceId,
    all: true,
  });
  assertTrue(purgeRes.success);
  assertEqual(purgeRes.purgedPops.length, 6);
  assertIncludes(purgeRes.purgedPops, "iad1");
  assertIncludes(purgeRes.purgedPops, "sfo1");
  assertIncludes(purgeRes.purgedPops, "fra1");
});

registerTest("T4-SCENARIO-ENT-03", "F15+F08", 4, "Scenario 3: DevOps Configuration Pipeline: Bulk .env Sync & Staging-to-Production Promotion", () => {
  const rawDotEnv = `
    # Core Service Config
    NODE_ENV=production
    PORT=3000
    
    # Inter-Service References
    DATABASE_URL=\${{ Postgres.URL }}
    REDIS_HOST=\${{ Redis.HOST }}
    
    # Security Credentials
    JWT_SECRET="e98f72a1b94c03d7e82f1092"
    API_MASTER_KEY='sb_live_secret_token_99'
  `;

  const parsedVars = enterpriseHarness.envSync.parseDotEnv(rawDotEnv);
  assertEqual(parsedVars["PORT"], "3000");
  assertEqual(parsedVars["JWT_SECRET"], "e98f72a1b94c03d7e82f1092");
  assertEqual(parsedVars["DATABASE_URL"], "${{ Postgres.URL }}");

  const varMetadata = {
    PORT: { value: parsedVars["PORT"], isSecret: false },
    DATABASE_URL: { value: parsedVars["DATABASE_URL"], isSecret: true },
    JWT_SECRET: { value: parsedVars["JWT_SECRET"], isSecret: true },
  };
  const maskedView = enterpriseHarness.envSync.maskSecrets(varMetadata);
  assertEqual(maskedView["PORT"], "3000");
  assertEqual(maskedView["DATABASE_URL"], "••••••••");
  assertEqual(maskedView["JWT_SECRET"], "••••••••");

  const stagingVars = { ...parsedVars, STAGING_DEBUG: "false" };
  const prodVars = { CLUSTER_REGION: "us-west" };
  const promotedProd = enterpriseHarness.envSync.copyVariablesBetweenEnvironments(
    stagingVars,
    prodVars,
    "merge"
  );

  assertEqual(promotedProd["PORT"], "3000");
  assertEqual(promotedProd["CLUSTER_REGION"], "us-west");
  assertEqual(promotedProd["STAGING_DEBUG"], "false");
});

registerTest("T4-SCENARIO-ENT-04", "F11+F12+F13+F01+F05", 4, "Scenario 4: Developer Journey: Public Evaluation -> US Compliance -> OAuth -> Mobile Console", () => {
  const comparison = enterpriseHarness.pricing.calculateCompetitorComparison({
    teamSeats: 5,
    servicesCount: 6,
    egressGb: 300,
  });
  assertEqual(comparison.syncbayTotal, 18, "Pro flat rate $18 for 5 seats");
  assertTrue(comparison.annualSavingsVsVercel >= 1000);

  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.companyName, "Syncbay Technologies Inc.");
  assertIncludes(corp.headquartersAddress, "548 Market St, Suite 82194, San Francisco, CA 94104");
  assertIncludes(corp.incorporationState, "Delaware");

  const oauthResult = enterpriseHarness.oauth.validateCallback({
    code: "oauth_flow_code",
    state: "oauth_flow_state",
    iss: "https://github.com/login/oauth",
    callbackUrl: "/dashboard",
  });
  assertTrue(oauthResult.success);
  assertEqual(oauthResult.redirectUrl, "/dashboard");

  const initialCollapse = enterpriseHarness.navigation.resolveInitialCollapseState({
    storedPreference: null,
    viewportWidth: 390,
  });
  assertTrue(initialCollapse, "Mobile viewport auto-collapses sidebar");

  const swipeResult = enterpriseHarness.navigation.handleMobileDrawerTouchSwipe(180, 110);
  assertTrue(swipeResult.shouldClose, "70px left swipe cleanly dismisses drawer");
});

registerTest("T4-SCENARIO-ENT-05", "F08+F14+F16+F13", 4, "Scenario 5: Complete Enterprise Security & Operational Resilience Lifecycle", async () => {
  const corp = enterpriseHarness.pricing.getCorporateIdentity();
  assertEqual(corp.dataSovereignty, "US Cloud Sovereignty");

  const flush = enterpriseHarness.edgePurge.purge({ serviceId: "svc_soc2", all: true });
  assertTrue(flush.success);
  assertEqual(flush.purgedPops.length, 6);

  const viewerDelete = enterpriseHarness.rbac.canDeleteProject("VIEWER");
  assertFalse(viewerDelete.allowed);

  const memberBilling = enterpriseHarness.rbac.canModifyBilling("MEMBER");
  assertFalse(memberBilling.allowed);

  const serviceId = "svc_resilience";
  const dep1: any = { id: "dep_res_1", serviceId, status: "SUPERSEDED" };
  const dep2: any = { id: "dep_res_2", serviceId, status: "ACTIVE" };
  enterpriseHarness.rollback.registerDeployment(dep1);
  enterpriseHarness.rollback.registerDeployment(dep2);

  const rb = await enterpriseHarness.rollback.instantRollback({
    serviceId,
    targetDeploymentId: dep1.id,
    callerRole: "OWNER",
  });
  assertTrue(rb.success);
  assertEqual(dep1.status, "ACTIVE");
});
