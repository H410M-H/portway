/**
 * Syncbay PaaS — Workspace RBAC, 7-Tab Navigation & Volume Reference Oracle (F1, F2, F3, F4, F5, F18)
 * Verifies role authorization, spending cap alerts, API token scopes,
 * 7-tab console contracts, and volume mounting validations.
 */

export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";
export type ApiTokenScope = "READ_ONLY" | "DEPLOY_ONLY" | "FULL_ACCESS";

export interface WorkspaceMember {
  userId: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  spendingCapCents: number;
  currentUsageCents: number;
  members: WorkspaceMember[];
  projectsCount: number;
  auditLogs: { id: string; action: string; timestamp: Date }[];
}

export interface ApiTokenData {
  id: string;
  name: string;
  tokenHash: string;
  scope: ApiTokenScope;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

export interface VolumeConfig {
  name: string;
  mountPath: string;
  sizeGb: number;
  serviceId: string;
}

export const PERMISSION_RULES: Record<
  string,
  { allowedRoles: WorkspaceRole[]; allowedTokenScopes: ApiTokenScope[] }
> = {
  VIEW_WORKSPACE: {
    allowedRoles: ["OWNER", "MEMBER", "VIEWER"],
    allowedTokenScopes: ["READ_ONLY", "DEPLOY_ONLY", "FULL_ACCESS"],
  },
  TRIGGER_DEPLOYMENT: {
    allowedRoles: ["OWNER", "MEMBER"],
    allowedTokenScopes: ["DEPLOY_ONLY", "FULL_ACCESS"],
  },
  MODIFY_SERVICE: {
    allowedRoles: ["OWNER", "MEMBER"],
    allowedTokenScopes: ["FULL_ACCESS"],
  },
  MANAGE_SPENDING_CAP: {
    allowedRoles: ["OWNER"],
    allowedTokenScopes: ["FULL_ACCESS"],
  },
  MANAGE_MEMBERS: {
    allowedRoles: ["OWNER"],
    allowedTokenScopes: ["FULL_ACCESS"],
  },
  CREATE_API_TOKEN: {
    allowedRoles: ["OWNER", "MEMBER"],
    allowedTokenScopes: ["FULL_ACCESS"],
  },
};

export class RbacOracle {
  hasPermission(role: WorkspaceRole, action: keyof typeof PERMISSION_RULES): boolean {
    const rule = PERMISSION_RULES[action];
    if (!rule) return false;
    return rule.allowedRoles.includes(role);
  }

  hasTokenPermission(scope: ApiTokenScope, action: keyof typeof PERMISSION_RULES): boolean {
    const rule = PERMISSION_RULES[action];
    if (!rule) return false;
    return rule.allowedTokenScopes.includes(scope);
  }

  checkSpendingCapAlert(
    spendingCapCents: number,
    currentUsageCents: number
  ): { exceeded: boolean; alertTriggered: boolean; percentageUsed: number } {
    if (spendingCapCents <= 0) {
      return { exceeded: false, alertTriggered: false, percentageUsed: 0 };
    }
    const ratio = currentUsageCents / spendingCapCents;
    const percentageUsed = +(ratio * 100).toFixed(1);
    return {
      exceeded: currentUsageCents >= spendingCapCents,
      alertTriggered: currentUsageCents >= spendingCapCents * 0.8, // 80% threshold
      percentageUsed,
    };
  }

  validateVolumeConfig(config: VolumeConfig): { valid: boolean; error?: string } {
    if (!config.name || config.name.trim().length === 0) {
      return { valid: false, error: "Volume name cannot be empty" };
    }
    if (config.sizeGb < 1 || config.sizeGb > 1000) {
      return { valid: false, error: "Volume size must be between 1 GB and 1000 GB" };
    }
    if (!config.mountPath.startsWith("/")) {
      return { valid: false, error: "Mount path must be an absolute path starting with /" };
    }
    if (config.mountPath === "/" || config.mountPath === "/root") {
      return { valid: false, error: "Mount path cannot overwrite system root directory" };
    }
    if (config.mountPath.includes("..") || /[\0<>:*?"|]/.test(config.mountPath)) {
      return { valid: false, error: "Mount path contains invalid or malicious characters" };
    }
    return { valid: true };
  }

  getProjectConsoleTabs(): string[] {
    return [
      "services",
      "deployments",
      "logs",
      "metrics",
      "databases",
      "domains",
      "settings",
    ];
  }
}
