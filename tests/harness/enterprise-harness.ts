/**
 * Syncbay PaaS — Enterprise Test Harness & Reference Oracles
 * Supports Tiers 1-4 for Enterprise Features F01 through F16:
 * - RFC 9207 OAuth Issuer & Callback Handshake (F01, F02)
 * - Modern Collapsible Sidebar & localStorage Persistence (F04)
 * - Mobile Responsive Drawer Navigation (F05)
 * - Dashboard Route Completeness & Zero 404s (F06)
 * - Workspace RBAC Role Hierarchy & Project Deletion Guard (F07, F08)
 * - Team Invitations & /invite/[token] Acceptance (F09, F10)
 * - Hyper-Competitive Multi-Tier Pricing Engine & Comparison Matrix (F11, F12)
 * - Official US Corporate Identity & Legal Footer (F13)
 * - Advanced DevOps: Instant Deployment Rollback (F14)
 * - Advanced DevOps: Environment Variable Synchronization (F15)
 * - Advanced DevOps: Edge Cache Purging Engine (F16)
 */

import crypto from "node:crypto";
import { authOptions } from "../../src/lib/auth";

// ─── 1. RFC 9207 OAuth Oracle ────────────────────────────────────────────────
export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  iss?: string;
  callbackUrl?: string;
}

export class OAuthOracle {
  getGitHubProviderConfig() {
    const provider = (authOptions.providers as any[]).find(
      (p) => p.id === "github" || p.name === "GitHub"
    );
    return provider ? provider.options || provider : null;
  }

  validateCallback(params: OAuthCallbackParams): {
    success: boolean;
    error?: string;
    redirectUrl: string;
  } {
    const provider = this.getGitHubProviderConfig();
    const configuredIssuer = provider?.issuer || "https://github.com/login/oauth";

    // RFC 9207 validation: if issuer param is present, it MUST match configured issuer
    if (params.iss && params.iss !== configuredIssuer) {
      return {
        success: false,
        error: "OAuthCallback: issuer mismatch or unconfigured issuer (RFC 9207 violation)",
        redirectUrl: "/auth/signin?error=OAuthCallback",
      };
    }

    if (!params.code || !params.state) {
      return {
        success: false,
        error: "Missing authorization code or state",
        redirectUrl: "/auth/signin?error=OAuthCallback",
      };
    }

    // Default or preserved callback URL
    const targetUrl =
      params.callbackUrl && params.callbackUrl.startsWith("/")
        ? params.callbackUrl
        : "/dashboard";

    return {
      success: true,
      redirectUrl: targetUrl,
    };
  }

  simulateWorkspaceAutoProvisioning(user: { id: string; name?: string; email: string }) {
    const baseName = user.name ?? user.email.split("@")[0] ?? "user";
    const slug = `${baseName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 24)}-${user.id.slice(0, 6)}`;

    return {
      workspace: {
        id: `ws_${crypto.randomUUID().slice(0, 8)}`,
        name: user.name ?? `${baseName}'s Workspace`,
        slug,
        isPersonal: true,
        memberRole: "OWNER" as const,
      },
      auditLog: {
        action: "workspace.created",
        actorUserId: user.id,
        metadata: { isPersonal: true, automated: true },
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// ─── 2. Navigation & Sidebar Oracle ──────────────────────────────────────────
export class NavigationOracle {
  private storage: Record<string, string> = {};

  getStorageItem(key: string): string | null {
    return this.storage[key] ?? null;
  }

  setStorageItem(key: string, value: string): void {
    this.storage[key] = value;
  }

  resolveInitialCollapseState(params: {
    storedPreference: string | null;
    viewportWidth: number;
  }): boolean {
    if (params.storedPreference !== null) {
      return params.storedPreference === "true";
    }
    // Tablet breakpoint default (< 1024px)
    return params.viewportWidth < 1024;
  }

  toggleCollapse(currentState: boolean): boolean {
    const next = !currentState;
    this.setStorageItem("syncbay_sidebar_collapsed", String(next));
    return next;
  }

  handleKeyboardShortcut(e: { key: string; ctrlKey?: boolean; metaKey?: boolean }, currentState: boolean): boolean {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      return this.toggleCollapse(currentState);
    }
    return currentState;
  }

  validateTooltipVisibility(isCollapsed: boolean): { visible: boolean; position: string; overflowSafe: boolean } {
    return {
      visible: isCollapsed,
      position: "left: calc(100% + 10px)",
      overflowSafe: true, // CSS rule: .sidebar.is-collapsed { overflow: visible }
    };
  }

  handleMobileDrawerTouchSwipe(startX: number, currentX: number): { shouldClose: boolean; diffX: number } {
    const diffX = startX - currentX;
    return {
      shouldClose: diffX > 50,
      diffX,
    };
  }

  getAvailableDashboardRoutes(): string[] {
    return [
      "/dashboard",
      "/dashboard/projects",
      "/dashboard/databases",
      "/dashboard/team",
      "/dashboard/settings",
      "/pricing",
      "/invite",
    ];
  }
}

// ─── 3. Enterprise RBAC Oracle ───────────────────────────────────────────────
export type EnterpriseRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export class EnterpriseRbacOracle {
  canDeleteProject(role: EnterpriseRole): PermissionCheckResult {
    if (role === "OWNER" || role === "ADMIN") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Only workspace Owners and Admins can delete projects.",
    };
  }

  canModifyBilling(role: EnterpriseRole): PermissionCheckResult {
    if (role === "OWNER" || role === "ADMIN") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Only workspace Owners and Admins can modify billing configurations.",
    };
  }

  canInviteMembers(role: EnterpriseRole): PermissionCheckResult {
    if (role === "OWNER" || role === "ADMIN") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Only workspace Owners and Admins can invite team members.",
    };
  }

  canTriggerDeployment(role: EnterpriseRole): PermissionCheckResult {
    if (role === "OWNER" || role === "ADMIN" || role === "MEMBER") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Viewers have read-only access and cannot trigger deployments.",
    };
  }

  canDemoteMember(
    callerRole: EnterpriseRole,
    targetUserId: string,
    callerUserId: string,
    targetRole: EnterpriseRole,
    totalOwnersCount: number
  ): PermissionCheckResult {
    if (callerRole !== "OWNER") {
      return { allowed: false, reason: "FORBIDDEN: Only workspace owners can modify member roles." };
    }
    if (targetUserId === callerUserId && targetRole !== "OWNER" && totalOwnersCount <= 1) {
      return {
        allowed: false,
        reason: "BAD_REQUEST: Cannot demote the sole owner of a workspace. Promote another owner first.",
      };
    }
    return { allowed: true };
  }

  generateInvitationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  createInvite(params: {
    workspaceId: string;
    email?: string;
    role: EnterpriseRole;
    expiresInDays?: number;
  }) {
    const token = this.generateInvitationToken();
    const days = params.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return {
      id: `inv_${crypto.randomUUID().slice(0, 8)}`,
      token,
      workspaceId: params.workspaceId,
      email: params.email?.toLowerCase().trim(),
      role: params.role,
      expiresAt,
      acceptedAt: null as Date | null,
    };
  }

  acceptInvite(
    invite: {
      token: string;
      email?: string;
      role: EnterpriseRole;
      expiresAt: Date;
      acceptedAt: Date | null;
      workspaceId: string;
    },
    currentUser: { id: string; email: string }
  ): { success: boolean; error?: string; assignedRole?: EnterpriseRole } {
    if (invite.acceptedAt) {
      return { success: false, error: "Invitation has already been accepted." };
    }
    if (invite.expiresAt < new Date()) {
      return { success: false, error: "Invitation has expired." };
    }
    if (invite.email && invite.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      return {
        success: false,
        error: `FORBIDDEN: Invitation is designated for ${invite.email}, not ${currentUser.email}.`,
      };
    }

    return {
      success: true,
      assignedRole: invite.role,
    };
  }
}

// ─── 4. Hyper-Competitive Pricing & Corporate Identity Oracle ────────────────
export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPriceMonthly: number;
  teamSeats: number | "unlimited";
  coldStartTimeMs: number;
  egressGb: number;
  managedDatabases: string[];
  edgePops: number;
  customDomainsAutoSsl: boolean;
  slaGuarantee?: string;
  supportLevel: string;
}

export class PricingOracle {
  getPlans(): Record<string, PricingPlan> {
    return {
      hobby: {
        id: "hobby",
        name: "Hobby",
        monthlyPrice: 0,
        annualPriceMonthly: 0,
        teamSeats: 1,
        coldStartTimeMs: 250,
        egressGb: 100,
        managedDatabases: ["1 Managed Postgres (1GB)"],
        edgePops: 6,
        customDomainsAutoSsl: true,
        supportLevel: "Community",
      },
      pro: {
        id: "pro",
        name: "Pro Developer",
        monthlyPrice: 18,
        annualPriceMonthly: 15,
        teamSeats: "unlimited", // Zero seat taxes!
        coldStartTimeMs: 0, // 0ms cold starts
        egressGb: 500,
        managedDatabases: ["Managed PostgreSQL", "Redis Cache", "MySQL"],
        edgePops: 6,
        customDomainsAutoSsl: true,
        supportLevel: "Standard Email & Chat",
      },
      enterprise: {
        id: "enterprise",
        name: "Enterprise",
        monthlyPrice: 450,
        annualPriceMonthly: 360,
        teamSeats: "unlimited",
        coldStartTimeMs: 0,
        egressGb: 5000,
        managedDatabases: ["Dedicated HA Clusters", "Multi-Region Replication"],
        edgePops: 6,
        customDomainsAutoSsl: true,
        slaGuarantee: "99.99% Uptime SLA",
        supportLevel: "24/7 Dedicated DevOps Engineer Support",
      },
    };
  }

  calculateCompetitorComparison(params: {
    teamSeats: number;
    servicesCount: number;
    egressGb: number;
  }) {
    // Syncbay Pro: $18/mo includes unlimited seats! Extra egress: $0.04/GB over 500GB
    const syncbayBase = 18;
    const syncbayExtraEgress = Math.max(0, params.egressGb - 500) * 0.04;
    const syncbayTotal = syncbayBase + syncbayExtraEgress;

    // Vercel Pro: $20 per seat tax! + $0.15/GB egress over 100GB
    const vercelTotal = params.teamSeats * 20 + Math.max(0, params.egressGb - 100) * 0.15;

    // Railway: $5 base + $14/service + $0.10/GB egress
    const railwayTotal = 5 + params.servicesCount * 14 + params.egressGb * 0.10;

    const annualSavingsVsVercel = (vercelTotal - syncbayTotal) * 12;
    const annualSavingsVsRailway = (railwayTotal - syncbayTotal) * 12;

    return {
      syncbayTotal,
      vercelTotal,
      railwayTotal,
      annualSavingsVsVercel,
      annualSavingsVsRailway,
    };
  }

  getCorporateIdentity() {
    return {
      companyName: "Syncbay Technologies Inc.",
      headquartersAddress: "548 Market St, Suite 82194, San Francisco, CA 94104, United States",
      street: "548 Market St",
      suite: "Suite 82194",
      city: "San Francisco",
      state: "CA",
      postalCode: "94104",
      country: "United States",
      incorporationState: "State of Delaware, United States",
      legalStructure: "C-Corporation",
      dataSovereignty: "US Cloud Sovereignty",
      canonicalUrl: "https://www.syncbay.app",
    };
  }
}

// ─── 5. Advanced DevOps: Instant Rollback Oracle ─────────────────────────────
export interface DeploymentSnapshot {
  id: string;
  serviceId: string;
  buildId: string;
  status: "ACTIVE" | "SUPERSEDED" | "BUILDING" | "FAILED";
  variables: Record<string, string>;
  domainSubdomain: string;
  createdAt: Date;
  activatedAt: Date;
}

export class InstantRollbackOracle {
  private deployments: Map<string, DeploymentSnapshot> = new Map();
  private cachePurgeAudit: Array<{ scope: string; timestamp: Date }> = [];

  registerDeployment(dep: DeploymentSnapshot) {
    this.deployments.set(dep.id, dep);
  }

  getDeployment(id: string) {
    return this.deployments.get(id);
  }

  getPurgeAudit() {
    return this.cachePurgeAudit;
  }

  async instantRollback(params: {
    serviceId: string;
    targetDeploymentId: string;
    callerRole: EnterpriseRole;
  }): Promise<{
    success: boolean;
    activeDeploymentId?: string;
    previousDeploymentId?: string;
    latencyMs: number;
    error?: string;
  }> {
    // RBAC check: only OWNER and ADMIN can rollback
    if (params.callerRole !== "OWNER" && params.callerRole !== "ADMIN") {
      return {
        success: false,
        error: "FORBIDDEN: Only workspace Owners and Admins can execute instant rollbacks.",
        latencyMs: 1,
      };
    }

    const target = this.deployments.get(params.targetDeploymentId);
    if (!target) {
      return {
        success: false,
        error: "NOT_FOUND: Target deployment does not exist.",
        latencyMs: 1,
      };
    }

    if (target.serviceId !== params.serviceId) {
      return {
        success: false,
        error: "BAD_REQUEST: Target deployment does not belong to this service.",
        latencyMs: 1,
      };
    }

    if (target.status === "ACTIVE") {
      return {
        success: false,
        error: "BAD_REQUEST: Target deployment is already active.",
        latencyMs: 1,
      };
    }

    if (target.status === "FAILED") {
      return {
        success: false,
        error: "BAD_REQUEST: Cannot rollback to a failed deployment.",
        latencyMs: 1,
      };
    }

    const tStart = Date.now();

    // Find current active deployment for service
    let currentActiveId: string | undefined;
    for (const [id, d] of this.deployments.entries()) {
      if (d.serviceId === params.serviceId && d.status === "ACTIVE") {
        d.status = "SUPERSEDED";
        currentActiveId = id;
      }
    }

    // Shift traffic instantly: activate target deployment snapshot
    target.status = "ACTIVE";
    target.activatedAt = new Date();

    // Automated cache purge on all edge POPs
    this.cachePurgeAudit.push({
      scope: "ALL",
      timestamp: new Date(),
    });

    const latencyMs = Date.now() - tStart;

    return {
      success: true,
      activeDeploymentId: target.id,
      previousDeploymentId: currentActiveId,
      latencyMs: Math.max(1, latencyMs),
    };
  }
}

// ─── 6. Advanced DevOps: Environment Variable Sync Oracle ───────────────────
export class EnvVarSyncOracle {
  parseDotEnv(rawContent: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = rawContent.split("\n");

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;

      const eqIdx = line.indexOf("=");
      if (eqIdx <= 0) continue;

      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();

      // Handle quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }

      result[key] = val;
    }

    return result;
  }

  copyVariablesBetweenEnvironments(
    sourceVars: Record<string, string>,
    targetVars: Record<string, string>,
    mode: "merge" | "overwrite"
  ): Record<string, string> {
    if (mode === "overwrite") {
      return { ...sourceVars };
    }
    return { ...targetVars, ...sourceVars };
  }

  inheritWorkspaceVariables(
    workspaceVars: Record<string, string>,
    serviceVars: Record<string, string>
  ): Record<string, string> {
    // Service-level variables override workspace-level defaults
    return { ...workspaceVars, ...serviceVars };
  }

  maskSecrets(vars: Record<string, { value: string; isSecret: boolean }>): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(vars)) {
      if (v.isSecret) {
        masked[k] = "••••••••";
      } else {
        masked[k] = v.value;
      }
    }
    return masked;
  }
}

// ─── 7. Advanced DevOps: Edge Cache Purging Engine Oracle ───────────────────
export interface EdgeCachePurgeRequest {
  serviceId: string;
  domain?: string;
  path?: string;
  tag?: string;
  all?: boolean;
}

export interface EdgeCachePurgeResult {
  success: boolean;
  purgedPops: string[];
  scope: string;
  timestamp: string;
  durationMs: number;
}

export class EdgeCachePurgeOracle {
  private readonly POPS = ["iad1", "sfo1", "fra1", "lhr1", "sin1", "syd1"];

  purge(req: EdgeCachePurgeRequest): EdgeCachePurgeResult {
    const tStart = Date.now();

    let scope = "UNKNOWN";
    if (req.all) {
      scope = "ALL";
    } else if (req.tag) {
      scope = `TAG:${req.tag}`;
    } else if (req.path) {
      scope = `PATH:${req.path}`;
    } else if (req.domain) {
      scope = `DOMAIN:${req.domain}`;
    }

    const durationMs = Math.max(1, Date.now() - tStart);

    return {
      success: true,
      purgedPops: [...this.POPS],
      scope,
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }
}

// ─── Unified Enterprise Harness Instance ────────────────────────────────────
export const enterpriseHarness = {
  oauth: new OAuthOracle(),
  navigation: new NavigationOracle(),
  rbac: new EnterpriseRbacOracle(),
  pricing: new PricingOracle(),
  rollback: new InstantRollbackOracle(),
  envSync: new EnvVarSyncOracle(),
  edgePurge: new EdgeCachePurgeOracle(),
};
