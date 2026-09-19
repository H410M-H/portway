/**
 * Syncbay PaaS — Rolling Releases & Canary Traffic Shifting Engine
 * PRD Phase 3 & Vercel Challenger — Automated 0-Downtime Traffic Shifting
 * Provides granular traffic weighting between stable and canary releases,
 * automatic error-threshold tripwires, and instant 1-click promotion/rollback.
 */

export interface CanaryConfig {
  serviceId: string;
  stableDeploymentId: string;
  canaryDeploymentId: string;
  canaryWeightPercent: number; // 0 to 100
  autoRollbackThreshold5xxPercent: number; // e.g. 1.5%
  status: "ACTIVE" | "PROMOTED" | "ROLLED_BACK";
  startedAt: string;
  totalRequestsRouted: number;
  canaryRequestsRouted: number;
  canary5xxErrors: number;
  lastHealthEvaluation?: {
    evaluatedAt: string;
    canary5xxRatePercent: number;
    healthy: boolean;
    reason?: string;
  };
}

const canaryConfigsStore: Map<string, CanaryConfig> = new Map();

export function getCanaryConfig(serviceId: string): CanaryConfig {
  const existing = canaryConfigsStore.get(serviceId);
  if (existing) return existing;

  const config: CanaryConfig = {
    serviceId,
    stableDeploymentId: `dep_stable_${serviceId.slice(0, 6)}`,
    canaryDeploymentId: `dep_canary_${serviceId.slice(0, 6)}`,
    canaryWeightPercent: 10,
    autoRollbackThreshold5xxPercent: 1.5,
    status: "ACTIVE",
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    totalRequestsRouted: 14280,
    canaryRequestsRouted: 1428,
    canary5xxErrors: 3,
    lastHealthEvaluation: {
      evaluatedAt: new Date(Date.now() - 60000 * 2).toISOString(),
      canary5xxRatePercent: 0.21,
      healthy: true,
      reason: "Canary error rate (0.21%) within safe threshold (<1.50%)",
    },
  };

  canaryConfigsStore.set(serviceId, config);
  return config;
}

export function updateCanaryWeight(serviceId: string, weightPercent: number): CanaryConfig {
  if (weightPercent < 0 || weightPercent > 100) {
    throw new Error("Canary weight must be between 0 and 100 percent");
  }
  const config = getCanaryConfig(serviceId);
  config.canaryWeightPercent = weightPercent;
  if (weightPercent === 100) {
    config.status = "PROMOTED";
    config.stableDeploymentId = config.canaryDeploymentId;
  } else if (weightPercent === 0) {
    config.status = "ROLLED_BACK";
  } else {
    config.status = "ACTIVE";
  }
  canaryConfigsStore.set(serviceId, config);
  return config;
}

/**
 * Routes an incoming client request to either stable or canary deployment
 */
export function routeTraffic(config: CanaryConfig, randomSeed?: number): string {
  if (config.status === "ROLLED_BACK" || config.canaryWeightPercent <= 0) {
    config.totalRequestsRouted++;
    return config.stableDeploymentId;
  }
  if (config.status === "PROMOTED" || config.canaryWeightPercent >= 100) {
    config.totalRequestsRouted++;
    return config.canaryDeploymentId;
  }

  const roll = randomSeed !== undefined ? randomSeed % 100 : Math.random() * 100;
  config.totalRequestsRouted++;

  if (roll < config.canaryWeightPercent) {
    config.canaryRequestsRouted++;
    return config.canaryDeploymentId;
  }

  return config.stableDeploymentId;
}

/**
 * Evaluates canary health and triggers automated circuit breaker rollback if error threshold exceeded
 */
export function evaluateCanaryHealth(
  config: CanaryConfig,
  incomingErrors5xx: number = 0,
  incomingRequests: number = 100
): { action: "MAINTAIN" | "ROLLBACK" | "PROMOTE"; errorRatePercent: number; reason: string } {
  // Sticky circuit breaker: if already tripped, remain rolled back until explicit re-weighting
  if (config.status === "ROLLED_BACK") {
    return {
      action: "ROLLBACK",
      errorRatePercent: config.lastHealthEvaluation?.canary5xxRatePercent ?? 0,
      reason: "Canary deployment is already in ROLLED_BACK circuit-breaker state. Reset weight to retry.",
    };
  }

  if (config.status === "PROMOTED") {
    return {
      action: "PROMOTE",
      errorRatePercent: 0,
      reason: "Canary has already been promoted to 100% production.",
    };
  }

  const safeErrors = Math.max(0, incomingErrors5xx);
  const safeRequests = Math.max(safeErrors, incomingRequests);

  config.canary5xxErrors += safeErrors;
  config.canaryRequestsRouted += safeRequests;
  config.totalRequestsRouted += safeRequests;

  const errorRatePercent =
    config.canaryRequestsRouted > 0
      ? +((config.canary5xxErrors / config.canaryRequestsRouted) * 100).toFixed(2)
      : 0;

  if (errorRatePercent >= config.autoRollbackThreshold5xxPercent) {
    config.status = "ROLLED_BACK";
    config.canaryWeightPercent = 0;
    config.lastHealthEvaluation = {
      evaluatedAt: new Date().toISOString(),
      canary5xxRatePercent: errorRatePercent,
      healthy: false,
      reason: `Automated Rollback Triggered: Canary 5xx error rate (${errorRatePercent}%) exceeded safety threshold (${config.autoRollbackThreshold5xxPercent}%)`,
    };
    canaryConfigsStore.set(config.serviceId, config);
    return {
      action: "ROLLBACK",
      errorRatePercent,
      reason: config.lastHealthEvaluation.reason!,
    };
  }

  config.lastHealthEvaluation = {
    evaluatedAt: new Date().toISOString(),
    canary5xxRatePercent: errorRatePercent,
    healthy: true,
    reason: `Canary healthy: error rate ${errorRatePercent}% is below threshold (${config.autoRollbackThreshold5xxPercent}%)`,
  };
  canaryConfigsStore.set(config.serviceId, config);

  return {
    action: "MAINTAIN",
    errorRatePercent,
    reason: config.lastHealthEvaluation.reason!,
  };
}

export function promoteCanary(serviceId: string): CanaryConfig {
  const config = getCanaryConfig(serviceId);
  config.status = "PROMOTED";
  config.canaryWeightPercent = 100;
  config.stableDeploymentId = config.canaryDeploymentId;
  canaryConfigsStore.set(serviceId, config);
  return config;
}

export function rollbackCanary(serviceId: string): CanaryConfig {
  const config = getCanaryConfig(serviceId);
  config.status = "ROLLED_BACK";
  config.canaryWeightPercent = 0;
  canaryConfigsStore.set(serviceId, config);
  return config;
}
