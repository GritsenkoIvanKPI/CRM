ALTER TABLE "leads" ADD COLUMN "snoozed_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "push_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "leads_snoozed_until_idx" ON "leads" USING btree ("snoozed_until");