"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Lead } from "@/db/schema";
import { LEAD_STATUSES, LeadStatus, STATUS_LABELS, STATUS_COLOR_VAR } from "@/lib/status";
import { formatUAH, formatDate } from "@/lib/format";

function noopSubscribe() {
  return () => {};
}

// dnd-kit generates aria ids on mount that won't match SSR output — render a
// static, non-draggable board until the client has hydrated.
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function KanbanBoard({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const interactive = useIsClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const status of LEAD_STATUSES) map.set(status, []);
    for (const lead of leads) map.get(lead.status)?.push(lead);
    return map;
  }, [leads]);

  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  if (!interactive) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => (
          <StaticColumn
            key={status}
            status={status}
            leads={columns.get(status) ?? []}
          />
        ))}
      </div>
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previousStatus = lead.status;
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    );
    setPendingIds((prev) => new Set(prev).add(leadId));

    const res = await fetch(`/api/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });

    if (!res.ok) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l)),
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            leads={columns.get(status) ?? []}
            pendingIds={pendingIds}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function ColumnShell({
  status,
  count,
  total,
  isOver,
  setNodeRef,
  children,
}: {
  status: LeadStatus;
  count: number;
  total: number;
  isOver?: boolean;
  setNodeRef?: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  const colorVar = STATUS_COLOR_VAR[status];
  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border transition-colors duration-200 ${
        isOver ? "border-accent-soft bg-accent-soft/10" : "border-border bg-surface/60"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: `var(${colorVar})` }}
          />
          <span className="text-sm font-semibold text-text">
            {STATUS_LABELS[status]}
          </span>
          <span className="text-xs text-text-faint">{count}</span>
        </div>
      </div>
      {total > 0 ? (
        <div className="border-b border-border px-4 py-2 text-xs text-text-faint">
          Разом: {formatUAH(total)}
        </div>
      ) : null}

      <div className="flex min-h-24 flex-col gap-2 p-3">
        {children}
        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-text-faint">
            Порожньо
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StaticColumn({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const total = leads.reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);
  return (
    <ColumnShell status={status} count={leads.length} total={total}>
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </ColumnShell>
  );
}

function DroppableColumn({
  status,
  leads,
  pendingIds,
}: {
  status: LeadStatus;
  leads: Lead[];
  pendingIds: Set<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = leads.reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);

  return (
    <ColumnShell
      status={status}
      count={leads.length}
      total={total}
      isOver={isOver}
      setNodeRef={setNodeRef}
    >
      {leads.map((lead) => (
        <DraggableCard key={lead.id} lead={lead} pending={pendingIds.has(lead.id)} />
      ))}
    </ColumnShell>
  );
}

function DraggableCard({ lead, pending }: { lead: Lead; pending: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? "opacity-30" : ""} ${pending ? "opacity-70" : ""}`}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      onClick={(e) => dragging && e.preventDefault()}
      className={`shadow-elevated block cursor-grab rounded-xl border border-border bg-surface p-3.5 transition-colors duration-200 hover:border-accent-soft active:cursor-grabbing ${
        dragging ? "rotate-2 cursor-grabbing shadow-floating" : ""
      }`}
    >
      <p className="truncate text-sm font-medium text-text">{lead.businessName}</p>
      <p className="mt-0.5 truncate text-xs text-text-faint">
        {lead.niche ?? "—"} · {lead.geo ?? "—"}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span>{formatUAH(lead.dealValue)}</span>
        <span>{lead.nextFollowupAt ? formatDate(lead.nextFollowupAt) : ""}</span>
      </div>
    </Link>
  );
}
