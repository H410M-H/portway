-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'DEPLOYING', 'ACTIVE', 'CRASHED', 'SLEEPING', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFYING', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "DatabaseProvider" AS ENUM ('POSTGRES', 'REDIS', 'MYSQL');

-- CreateEnum
CREATE TYPE "ApiTokenScope" AS ENUM ('READ_ONLY', 'DEPLOY_ONLY', 'FULL_ACCESS');

-- CreateEnum
CREATE TYPE "UsageResourceType" AS ENUM ('CPU_ACTIVE_SECONDS', 'MEMORY_GIB_HOURS', 'DISK_GB_HOURS', 'EGRESS_GB', 'DB_STORAGE_GB', 'BUCKET_STORAGE_GB');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'PAST_DUE', 'VOID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "githubId" TEXT,
    "passwordHash" TEXT,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "refresh_token_expires_in" INTEGER,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "spendingCapCents" INTEGER,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invites" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPrEnv" BOOLEAN NOT NULL DEFAULT false,
    "prNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "repoUrl" TEXT,
    "branch" TEXT,
    "rootDir" TEXT,
    "dockerImage" TEXT,
    "buildCommand" TEXT,
    "startCommand" TEXT,
    "port" INTEGER,
    "instanceType" TEXT NOT NULL DEFAULT 'lite',
    "scaleToZero" BOOLEAN NOT NULL DEFAULT true,
    "idleTimeoutSecs" INTEGER NOT NULL DEFAULT 300,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "commitSha" TEXT,
    "commitMessage" TEXT,
    "triggeredBy" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "imageRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED',
    "cfContainerId" TEXT,
    "healthCheckUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "buildDurationMs" INTEGER,
    "deployDurationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isWildcard" BOOLEAN NOT NULL DEFAULT false,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "verificationTxt" TEXT,
    "cfZoneId" TEXT,
    "cfRecordId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_variables" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "workspaceId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "isReference" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_instances" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "provider" "DatabaseProvider" NOT NULL DEFAULT 'POSTGRES',
    "name" TEXT NOT NULL,
    "partnerDbId" TEXT,
    "connectionUrl" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "storageGb" INTEGER NOT NULL DEFAULT 1,
    "backupRetainDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volumes" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mountPath" TEXT NOT NULL,
    "sizeGb" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buckets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "r2BucketRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scope" "ApiTokenScope" NOT NULL DEFAULT 'READ_ONLY',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "resourceType" "UsageResourceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "infraCostCents" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invites_token_key" ON "workspace_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "environments_projectId_name_key" ON "environments"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "domains_hostname_key" ON "domains"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_projectId_key_key" ON "feature_flags"("projectId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_tokenHash_key" ON "api_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "usage_records_serviceId_periodStart_idx" ON "usage_records"("serviceId", "periodStart");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_variables" ADD CONSTRAINT "environment_variables_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_instances" ADD CONSTRAINT "database_instances_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
