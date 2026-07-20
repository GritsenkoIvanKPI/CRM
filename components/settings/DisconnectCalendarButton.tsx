"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisconnectCalendarButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Відключити Google Calendar? Нагадування перестануть синхронізуватись.")) {
      return;
    }
    setLoading(true);
    await fetch("/api/calendar/disconnect", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDisconnect}
      disabled={loading}
      className="rounded-lg border border-danger-soft px-4 py-2.5 text-sm font-medium text-danger transition-colors duration-200 hover:bg-danger-soft disabled:opacity-50"
    >
      {loading ? "Відключення..." : "Відключити"}
    </button>
  );
}
