-- CreateEnum
CREATE TYPE "WorkKind" AS ENUM ('MILESTONE', 'TASK');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED');

-- CreateEnum
CREATE TYPE "DelayStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASSED', 'CONDITIONAL', 'FAILED');

-- CreateTable
CREATE TABLE "work_items" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "kind" "WorkKind" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(5000) NOT NULL DEFAULT '',
    "startDate" DATE NOT NULL,
    "plannedDate" DATE NOT NULL,
    "actualDate" DATE,
    "status" "WorkStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "responsibleId" UUID,
    "dependencyId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_reports" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "authorId" UUID,
    "reportDate" DATE NOT NULL,
    "weather" VARCHAR(150) NOT NULL,
    "workersPresent" INTEGER NOT NULL,
    "workCompleted" VARCHAR(5000) NOT NULL,
    "reportedProgress" INTEGER NOT NULL,
    "materialsUsed" VARCHAR(5000) NOT NULL DEFAULT '',
    "equipmentUsed" VARCHAR(5000) NOT NULL DEFAULT '',
    "safetyObservations" VARCHAR(5000) NOT NULL DEFAULT '',
    "issues" VARCHAR(5000) NOT NULL DEFAULT '',
    "notes" VARCHAR(5000) NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "site_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_delays" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "reporterId" UUID,
    "workItemId" UUID,
    "date" DATE NOT NULL,
    "cause" VARCHAR(500) NOT NULL,
    "daysDelayed" INTEGER NOT NULL,
    "impact" VARCHAR(3000) NOT NULL,
    "correctiveAction" VARCHAR(3000) NOT NULL DEFAULT '',
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "status" "DelayStatus" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_delays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "inspectorId" UUID,
    "date" DATE NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "result" "InspectionResult" NOT NULL,
    "findings" VARCHAR(5000) NOT NULL,
    "correctiveAction" VARCHAR(3000) NOT NULL DEFAULT '',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_items_projectId_plannedDate_idx" ON "work_items"("projectId", "plannedDate");

-- CreateIndex
CREATE INDEX "site_reports_projectId_reportDate_idx" ON "site_reports"("projectId", "reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "site_reports_projectId_authorId_reportDate_key" ON "site_reports"("projectId", "authorId", "reportDate");

-- CreateIndex
CREATE INDEX "site_delays_projectId_status_idx" ON "site_delays"("projectId", "status");

-- CreateIndex
CREATE INDEX "inspections_projectId_resolved_idx" ON "inspections"("projectId", "resolved");

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "work_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_delays" ADD CONSTRAINT "site_delays_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_delays" ADD CONSTRAINT "site_delays_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_delays" ADD CONSTRAINT "site_delays_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
