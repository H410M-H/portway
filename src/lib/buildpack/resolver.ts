/**
 * Portway PaaS — Environment Variable & Reference Resolution Engine (R2 Core)
 * Resolves hierarchical variables and inter-resource references like:
 * - ${{ Postgres.URL }}, ${{ Postgres.HOST }}, ${{ Postgres.PORT }}, ${{ Postgres.PASSWORD }}
 * - ${{ ServiceName.URL }}, ${{ ServiceName.PORT }}
 * - ${{ BucketName.ENDPOINT }}, ${{ BucketName.NAME }}
 * - ${{ SYSTEM_VAR }}
 * With dependency graphing, cycle detection, and secret masking.
 */

export interface EnvVar {
  key: string;
  value: string;
  isSecret?: boolean;
  isReference?: boolean;
}

export interface ResolvedEnvVar {
  key: string;
  value: string;
  originalValue: string;
  isSecret: boolean;
  isReference: boolean;
  resolved: boolean;
  error?: string;
}

export interface ServiceRef {
  id?: string;
  name: string;
  port?: number | null;
  domain?: string;
  internalHost?: string;
}

export interface DatabaseRef {
  id?: string;
  name: string;
  provider?: string;
  connectionUrl: string;
  region?: string;
}

export interface BucketRef {
  id?: string;
  name: string;
  r2BucketRef?: string;
  endpoint?: string;
}

export interface ResolutionContext {
  services?: ServiceRef[];
  databases?: DatabaseRef[];
  buckets?: BucketRef[];
  workspaceVariables?: EnvVar[];
  environmentVariables?: EnvVar[];
  systemVariables?: Record<string, string>;
}

/**
 * Normalizes an identifier for case/separator-insensitive matching
 */
function normalizeIdentifier(str: string): string {
  return str.toLowerCase().replace(/[-_]/g, "");
}

/**
 * Parses connection URL into structural properties
 */
function parseUrlComponents(connUrl: string) {
  try {
    const parsed = new URL(connUrl);
    return {
      host: parsed.hostname,
      port: parsed.port || (parsed.protocol.startsWith("postgres") ? "5432" : parsed.protocol.startsWith("mysql") ? "3306" : "6379"),
      user: parsed.username ? decodeURIComponent(parsed.username) : "",
      password: parsed.password ? decodeURIComponent(parsed.password) : "",
      database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "",
    };
  } catch {
    // Fallback regex if URL parsing fails
    const match = connUrl.match(/^[a-zA-Z0-9+.-]+:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?(?:\/(.*))?$/);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4] || "5432",
        database: match[5] || "",
      };
    }
    return { host: "", port: "", user: "", password: "", database: "" };
  }
}

/**
 * Resolves a single reference expression string (e.g. "Postgres.URL" or "PORT")
 */
function resolveExpression(expr: string, context: ResolutionContext): string | null {
  const trimmed = expr.trim();

  // 1. Two-part expression: Target.Property
  if (trimmed.includes(".")) {
    const parts = trimmed.split(".");
    const targetName = parts[0].trim();
    const property = parts.slice(1).join(".").trim().toUpperCase();
    const normTarget = normalizeIdentifier(targetName);

    // A. Check Database references
    const db = context.databases?.find((d) => normalizeIdentifier(d.name) === normTarget);
    if (db) {
      const components = parseUrlComponents(db.connectionUrl);
      switch (property) {
        case "URL":
        case "CONNECTION_URL":
          return db.connectionUrl;
        case "HOST":
        case "HOSTNAME":
          return components.host;
        case "PORT":
          return components.port;
        case "USER":
        case "USERNAME":
          return components.user;
        case "PASSWORD":
        case "PASS":
          return components.password;
        case "DATABASE":
        case "DB":
        case "NAME":
          return components.database || db.name;
        case "REGION":
          return db.region || "us-east-1";
        case "PROVIDER":
          return db.provider || "POSTGRES";
        default:
          return null;
      }
    }

    // B. Check Service references
    const svc = context.services?.find((s) => normalizeIdentifier(s.name) === normTarget);
    if (svc) {
      const defaultPort = svc.port || 3000;
      const host = svc.domain || svc.internalHost || `${svc.name.toLowerCase()}.internal`;
      switch (property) {
        case "URL":
          return svc.domain ? `https://${svc.domain}` : `http://${host}:${defaultPort}`;
        case "HOST":
        case "HOSTNAME":
          return host;
        case "PORT":
          return String(defaultPort);
        default:
          return null;
      }
    }

    // C. Check Bucket references
    const bkt = context.buckets?.find((b) => normalizeIdentifier(b.name) === normTarget);
    if (bkt) {
      switch (property) {
        case "NAME":
          return bkt.name;
        case "REF":
        case "R2_BUCKET_REF":
          return bkt.r2BucketRef || bkt.name;
        case "ENDPOINT":
          return bkt.endpoint || `https://${bkt.r2BucketRef || bkt.name}.r2.cloudflarestorage.com`;
        default:
          return null;
      }
    }
  }

  // 2. Single-part variable: Key
  const normKey = trimmed.toUpperCase();

  if (context.systemVariables && normKey in context.systemVariables) {
    return context.systemVariables[normKey];
  }

  const envVar = context.environmentVariables?.find((v) => v.key.toUpperCase() === normKey);
  if (envVar) {
    return envVar.value;
  }

  const wsVar = context.workspaceVariables?.find((v) => v.key.toUpperCase() === normKey);
  if (wsVar) {
    return wsVar.value;
  }

  if (process.env[trimmed] !== undefined) {
    return process.env[trimmed]!;
  }

  return null;
}

/**
 * Evaluates template string with ${{ ... }} interpolations recursively up to maxDepth.
 */
export function resolveVariableValue(
  template: string,
  context: ResolutionContext,
  visitedKeys: Set<string> = new Set(),
  depth = 0
): { resolvedValue: string; hadReference: boolean; error?: string } {
  if (depth > 5) {
    return { resolvedValue: template, hadReference: true, error: "Exceeded maximum reference resolution depth (circular reference detected)" };
  }

  const pattern = /\${{\s*([^}]+)\s*}}/g;
  let hadReference = false;
  let error: string | undefined;

  const resolved = template.replace(pattern, (_match, expr: string) => {
    hadReference = true;
    const cleanExpr = expr.trim();
    if (visitedKeys.has(cleanExpr)) {
      error = "Circular dependency detected for reference: ${{ " + cleanExpr + " }}";
      return `[CIRCULAR_REF: ${cleanExpr}]`;
    }

    const nextVisited = new Set(visitedKeys);
    nextVisited.add(cleanExpr);

    const val = resolveExpression(cleanExpr, context);
    if (val === null) {
      error = "Unresolved reference: ${{ " + cleanExpr + " }}";
      return _match; // Keep unreplaced if unresolved
    }

    // Recursively resolve in case value contains references
    if (val.includes("${{")) {
      const nested = resolveVariableValue(val, context, nextVisited, depth + 1);
      if (nested.error) error = nested.error;
      return nested.resolvedValue;
    }

    return val;
  });

  return { resolvedValue: resolved, hadReference, error };
}

/**
 * Masks a sensitive value for safe logging
 */
export function maskSecret(val: string): string {
  if (!val || val.length <= 4) return "••••••••";
  return val.slice(0, 2) + "••••••••" + val.slice(-2);
}

/**
 * Resolves a list of environment variables against context.
 * Satisfies PROJECT.md contract:
 * `resolveEnvironmentVariables(variables: EnvVar[], context: ResolutionContext): ResolvedEnvVar[]`
 */
export function resolveEnvironmentVariables(
  variables: EnvVar[],
  context: ResolutionContext
): ResolvedEnvVar[] {
  return variables.map((v) => {
    const isExplicitRef = v.isReference || v.value.includes("${{");
    const { resolvedValue, hadReference, error } = resolveVariableValue(
      v.value,
      context,
      new Set([v.key])
    );

    return {
      key: v.key,
      value: resolvedValue,
      originalValue: v.value,
      isSecret: v.isSecret ?? true,
      isReference: isExplicitRef || hadReference,
      resolved: !error && (!hadReference || resolvedValue !== v.value),
      error,
    };
  });
}
