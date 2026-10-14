import { notFound } from "next/navigation";
import {
  getLeadById,
  getLeadHistory,
  getDistinctFieldValues,
} from "@/lib/queries/leads";
import { getLeadGenSourceNames } from "@/lib/queries/leadGenSources";
import { LeadDetailForm } from "@/components/leads/LeadDetailForm";
import { LeadsBackLink } from "@/components/leads/LeadsBackLink";
import { ChevronRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const [history, niches, geos, methods, leadGenSources] = await Promise.all([
    getLeadHistory(id),
    getDistinctFieldValues("niche"),
    getDistinctFieldValues("geo"),
    getDistinctFieldValues("leadGenMethod"),
    getLeadGenSourceNames(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="animate-rise flex items-center gap-1.5 text-sm text-text-faint">
        <LeadsBackLink />
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="text-text">{lead.businessName}</span>
      </div>

      <h1 className="font-display text-2xl tracking-tight text-text">
        {lead.businessName}
      </h1>

      <LeadDetailForm
        lead={lead}
        history={history}
        niches={niches}
        geos={geos}
        methods={methods}
        leadGenSources={leadGenSources}
      />
    </div>
  );
}
