import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { subDays, addDays, subMonths } from "date-fns";
import type { LeadStatus } from "@/lib/status";

const NICHES = ["Меблі", "Стоматологія", "Клінінг", "Автосервіс", "Туризм", "Ремонт"];
const GEOS = ["Київ", "Львів", "Одеса", "Варшава", "Дніпро"];
const METHODS = [
  "Холодна розсилка",
  "Instagram/TikTok",
  "Реферал",
  "Реклама",
  "Вхідний",
];

const NAMES = [
  "Меблі Стиль", "DentalPro", "CleanHouse", "АвтоЛюкс", "TravelGo",
  "РемонтМайстер", "WoodCraft", "SmileClinic", "БлискКлінінг", "МоторСервіс",
  "SunTravel", "БудДім", "InteriorLab", "ZubyPro", "FreshClean",
];

const seedData: { status: LeadStatus; daysAgo: number; followupInDays: number | null; value: number | null }[] = [
  { status: "won", daysAgo: 42, followupInDays: null, value: 48000 },
  { status: "won", daysAgo: 30, followupInDays: null, value: 62000 },
  { status: "won", daysAgo: 12, followupInDays: null, value: 35000 },
  { status: "interested", daysAgo: 6, followupInDays: 0, value: 27000 },
  { status: "interested", daysAgo: 4, followupInDays: 1, value: 41000 },
  { status: "thinking", daysAgo: 9, followupInDays: 2, value: 19000 },
  { status: "proposal", daysAgo: 3, followupInDays: 0, value: 33000 },
  { status: "call", daysAgo: 2, followupInDays: 3, value: 15000 },
  { status: "contacted", daysAgo: 1, followupInDays: 5, value: null },
  { status: "not_interested", daysAgo: 20, followupInDays: null, value: null },
  { status: "contacted", daysAgo: 45, followupInDays: null, value: null },
  { status: "won", daysAgo: 65, followupInDays: null, value: 58000 },
  { status: "thinking", daysAgo: 60, followupInDays: null, value: 22000 },
  { status: "not_interested", daysAgo: 50, followupInDays: null, value: null },
  { status: "interested", daysAgo: 15, followupInDays: -1, value: 30000 },
];

async function main() {
  console.log("Seeding database...");

  for (let i = 0; i < seedData.length; i++) {
    const s = seedData[i];
    const createdAt = subDays(new Date(), s.daysAgo);
    const nextFollowupAt =
      s.followupInDays === null ? null : addDays(new Date(), s.followupInDays);

    const [lead] = await db
      .insert(leads)
      .values({
        businessName: NAMES[i % NAMES.length],
        telegram: `@lead_${i + 1}`,
        phone: `+380${(500000000 + i * 137).toString().slice(0, 9)}`,
        instagram: Math.random() > 0.4 ? `lead_${i + 1}_ig` : null,
        niche: NICHES[i % NICHES.length],
        geo: GEOS[i % GEOS.length],
        website: Math.random() > 0.5 ? `https://example-${i + 1}.com` : null,
        account: `manager_${(i % 3) + 1}`,
        leadGenMethod: METHODS[i % METHODS.length],
        leadGenSource: Math.random() > 0.5 ? "Іван" : "Партнер",
        dealValue: s.value !== null ? String(s.value) : null,
        createdAt,
        nextFollowupAt,
        status: s.status,
        notes: Math.random() > 0.6 ? "Цікавиться довгостроковим контрактом." : null,
        updatedAt: createdAt,
      })
      .returning();

    await db.insert(leadStatusHistory).values({
      leadId: lead.id,
      status: "contacted",
      changedAt: createdAt,
    });

    if (s.status !== "contacted") {
      await db.insert(leadStatusHistory).values({
        leadId: lead.id,
        status: s.status,
        changedAt: addDays(createdAt, 2),
      });
    }
  }

  // a couple of extra won leads from earlier months, for the monthly trend
  for (let m = 1; m <= 3; m++) {
    const createdAt = subMonths(new Date(), m);
    const [lead] = await db
      .insert(leads)
      .values({
        businessName: `MonthlyDeal ${m}`,
        niche: NICHES[m % NICHES.length],
        geo: GEOS[m % GEOS.length],
        leadGenMethod: METHODS[m % METHODS.length],
        dealValue: String(20000 + m * 8000),
        createdAt,
        status: "won",
        updatedAt: createdAt,
      })
      .returning();

    await db.insert(leadStatusHistory).values([
      { leadId: lead.id, status: "contacted", changedAt: createdAt },
      { leadId: lead.id, status: "won", changedAt: addDays(createdAt, 5) },
    ]);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
