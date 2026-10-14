ALTER TABLE "leads" ADD COLUMN "deal_currency" text DEFAULT 'UAH' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "budget_currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
UPDATE "leads" SET "budget_currency" = 'EUR', "budget" = btrim(regexp_replace("budget", '\s*(євро|€)', '', 'gi')) WHERE "budget" ~* '(євро|€)';--> statement-breakpoint
UPDATE "leads" SET "budget" = btrim(replace("budget", '$', '')) WHERE "budget" LIKE '%$%';
