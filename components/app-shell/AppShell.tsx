"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, SidebarContent } from "./Sidebar";
import { MenuIcon, CloseIcon, LogoutIcon, PlusIcon } from "@/components/icons";
import { QuickAddDrawer } from "@/components/leads/QuickAddDrawer";

type Props = {
  children: ReactNode;
  niches: string[];
  methods: string[];
};

export function AppShell({ children, niches, methods }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen w-full bg-bg">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(50% 40% at 80% 0%, rgba(201,162,76,0.07), transparent 70%), radial-gradient(35% 35% at 0% 100%, rgba(99,161,127,0.05), transparent 70%)",
        }}
      />
      <div className="grain pointer-events-none fixed inset-0 z-0" />

      <Sidebar />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="shadow-floating animate-rise absolute left-0 top-0 h-full w-72 bg-surface">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text"
              aria-label="Закрити меню"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text md:hidden"
            aria-label="Відкрити меню"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="shadow-accent-glow inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.97]"
          >
            <PlusIcon className="h-4 w-4" />
            Новий лід
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-danger"
            aria-label="Вийти"
            title="Вийти"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <QuickAddDrawer
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        niches={niches}
        methods={methods}
      />
    </div>
  );
}
