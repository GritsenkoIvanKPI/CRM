import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const leadStatusEnum = pgEnum("lead_status", [
  "contacted",
  "call",
  "proposal",
  "thinking",
  "interested",
  "not_interested",
  "won",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: text("business_name").notNull(),
    telegram: text("telegram"),
    phone: text("phone"),
    instagram: text("instagram"),
    niche: text("niche"),
    geo: text("geo"),
    website: text("website"),
    account: text("account"),
    leadGenMethod: text("lead_gen_method"),
    leadGenSource: text("lead_gen_source"),
    dealValue: numeric("deal_value", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    nextFollowupAt: timestamp("next_followup_at", { withTimezone: true }),
    status: leadStatusEnum("status").notNull().default("contacted"),
    notes: text("notes"),
    calendarEventId: text("calendar_event_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("leads_status_idx").on(table.status),
    index("leads_next_followup_idx").on(table.nextFollowupAt),
    index("leads_created_at_idx").on(table.createdAt),
  ],
);

export const leadStatusHistory = pgTable(
  "lead_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    status: leadStatusEnum("status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("lead_status_history_lead_id_idx").on(table.leadId)],
);

export const googleTokens = pgTable("google_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadStatusHistoryEntry = typeof leadStatusHistory.$inferSelect;
