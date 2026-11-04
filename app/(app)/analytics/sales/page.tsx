import { listCustomers } from "@/lib/queries/sales";
import { getDistinctFieldValues } from "@/lib/queries/leads";
import { getLeadGenSourceNames } from "@/lib/queries/leadGenSources";
import { AnalyticsTabs } from "@/components/analytics/AnalyticsTabs";
import { CustomersView } from "@/components/analytics/CustomersView";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [customers, niches, geos, methods, leadGenSources] = await Promise.all([
    listCustomers(),
    getDistinctFieldValues("niche"),
    getDistinctFieldValues("geo"),
    getDistinctFieldValues("leadGenMethod"),
    getLeadGenSourceNames(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Аналітика</h1>
        <p className="text-sm text-text-muted">
          Усі клієнти, яким ми продали, — з контактами, чеком і джерелом.
        </p>
      </div>

      <AnalyticsTabs />

      <CustomersView
        customers={customers}
        niches={niches}
        geos={geos}
        methods={methods}
        leadGenSources={leadGenSources}
      />
    </div>
  );
}
