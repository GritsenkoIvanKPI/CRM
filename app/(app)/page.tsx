import Link from "next/link";
import { getDashboardData } from "@/lib/queries/dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUAH, formatDateTime } from "@/lib/format";

// live DB reads (today's follow-ups, KPIs) — never statically cache this
export const dynamic = "force-dynamic";
import {
  TableIcon,
  BoardIcon,
  ChartIcon,
  ChevronRightIcon,
} from "@/components/icons";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброго ранку";
  if (hour < 18) return "Доброго дня";
  return "Доброго вечора";
}

const QUICK_ACTIONS = [
  { href: "/leads", label: "Усі ліди", icon: TableIcon },
  { href: "/leads/board", label: "Канбан-дошка", icon: BoardIcon },
  { href: "/analytics", label: "Аналітика", icon: ChartIcon },
];

export default async function DashboardPage() {
  const { upcomingFollowups, overdueFollowups, kpi } = await getDashboardData();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <section className="animate-rise">
        <h1 className="font-display text-[32px] leading-tight tracking-tight text-text sm:text-[36px]">
          {getGreeting()}, Іване
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-text-muted">
          {overdueFollowups.length > 0
            ? `У вас ${overdueFollowups.length} прострочених пушів — варто перевірити нижче.`
            : "На сьогодні все під контролем. Ось короткий огляд по лідах."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="shadow-elevated group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:border-accent-soft hover:text-accent-strong"
            >
              <action.icon className="h-4 w-4 text-text-faint transition-colors duration-200 group-hover:text-accent" />
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Лідів цього місяця"
          value={kpi.thisMonth}
          hint={`Активних у роботі: ${kpi.active}`}
        />
        <KpiCard
          label="Конверсія в продаж"
          value={`${kpi.closeRate}%`}
          hint={`${kpi.won} продажів із ${kpi.total} лідів`}
          accent
        />
        <KpiCard
          label="Дохід цього місяця"
          value={formatUAH(kpi.revenueThisMonth)}
          hint="Сума угод зі статусом «Продаж»"
        />
        <KpiCard
          label="Загальний дохід"
          value={formatUAH(kpi.totalRevenue)}
          hint="За весь час"
        />
      </section>

      <section className="animate-rise">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-tight text-text">
            Пуші на найближчий тиждень
            {upcomingFollowups.length > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1.5 text-xs font-semibold text-accent-strong">
                {upcomingFollowups.length}
              </span>
            ) : null}
          </h2>
        </div>

        {overdueFollowups.length > 0 ? (
          <div className="shadow-elevated mb-4 rounded-2xl border border-danger-soft bg-danger-soft/40 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-danger">
              Прострочено
            </p>
            <div className="flex flex-col divide-y divide-border">
              {overdueFollowups.map((lead) => (
                <FollowupRow key={lead.id} lead={lead} overdue />
              ))}
            </div>
          </div>
        ) : null}

        <div className="shadow-elevated rounded-2xl border border-border bg-surface">
          {upcomingFollowups.length === 0 ? (
            <p className="p-8 text-center text-sm text-text-muted">
              На цьому тижні немає запланованих пушів.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border px-2">
              {upcomingFollowups.map((lead) => (
                <FollowupRow key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FollowupRow({
  lead,
  overdue,
}: {
  lead: Awaited<ReturnType<typeof getDashboardData>>["upcomingFollowups"][number];
  overdue?: boolean;
}) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors duration-200 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">
          {lead.businessName}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-muted">
          {lead.niche ?? "Без ніші"} · {lead.geo ?? "Без ГЕО"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`text-xs font-medium ${overdue ? "text-danger" : "text-text-muted"}`}
        >
          {formatDateTime(lead.nextFollowupAt)}
        </span>
        <StatusBadge status={lead.status} />
        <ChevronRightIcon className="h-4 w-4 text-text-faint transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
