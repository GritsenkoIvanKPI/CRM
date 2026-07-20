import { listLeads, getDistinctFieldValues } from "@/lib/queries/leads";
import { LeadsFilterBar } from "@/components/leads/LeadsFilterBar";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [leads, niches, geos, methods] = await Promise.all([
    listLeads({
      status: params.status as LeadStatus | undefined,
      niche: params.niche,
      geo: params.geo,
      leadGenMethod: params.leadGenMethod,
      search: params.search,
      sort: params.sort as never,
      order: params.order as never,
    }),
    getDistinctFieldValues("niche"),
    getDistinctFieldValues("geo"),
    getDistinctFieldValues("leadGenMethod"),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Ліди</h1>
        <p className="text-sm text-text-muted">
          Усього: {leads.length}{" "}
          {params.status || params.niche || params.geo || params.leadGenMethod || params.search
            ? "(з урахуванням фільтрів)"
            : ""}
        </p>
      </div>

      <LeadsFilterBar niches={niches} geos={geos} methods={methods} />
      <LeadsTable leads={leads} searchParams={params} />
    </div>
  );
}
