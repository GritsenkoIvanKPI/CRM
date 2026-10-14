ALTER TABLE "leads" ADD COLUMN "budget" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "is_target" boolean DEFAULT false NOT NULL;