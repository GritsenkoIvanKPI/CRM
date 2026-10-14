import Link from "next/link";
import { Lead } from "@/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { TargetBadge } from "@/components/TargetBadge";
import { formatBudget, formatDate } from "@/lib/format";
import { InlineDateCell } from "@/components/leads/InlineDateCell";
import { LeadRowActions } from "@/components/leads/LeadRowActions";
import { LeadCard } from "@/components/leads/LeadCard";

// Row-level color cue so won/lost leads read at a glance across the whole
// table, without opening each card — green for started cooperation, red for
// a full pass, matching the highlighting from Ivan's previous spreadsheet.
function rowStatusTint(status: Lead["status"]) {
  if (status === "won") {
    return "border-l-2 border-l-success bg-success-soft hover:bg-success-soft";
  }
  if (status === "not_interested") {
    return "border-l-2 border-l-danger bg-danger-soft hover:bg-danger-soft";
  }
  return "border-l-2 border-l-transparent hover:bg-surface-2";
}

type SortKey = "createdAt" | "businessName" | "budget" | "nextFollowupAt";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "businessName", label: "Бізнес" },
  { key: "createdAt", label: "Дата" },
  { key: "budget", label: "Бюджет" },
  { key: "nextFollowupAt", label: "Наступний пуш" },
];

function buildSortHref(
  params: URLSearchParams,
  key: SortKey,
  currentSort: string,
  currentOrder: string,
) {
  const next = new URLSearchParams(params.toString());
  next.set("sort", key);
  next.set(
    "order",
    currentSort === key && currentOrder === "asc" ? "desc" : "asc",
  );
  return `?${next.toString()}`;
}

export function LeadsTable({
  leads,
  searchParams,
  niches,
  geos,
  methods,
  leadGenSources,
}: {
  leads: Lead[];
  searchParams: Record<string, string | undefined>;
  niches: string[];
  geos: string[];
  methods: string[];
  leadGenSources: string[];
}) {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v) as [string, string][],
  );
  const currentSort = searchParams.sort ?? "createdAt";
  const currentOrder = searchParams.order ?? "desc";

  if (leads.length === 0) {
    return (
      <div className="shadow-elevated rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-muted">
          Лідів за цими фільтрами не знайдено.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="shadow-elevated hidden overflow-x-auto rounded-2xl border border-border bg-surface md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[6%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-faint">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  <Link
                    href={buildSortHref(params, col.key, currentSort, currentOrder)}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-text"
                  >
                    {col.label}
                    {currentSort === col.key ? (
                      <span className="text-accent">
                        {currentOrder === "asc" ? "↑" : "↓"}
                      </span>
                    ) : null}
                  </Link>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Останній пуш</th>
              <th className="px-4 py-3 font-medium">Лідген</th>
              <th className="px-4 py-3 font-medium">Telegram</th>
              <th className="px-4 py-3 font-medium">Цільовий</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`transition-colors duration-200 ${rowStatusTint(lead.status)}`}
              >
                <td className="px-4 py-3.5">
                  <p className="truncate font-medium text-text" title={lead.businessName}>
                    {lead.businessName}
                  </p>
                  <p className="truncate text-xs text-text-faint">
                    {lead.phone || "—"}
                  </p>
                </td>
                <td className="truncate px-4 py-3.5 text-text-muted">
                  {formatDate(lead.createdAt)}
                </td>
                <td
                  className="truncate px-4 py-3.5 text-text-muted"
                  title={formatBudget(lead.budget, lead.budgetCurrency)}
                >
                  {formatBudget(lead.budget, lead.budgetCurrency)}
                </td>
                <td className="p-0 text-text-muted">
                  <InlineDateCell
                    leadId={lead.id}
                    field="nextFollowupAt"
                    value={lead.nextFollowupAt}
                    title="Коли наступний раз написати клієнту"
                  />
                </td>
                <td className="p-0 text-text-muted">
                  <InlineDateCell
                    leadId={lead.id}
                    field="lastPushedAt"
                    value={lead.lastPushedAt}
                    title="Коли востаннє писали клієнту"
                  />
                </td>
                <td className="truncate px-4 py-3.5 text-text-muted" title={lead.leadGenSource ?? "—"}>
                  {lead.leadGenSource ?? "—"}
                </td>
                <td className="truncate px-4 py-3.5 text-text-muted" title={lead.telegram ?? "—"}>
                  {lead.telegram ?? "—"}
                </td>
                <td className="px-4 py-3.5">
                  <TargetBadge isTarget={lead.isTarget} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3.5">
                  <LeadRowActions
                    lead={lead}
                    niches={niches}
                    geos={geos}
                    methods={methods}
                    leadGenSources={leadGenSources}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            niches={niches}
            geos={geos}
            methods={methods}
            leadGenSources={leadGenSources}
          />
        ))}
      </div>
    </>
  );
}
