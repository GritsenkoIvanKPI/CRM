/**
 * One-off importer for "CRM 2026 G.Vision.xlsx" — Ivan's previous
 * spreadsheet-based lead tracker. See CLIENT_BRIEF.md / conversation history
 * for the source structure and the mapping decisions below.
 *
 * ALREADY RUN AGAINST PRODUCTION (2026-08-14) — do not run with --apply
 * again. It deletes every existing lead and status-history row before
 * re-inserting, which would destroy all real edits made since the import.
 * Kept only as a reference for the mapping/cleanup decisions.
 *
 * Usage:
 *   tsx --env-file=.env.local db/import-xlsx.ts            (dry run, no DB writes)
 *   tsx --env-file=.env.local db/import-xlsx.ts --apply     (writes to DB)
 */
import XLSX from "xlsx";
import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import type { LeadStatus } from "@/lib/status";

const FILE_PATH =
  "/Users/ivan/Downloads/Клод сайти/СРМ ЛІДІВ/CRM 2026 G.Vision.xlsx";
const APPLY = process.argv.includes("--apply");

const PLACEHOLDER_CONTACT_PATTERNS =
  /^-$|ватсап|вотсап|whatsapp|viber|вайбер|по\s*номер|по\s*телефон|по\s*тф/i;

function normKey(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
}

// Excludes generic placeholder values ("-", "ватсап", "по номеру тф", ...)
// from being used as cross-sheet match keys — these appear on many unrelated
// rows across sheets and would otherwise collapse them into false matches.
function usableKey(v: unknown): string | null {
  const key = normKey(v);
  if (!key || key === "-") return null;
  if (PLACEHOLDER_CONTACT_PATTERNS.test(key)) return null;
  return key;
}

function cleanPhone(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const cleaned = String(v).replace(/[‎‏‪-‮]/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  return cleaned;
}

function isPlaceholderContact(v: string) {
  return PLACEHOLDER_CONTACT_PATTERNS.test(v);
}

function bool(v: unknown) {
  return v === true || (typeof v === "string" && v.trim().toUpperCase() === "TRUE");
}

type LeadRow = (string | number | boolean | Date | "")[];

type ParsedLead = {
  businessName: string;
  telegram: string | null;
  phone: string | null;
  instagram: string | null;
  niche: string | null;
  geo: string | null;
  leadGenMethod: string | null;
  leadGenSource: string | null;
  dealValue: number | null;
  createdAt: Date;
  notes: string | null;
  status: LeadStatus;
  historyStages: LeadStatus[];
  wonAt: Date | null;
};

async function main() {
  const wb = XLSX.readFile(FILE_PATH, { cellDates: true });

  const leadRows = XLSX.utils
    .sheet_to_json<LeadRow>(wb.Sheets["Ліди"], { header: 1, defval: "" })
    .slice(1, 394);
  const saleRows = XLSX.utils
    .sheet_to_json<LeadRow>(wb.Sheets["Продаж"], { header: 1, defval: "" })
    .slice(1, 22);

  // sale lookup, keyed by normalized telegram / phone / business name
  type SaleInfo = { date: Date | null; dealValue: number | null; source: string | null };
  const saleByKey = new Map<string, SaleInfo>();
  for (const row of saleRows) {
    const [name, tg, phone, saleDate, , , , , check, , source] = row;
    const info: SaleInfo = {
      date: saleDate instanceof Date ? saleDate : null,
      dealValue: typeof check === "number" ? check : null,
      source: typeof source === "string" && source ? source : null,
    };
    for (const key of [usableKey(tg), usableKey(phone), usableKey(name)]) {
      if (key) saleByKey.set(key, info);
    }
  }

  // fallback createdAt for rows missing a date: earliest known date in the sheet
  const knownDates = leadRows
    .map((r) => r[19])
    .filter((d): d is Date => d instanceof Date);
  const earliestDate = new Date(Math.min(...knownDates.map((d) => d.getTime())));

  const parsed: ParsedLead[] = [];
  const skippedRows: { row: number; reason: string }[] = [];

  leadRows.forEach((row) => {
    const [
      rawName,
      rawTelegram,
      rawPhone,
      instagram,
      niche,
      geo,
      ,
      ,
      contactedFlag,
      callFlag,
      proposalFlag,
      interestedFlag,
      notInterestedFlag,
      thinkingFlag,
      wonFlag,
      leadGenMethod,
      leadGenSource,
      ,
      checkValue,
      dateValue,
      ,
      noteA,
      noteB,
    ] = row;

    let telegram = String(rawTelegram ?? "").trim() || null;
    const phone = cleanPhone(rawPhone);
    const extraNotes: string[] = [];

    if (telegram && isPlaceholderContact(telegram)) {
      extraNotes.push(`Контакт (зі старої CRM): ${telegram}`);
      telegram = null;
    }

    let businessName = String(rawName ?? "").trim();
    if (!businessName || businessName === "-") {
      businessName = telegram ? `@${telegram.replace(/^@/, "")}` : phone || "Без назви";
    }

    const tgKey = usableKey(rawTelegram);
    const phoneKey = usableKey(rawPhone);
    const nameKey = usableKey(rawName);
    const saleMatch =
      (tgKey && saleByKey.get(tgKey)) ||
      (phoneKey && saleByKey.get(phoneKey)) ||
      (nameKey && saleByKey.get(nameKey)) ||
      null;

    const won = bool(wonFlag) || Boolean(saleMatch);
    const notInterested = !won && bool(notInterestedFlag);
    const stages: LeadStatus[] = [];
    if (bool(contactedFlag)) stages.push("contacted");
    if (bool(callFlag)) stages.push("call");
    if (bool(proposalFlag)) stages.push("proposal");
    if (bool(thinkingFlag)) stages.push("thinking");
    if (bool(interestedFlag)) stages.push("interested");
    if (stages.length === 0) stages.push("contacted"); // every lead was at least contacted

    let status: LeadStatus = stages[stages.length - 1];
    if (notInterested) status = "not_interested";
    if (won) status = "won";

    const createdAt = dateValue instanceof Date ? dateValue : earliestDate;
    const dealValue =
      saleMatch?.dealValue ??
      (typeof checkValue === "number" ? checkValue : null);

    if (noteA && typeof noteA === "string") extraNotes.push(noteA.trim());
    if (noteB && typeof noteB === "string") extraNotes.push(noteB.trim());

    parsed.push({
      businessName,
      telegram,
      phone,
      instagram: typeof instagram === "string" && instagram ? instagram : null,
      niche: typeof niche === "string" && niche ? niche : null,
      geo: typeof geo === "string" && geo ? geo : null,
      leadGenMethod:
        typeof leadGenMethod === "string" && leadGenMethod ? leadGenMethod : null,
      leadGenSource:
        (typeof leadGenSource === "string" && leadGenSource ? leadGenSource : null) ??
        saleMatch?.source ??
        null,
      dealValue,
      createdAt,
      notes: extraNotes.length > 0 ? extraNotes.join("\n") : null,
      status,
      historyStages: stages,
      wonAt: won ? (saleMatch?.date ?? null) : null,
    });
  });

  // --- summary ---
  console.log(`Parsed ${parsed.length} leads (${skippedRows.length} skipped)`);
  const statusCounts = parsed.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log("Status breakdown:", statusCounts);
  console.log(
    "With deal value:",
    parsed.filter((l) => l.dealValue !== null).length,
  );
  console.log(
    "Cleaned placeholder telegram → notes:",
    parsed.filter((l) => l.notes?.includes("Контакт (зі старої CRM)")).length,
  );
  console.log("\nSample (first 5):");
  console.log(JSON.stringify(parsed.slice(0, 5), null, 2));
  console.log("\nSample won leads (first 5):");
  console.log(
    JSON.stringify(
      parsed.filter((l) => l.status === "won").slice(0, 5),
      null,
      2,
    ),
  );

  if (!APPLY) {
    console.log("\nDry run only — pass --apply to write to the database.");
    process.exit(0);
  }

  console.log("\nClearing existing leads (fake seed data)...");
  await db.delete(leadStatusHistory);
  await db.delete(leads);

  console.log("Inserting", parsed.length, "leads...");
  for (const l of parsed) {
    const [inserted] = await db
      .insert(leads)
      .values({
        businessName: l.businessName,
        telegram: l.telegram,
        phone: l.phone,
        instagram: l.instagram,
        niche: l.niche,
        geo: l.geo,
        leadGenMethod: l.leadGenMethod,
        leadGenSource: l.leadGenSource,
        dealValue: l.dealValue !== null ? String(l.dealValue) : null,
        createdAt: l.createdAt,
        updatedAt: l.createdAt,
        status: l.status,
        notes: l.notes,
      })
      .returning();

    const historyValues = l.historyStages.map((stage, idx) => ({
      leadId: inserted.id,
      status: stage,
      changedAt: new Date(l.createdAt.getTime() + idx * 60_000),
    }));

    if (l.status === "not_interested") {
      historyValues.push({
        leadId: inserted.id,
        status: "not_interested" as LeadStatus,
        changedAt: new Date(l.createdAt.getTime() + historyValues.length * 60_000),
      });
    }
    if (l.status === "won") {
      historyValues.push({
        leadId: inserted.id,
        status: "won" as LeadStatus,
        changedAt: l.wonAt ?? new Date(l.createdAt.getTime() + historyValues.length * 60_000),
      });
    }

    if (historyValues.length > 0) {
      await db.insert(leadStatusHistory).values(historyValues);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
