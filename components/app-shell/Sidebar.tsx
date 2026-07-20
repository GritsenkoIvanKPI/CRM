"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-soft bg-accent-soft">
          <span className="font-display text-sm text-accent-strong">G</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm tracking-tight text-text">
            G.Vision
          </span>
          <span className="text-[11px] uppercase tracking-wider text-text-faint">
            Lead CRM
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
              ) : null}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-6 py-4">
        <p className="text-xs leading-relaxed text-text-faint">
          Особистий CRM для відстеження лідів G.Vision
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="relative z-10 hidden w-64 shrink-0 border-r border-border bg-surface md:block">
      <SidebarContent />
    </aside>
  );
}
