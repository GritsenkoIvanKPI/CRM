export const LEAD_STATUSES = [
  "new",
  "contacted",
  "call",
  "proposal",
  "thinking",
  "interested",
  "not_interested",
  "won",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новий",
  contacted: "Написав",
  call: "Колл",
  proposal: "КП",
  thinking: "Думає",
  interested: "Цікаво",
  not_interested: "Не цікаво",
  won: "Продаж",
};

export const STATUS_COLOR_VAR: Record<LeadStatus, string> = {
  new: "--color-stage-new",
  contacted: "--color-stage-contacted",
  call: "--color-stage-call",
  proposal: "--color-stage-proposal",
  thinking: "--color-stage-thinking",
  interested: "--color-stage-interested",
  not_interested: "--color-stage-not-interested",
  won: "--color-stage-won",
};

export const TERMINAL_STATUSES: LeadStatus[] = ["not_interested", "won"];

export function isTerminalStatus(status: LeadStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
