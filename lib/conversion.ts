import { CurrencyTotals } from "@/lib/currency";

export const CONVERSION_DIMENSIONS = {
  leadGenSource: "Лідген",
  leadGenMethod: "Метод",
  niche: "Ніша",
  geo: "ГЕО",
} as const;

export type ConversionDimension = keyof typeof CONVERSION_DIMENSIONS;

export function toDimension(value: string | undefined): ConversionDimension {
  return value && value in CONVERSION_DIMENSIONS
    ? (value as ConversionDimension)
    : "leadGenSource";
}

// URL parameter that filters by each dimension (shared by the analytics tabs).
export const FILTER_PARAMS: Record<ConversionDimension, string> = {
  leadGenMethod: "method",
  leadGenSource: "source",
  niche: "niche",
  geo: "geo",
};

export function readFilters(params: Record<string, string | undefined>) {
  const filters: Partial<Record<ConversionDimension, string>> = {};
  for (const [dimension, key] of Object.entries(FILTER_PARAMS) as [ConversionDimension, string][]) {
    if (params[key]) filters[dimension] = params[key];
  }
  return filters;
}

export type ConversionRow = {
  key: string;
  label: string;
  leads: number;
  contacted: number;
  call: number;
  proposal: number;
  won: number;
  // where the leads currently marked «Не цікаво» dropped out
  lostInChat: number;
  lostAfterCall: number;
  lostAfterProposal: number;
  // still open right now
  noReply: number;
  thinking: number;
  interested: number;
  // not won and not lost yet — a cohort with many open leads is still maturing
  open: number;
  target: number;
  targetAssessed: number;
  revenue: CurrencyTotals;
  // month view only: deals closed during this month, whenever the lead came in
  soldInPeriod: number;
  revenueInPeriod: CurrencyTotals;
};

export const NO_GROUP_LABEL = "Не вказано";
