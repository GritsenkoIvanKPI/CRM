import { listLeads } from "@/lib/queries/leads";
import { KanbanBoard } from "@/components/leads/KanbanBoard";

// live DB read of every lead — never statically cache this
export const dynamic = "force-dynamic";

export default async function LeadsBoardPage() {
  const leads = await listLeads({ sort: "createdAt", order: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">
          Канбан-дошка
        </h1>
        <p className="text-sm text-text-muted">
          Перетягуйте картки, щоб змінити статус ліда.
        </p>
      </div>

      <KanbanBoard leads={leads} />
    </div>
  );
}
