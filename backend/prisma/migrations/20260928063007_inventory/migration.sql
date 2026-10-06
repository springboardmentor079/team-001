-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ALLOCATED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'ADJUSTMENT', 'ALLOCATION', 'RELEASE', 'ISSUE');

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "currentStock" DECIMAL(16,3) NOT NULL DEFAULT 0,
    "allocatedStock" DECIMAL(16,3) NOT NULL DEFAULT 0,
    "minimumLevel" DECIMAL(16,3) NOT NULL DEFAULT 0,
    "criticalLevel" DECIMAL(16,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "supplier" VARCHAR(160) NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requests" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "requesterId" UUID,
    "approvedById" UUID,
    "quantity" DECIMAL(16,3) NOT NULL,
    "requiredDate" DATE NOT NULL,
    "purpose" VARCHAR(1000) NOT NULL,
    "decisionNote" VARCHAR(1000) NOT NULL DEFAULT '',
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "requestId" UUID,
    "type" "StockMovementType" NOT NULL,
    "stockDelta" DECIMAL(16,3) NOT NULL,
    "allocatedDelta" DECIMAL(16,3) NOT NULL,
    "balanceAfter" DECIMAL(16,3) NOT NULL,
    "allocatedAfter" DECIMAL(16,3) NOT NULL,
    "note" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "materials_organizationId_category_idx" ON "materials"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "materials_organizationId_sku_key" ON "materials"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "material_requests_projectId_status_idx" ON "material_requests"("projectId", "status");

-- CreateIndex
CREATE INDEX "material_requests_materialId_status_idx" ON "material_requests"("materialId", "status");

-- CreateIndex
CREATE INDEX "stock_movements_materialId_createdAt_idx" ON "stock_movements"("materialId", "createdAt");

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "material_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
