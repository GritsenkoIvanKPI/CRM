"use client";

import { useState } from "react";
import Link from "next/link";
import { Lead } from "@/db/schema";
import { PencilIcon, ChevronRightIcon } from "@/components/icons";
import { QuickEditModal } from "@/components/leads/QuickEditModal";

export function LeadRowActions({
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
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Швидке редагування"
        className="rounded-lg p-2 text-text-faint transition-colors duration-200 hover:bg-surface-2 hover:text-accent-strong"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <Link
        href={`/leads/${lead.id}`}
        title="Відкрити картку ліда"
        className="rounded-lg p-2 text-text-faint transition-colors duration-200 hover:bg-surface-2 hover:text-text"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
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
