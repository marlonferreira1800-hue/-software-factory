-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BUILDER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AiProviderType" AS ENUM ('BUILTIN_OFFLINE', 'SUBSCRIPTION_BRIDGE', 'ANTIGRAVITY_AGENT', 'CLAUDE_CLI', 'GEMINI_CLI', 'CODEX_CLI', 'OPENAI_API', 'ANTHROPIC_API', 'GEMINI_API', 'OLLAMA_LOCAL', 'OPENAI_COMPATIBLE');

-- CreateEnum
CREATE TYPE "AiProviderAuthMode" AS ENUM ('NONE', 'BROWSER_HANDOFF', 'LOCAL_CLI', 'API_KEY', 'LOCAL_SERVER');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('SERVICOS', 'COMERCIO', 'SAUDE', 'FINANCAS', 'EDUCACAO', 'OPERACOES', 'OUTROS');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'DESIGNED', 'GENERATED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "GenerationMode" AS ENUM ('AUTOMATIC_ENGINE', 'SUBSCRIPTION_HANDOFF', 'LOCAL_CLI', 'API_DIRECT', 'TEMPLATE_CLONE');

-- CreateEnum
CREATE TYPE "GenerationJobStatus" AS ENUM ('PENDING', 'AWAITING_HANDOFF', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ArtifactLayer" AS ENUM ('DATABASE', 'BACKEND', 'FRONTEND', 'INFRA', 'AI_PACK', 'DOCS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BUILDER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_connections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "providerType" "AiProviderType" NOT NULL,
    "authMode" "AiProviderAuthMode" NOT NULL,
    "subscriptionBrand" TEXT NOT NULL,
    "description" TEXT,
    "modelName" TEXT,
    "baseUrl" TEXT,
    "cliCommand" TEXT,
    "encryptedApiKey" TEXT,
    "maskedApiKey" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ai_provider_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'LayoutGrid',
    "shortDescription" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "plainPromptExample" TEXT NOT NULL,
    "blueprintJson" JSONB NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "app_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plainIdea" TEXT NOT NULL,
    "targetAudience" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "blueprintJson" JSONB,
    "generatedFilesCount" INTEGER NOT NULL DEFAULT 0,
    "lastGeneratedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "templateId" TEXT,
    "aiProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "software_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "providerId" TEXT,
    "triggeredById" TEXT NOT NULL,
    "mode" "GenerationMode" NOT NULL,
    "status" "GenerationJobStatus" NOT NULL DEFAULT 'PENDING',
    "promptUsed" TEXT NOT NULL,
    "handoffInstructions" TEXT,
    "rawResponse" TEXT,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "filesGeneratedJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_artifacts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "layer" "ArtifactLayer" NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_deletedAt_idx" ON "users"("role", "deletedAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "ai_provider_connections_ownerId_deletedAt_idx" ON "ai_provider_connections"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "ai_provider_connections_providerType_isActive_idx" ON "ai_provider_connections"("providerType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_connections_ownerId_slug_key" ON "ai_provider_connections"("ownerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "app_templates_slug_key" ON "app_templates"("slug");

-- CreateIndex
CREATE INDEX "app_templates_category_deletedAt_idx" ON "app_templates"("category", "deletedAt");

-- CreateIndex
CREATE INDEX "app_templates_isOfficial_deletedAt_idx" ON "app_templates"("isOfficial", "deletedAt");

-- CreateIndex
CREATE INDEX "software_projects_ownerId_status_deletedAt_idx" ON "software_projects"("ownerId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "software_projects_deletedAt_idx" ON "software_projects"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "software_projects_ownerId_slug_key" ON "software_projects"("ownerId", "slug");

-- CreateIndex
CREATE INDEX "generation_jobs_projectId_createdAt_idx" ON "generation_jobs"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "generation_jobs_triggeredById_idx" ON "generation_jobs"("triggeredById");

-- CreateIndex
CREATE INDEX "generated_artifacts_projectId_layer_idx" ON "generated_artifacts"("projectId", "layer");

-- CreateIndex
CREATE UNIQUE INDEX "generated_artifacts_projectId_filePath_key" ON "generated_artifacts"("projectId", "filePath");

-- AddForeignKey
ALTER TABLE "ai_provider_connections" ADD CONSTRAINT "ai_provider_connections_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_templates" ADD CONSTRAINT "app_templates_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_projects" ADD CONSTRAINT "software_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_projects" ADD CONSTRAINT "software_projects_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "app_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_projects" ADD CONSTRAINT "software_projects_aiProviderId_fkey" FOREIGN KEY ("aiProviderId") REFERENCES "ai_provider_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "software_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_provider_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_artifacts" ADD CONSTRAINT "generated_artifacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "software_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_artifacts" ADD CONSTRAINT "generated_artifacts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
