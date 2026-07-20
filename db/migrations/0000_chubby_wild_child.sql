CREATE TYPE "public"."lead_status" AS ENUM('contacted', 'call', 'proposal', 'thinking', 'interested', 'not_interested', 'won');--> statement-breakpoint
CREATE TABLE "google_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"status" "lead_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"telegram" text,
	"phone" text,
	"instagram" text,
	"niche" text,
	"geo" text,
	"website" text,
	"account" text,
	"lead_gen_method" text,
	"lead_gen_source" text,
	"deal_value" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_followup_at" timestamp with time zone,
	"status" "lead_status" DEFAULT 'contacted' NOT NULL,
	"notes" text,
	"calendar_event_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_status_history_lead_id_idx" ON "lead_status_history" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_next_followup_idx" ON "leads" USING btree ("next_followup_at");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");