import { sql } from "drizzle-orm";
import { db } from "./client";
import { habitLogs } from "./schema";

export async function runDbHealthcheck() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(habitLogs);
  const latest = await db
    .select()
    .from(habitLogs)
    .orderBy(sql`date desc`)
    .limit(1);

  return {
    ok: true,
    count: Number(count),
    latestLogDate: latest[0]?.date ?? null,
  };
}

export const healthcheck = runDbHealthcheck;
