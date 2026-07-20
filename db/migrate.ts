import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/lib/db";

async function main() {
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
