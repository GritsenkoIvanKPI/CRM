ALTER TABLE "leads" DROP COLUMN IF EXISTS "snoozed_until";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN IF EXISTS "push_count";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "last_pushed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "leads_last_pushed_idx" ON "leads" USING btree ("last_pushed_at");
