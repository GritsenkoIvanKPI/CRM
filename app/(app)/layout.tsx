import { AppShell } from "@/components/app-shell/AppShell";
import { getDistinctFieldValues } from "@/lib/queries/leads";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [niches, methods] = await Promise.all([
    getDistinctFieldValues("niche"),
    getDistinctFieldValues("leadGenMethod"),
  ]);

  return (
    <AppShell niches={niches} methods={methods}>
      {children}
    </AppShell>
  );
}
