CREATE TABLE "site_report_attachments" (
  "id" UUID NOT NULL,
  "reportId" UUID NOT NULL,
  "filename" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(120) NOT NULL,
  "size" INTEGER NOT NULL,
  "storagePath" VARCHAR(500) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_report_attachments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "site_report_attachments_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "site_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "site_report_attachments_reportId_createdAt_idx" ON "site_report_attachments"("reportId", "createdAt");
