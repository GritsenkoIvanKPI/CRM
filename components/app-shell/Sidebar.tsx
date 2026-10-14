"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { ChevronRightIcon } from "@/components/icons";
import { useLeadsHref } from "@/lib/leads-return";

const COLLAPSED_KEY = "gvision-sidebar-collapsed";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const leadsHref = useLeadsHref();

  // Coming back to the list from elsewhere restores the last filters; clicking
  // "Ліди" while already on the list resets them.
  function resolveHref(href: string) {
    return href === "/leads" && pathname !== "/leads" ? leadsHref : href;
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-3 py-6 ${collapsed ? "justify-center px-0" : "px-6"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-soft bg-accent-soft">
          <span className="font-display text-sm text-accent-strong">G</span>
        </div>
        {!collapsed ? (
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm tracking-tight text-text">
              G.Vision
            </span>
            <span className="text-[11px] uppercase tracking-wider text-text-faint">
              Lead CRM
            </span>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={resolveHref(item.href)}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors duration-200 ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
              ) : null}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed ? <span className="font-medium">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="border-t border-border px-6 py-4">
          <p className="text-xs leading-relaxed text-text-faint">
            Особистий CRM для відстеження лідів G.Vision
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Restore the viewer's last preference after mount only, so the server
  // render and first client paint stay identical — reading localStorage in
  // the initial state would make them diverge and trip a hydration warning.
  // One-time read from localStorage (an external system) on mount, not a
  // cascading re-render off React state.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // localStorage unavailable — stay expanded
    }
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={`relative z-10 hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 ease-out md:block ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        type="button"
        onClick={toggle}
        title={collapsed ? "Розгорнути меню" : "Згорнути меню"}
        aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
        className="shadow-elevated absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-text-faint transition-colors duration-200 hover:bg-surface-2 hover:text-accent-strong"
      >
        <ChevronRightIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
    </aside>
  );
}
