import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/status";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const leadInputSchema = z.object({
  businessName: z.string().trim().min(1, "Вкажіть назву бізнесу").max(300),
  telegram: optionalText,
  phone: optionalText,
  instagram: optionalText,
  niche: optionalText,
  geo: optionalText,
  website: optionalText,
  account: optionalText,
  leadGenMethod: optionalText,
  leadGenSource: optionalText,
  dealValue: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const num = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(num) ? num : null;
    }),
  nextFollowupAt: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: optionalText,
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const leadUpdateSchema = leadInputSchema.partial().extend({
  businessName: z.string().trim().min(1, "Вкажіть назву бізнесу").max(300).optional(),
});

export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});

export const QUICK_ADD_FIELDS = [
  "businessName",
  "phone",
  "telegram",
  "instagram",
  "niche",
  "leadGenMethod",
] as const;
