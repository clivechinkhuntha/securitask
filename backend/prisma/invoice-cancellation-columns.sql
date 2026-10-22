ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "cancelledFromStatus" "InvoiceStatus",
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledById" TEXT;
