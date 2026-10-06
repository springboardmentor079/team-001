ALTER TABLE "work_items"
  ADD COLUMN "weight" DECIMAL(8,2) NOT NULL DEFAULT 1,
  ADD COLUMN "baselineStartDate" DATE,
  ADD COLUMN "baselinePlannedDate" DATE;

UPDATE "work_items"
SET "baselineStartDate" = "startDate",
    "baselinePlannedDate" = "plannedDate";

ALTER TABLE "work_items"
  ADD CONSTRAINT "work_items_weight_check" CHECK ("weight" > 0 AND "weight" <= 10000);
