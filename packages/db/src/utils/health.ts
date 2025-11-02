import { sql } from "drizzle-orm";
import type { Database } from "../client";

export async function checkHealth(db: Database) {
  await db.run(sql`SELECT 1`);
}
