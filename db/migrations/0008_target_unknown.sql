ALTER TABLE "leads" ALTER COLUMN "is_target" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "is_target" DROP NOT NULL;