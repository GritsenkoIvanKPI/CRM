"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/analytics", label: "Огляд" },
  { href: "/analytics/conversion", label: "Конверсія по джерелах" },
  { href: "/analytics/months", label: "По місяцях" },
  { href: "/analytics/sales", label: "Продажі" },
] as const;

export function AnalyticsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border" aria-label="Розділи аналітики">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative -mb-px rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80 ${
              active ? "text-accent-strong" : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
            {active ? (
              <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-accent" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
