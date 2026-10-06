ALTER TABLE "equipment"
ADD COLUMN "commissionedAt" DATE,
ADD COLUMN "serviceIntervalDays" INTEGER NOT NULL DEFAULT 90;

ALTER TABLE "maintenance_records"
ADD COLUMN "failureRelated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "downtimeHours" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "equipment"
ADD CONSTRAINT "equipment_service_interval_positive" CHECK ("serviceIntervalDays" BETWEEN 1 AND 3650);

ALTER TABLE "maintenance_records"
ADD CONSTRAINT "maintenance_downtime_nonnegative" CHECK ("downtimeHours" >= 0);
