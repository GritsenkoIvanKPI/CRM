"use client";

import { useState } from "react";
import Link from "next/link";
import { Lead } from "@/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBudget, formatDate } from "@/lib/format";
import { PencilIcon } from "@/components/icons";
import { QuickEditModal } from "@/components/leads/QuickEditModal";

function cardStatusTint(status: Lead["status"]) {
  if (status === "won") return "border-success/40 bg-success-soft";
  if (status === "not_interested") return "border-danger/40 bg-danger-soft";
  return "border-border bg-surface";
}

export function LeadCard({
  lead,
  niches,
  geos,
  methods,
  leadGenSources,
}: {
  lead: Lead;
  niches: string[];
  geos: string[];
  methods: string[];
  leadGenSources: string[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={`shadow-elevated relative flex flex-col gap-2 rounded-2xl border p-4 ${cardStatusTint(lead.status)}`}
    >
      <Link
        href={`/leads/${lead.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Відкрити картку ${lead.businessName}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{lead.businessName}</p>
          <p className="truncate text-xs text-text-faint">
            {lead.niche ?? "—"} · {lead.geo ?? "—"}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Швидке редагування"
            className="rounded-lg p-1.5 text-text-faint transition-colors duration-200 hover:bg-surface-2 hover:text-accent-strong"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <StatusBadge status={lead.status} />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{formatDate(lead.createdAt)}</span>
        <span>{formatBudget(lead.budget, lead.budgetCurrency)}</span>
      </div>
      {editing ? (
        <QuickEditModal
          lead={lead}
          niches={niches}
          geos={geos}
          methods={methods}
          leadGenSources={leadGenSources}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}
