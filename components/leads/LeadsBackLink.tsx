"use client";

import Link from "next/link";
import { useLeadsHref } from "@/lib/leads-return";

export function LeadsBackLink() {
  const href = useLeadsHref();

  return (
    <Link href={href} className="transition-colors duration-200 hover:text-text">
      Ліди
    </Link>
  );
}
