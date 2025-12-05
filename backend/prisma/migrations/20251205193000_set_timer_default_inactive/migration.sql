-- Set default status for countdown timers to INACTIVE
ALTER TABLE "CountdownTimer"
  ALTER COLUMN "status" SET DEFAULT 'INACTIVE';
