import { AppShell } from "@/components/app-shell/AppShell";
import { getDistinctFieldValues } from "@/lib/queries/leads";
import { getLeadGenSourceNames } from "@/lib/queries/leadGenSources";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [niches, methods, leadGenSources] = await Promise.all([
    getDistinctFieldValues("niche"),
    getDistinctFieldValues("leadGenMethod"),
    getLeadGenSourceNames(),
  ]);

  return (
    <AppShell niches={niches} methods={methods} leadGenSources={leadGenSources}>
      {children}
    </AppShell>
  );
}
