import Link from "next/link";
import { Lead } from "@/db/schema";
import { formatUAH, formatDate } from "@/lib/format";
import { ChevronRightIcon } from "@/components/icons";

export function SegmentList({
  title,
  leads,
  emptyLabel,
}: {
  title: string;
  leads: Lead[];
  emptyLabel: string;
}) {
  return (
    <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-tight text-text">{title}</h2>
        <span className="text-xs text-text-faint">{leads.length}</span>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="group flex items-center justify-between gap-3 py-3 transition-colors duration-200 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {lead.businessName}
                </p>
                <p className="truncate text-xs text-text-faint">
                  {lead.niche ?? "—"} · {lead.geo ?? "—"} · {formatDate(lead.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-text-muted">{formatUAH(lead.dealValue)}</span>
                <ChevronRightIcon className="h-4 w-4 text-text-faint transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
