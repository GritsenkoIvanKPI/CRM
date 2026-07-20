"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SearchIcon } from "@/components/icons";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/status";

type Props = {
  niches: string[];
  geos: string[];
  methods: string[];
};

export function LeadsFilterBar({ niches, geos, methods }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        setParam("search", search);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою, телефоном, TG..."
          className="input w-full pl-9"
        />
      </div>

      <select
        className="input"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">Усі статуси</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={searchParams.get("niche") ?? ""}
        onChange={(e) => setParam("niche", e.target.value)}
      >
        <option value="">Усі ніші</option>
        {niches.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={searchParams.get("geo") ?? ""}
        onChange={(e) => setParam("geo", e.target.value)}
      >
        <option value="">Усі ГЕО</option>
        {geos.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={searchParams.get("leadGenMethod") ?? ""}
        onChange={(e) => setParam("leadGenMethod", e.target.value)}
      >
        <option value="">Усі методи</option>
        {methods.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
