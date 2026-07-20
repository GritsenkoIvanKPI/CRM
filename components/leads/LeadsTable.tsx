import Link from "next/link";
import { Lead } from "@/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUAH, formatDate, formatDateTime } from "@/lib/format";
import { ChevronRightIcon } from "@/components/icons";

type SortKey = "createdAt" | "businessName" | "dealValue" | "nextFollowupAt";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "businessName", label: "Бізнес" },
  { key: "createdAt", label: "Дата" },
  { key: "dealValue", label: "Чек" },
  { key: "nextFollowupAt", label: "Дата пушу" },
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
}: {
  leads: Lead[];
  searchParams: Record<string, string | undefined>;
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
      <div className="shadow-elevated hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-faint">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-5 py-3 font-medium">
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
              <th className="px-5 py-3 font-medium">Ніша / ГЕО</th>
              <th className="px-5 py-3 font-medium">Статус</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="group cursor-pointer transition-colors duration-200 hover:bg-surface-2"
              >
                <td className="px-5 py-3.5">
                  <Link href={`/leads/${lead.id}`} className="block">
                    <p className="font-medium text-text">{lead.businessName}</p>
                    <p className="text-xs text-text-faint">
                      {lead.telegram || lead.phone || "—"}
                    </p>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-text-muted">
                  <Link href={`/leads/${lead.id}`}>{formatDate(lead.createdAt)}</Link>
                </td>
                <td className="px-5 py-3.5 text-text-muted">
                  <Link href={`/leads/${lead.id}`}>{formatUAH(lead.dealValue)}</Link>
                </td>
                <td className="px-5 py-3.5 text-text-muted">
                  <Link href={`/leads/${lead.id}`}>
                    {formatDateTime(lead.nextFollowupAt)}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-text-muted">
                  <Link href={`/leads/${lead.id}`}>
                    {lead.niche ?? "—"} · {lead.geo ?? "—"}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <Link href={`/leads/${lead.id}`}>
                    <StatusBadge status={lead.status} />
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/leads/${lead.id}`}>
                    <ChevronRightIcon className="ml-auto h-4 w-4 text-text-faint transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="shadow-elevated flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{lead.businessName}</p>
                <p className="truncate text-xs text-text-faint">
                  {lead.niche ?? "—"} · {lead.geo ?? "—"}
                </p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{formatDate(lead.createdAt)}</span>
              <span>{formatUAH(lead.dealValue)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
