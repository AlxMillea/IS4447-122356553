import { sql } from "drizzle-orm";
import { db } from "./client";
import { categories, habitLogs, habits, targets } from "./schema";

const SEED_ANCHOR = {
  day: 12,
  month: 4,
  year: 2026,
};

function formatDayMonthYear(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

async function insertChicagoCountdownData(tx: any) {
  await tx.insert(categories).values([
    { name: "Train", color: "#EF4444", icon: "barbell" },
    { name: "Fuel", color: "#F59E0B", icon: "nutrition" },
    { name: "Recover", color: "#3B82F6", icon: "moon" },
    { name: "Measure", color: "#8B5CF6", icon: "analytics" },
  ]);

  const categoryRows = await tx.select().from(categories);
  const categoryIdByName = Object.fromEntries(
    categoryRows.map((c: { name: string; id: number }) => [c.name, c.id]),
  );

  await tx.insert(habits).values([
    {
      name: "Hit 185g Protein",
      categoryId: categoryIdByName.Fuel,
      metricType: "grams",
    },
    {
      name: "Gym Session",
      categoryId: categoryIdByName.Train,
      metricType: "boolean",
    },
    {
      name: "Log Sleep",
      categoryId: categoryIdByName.Recover,
      metricType: "count",
    },
    {
      name: "Weigh-in",
      categoryId: categoryIdByName.Measure,
      metricType: "count",
    },
  ]);

  const habitRows = await tx.select().from(habits);
  const habitIdByName = Object.fromEntries(
    habitRows.map((h: { name: string; id: number }) => [h.name, h.id]),
  );

  await tx.insert(targets).values([
    {
      habitId: habitIdByName["Hit 185g Protein"],
      period: "daily",
      targetValue: 185,
    },
    {
      habitId: habitIdByName["Gym Session"],
      period: "weekly",
      targetValue: 4,
    },
  ]);

  const logs: {
    habitId: number;
    date: string;
    value: number;
    notes?: string;
  }[] = [];

  // Set to todays date 12th April 2026 and go back 10 days to create logs from the Chicago Countdown period. 
  const anchor = new Date(SEED_ANCHOR.year, SEED_ANCHOR.month - 1, SEED_ANCHOR.day);

  for (let i = 9; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    const formattedDate = formatDayMonthYear(d);

    logs.push({
      habitId: habitIdByName["Hit 185g Protein"],
      date: formattedDate,
      value: [172, 188, 191, 179, 185, 194, 181, 187, 190, 184][9 - i],
      notes: "Chicago Countdown protein target",
    });

    logs.push({
      habitId: habitIdByName["Log Sleep"],
      date: formattedDate,
      value: [7.2, 6.8, 7.5, 8.0, 7.1, 7.6, 6.9, 7.8, 7.4, 7.0][9 - i],
    });

    if (i % 2 === 0) {
      logs.push({
        habitId: habitIdByName["Weigh-in"],
        date: formattedDate,
        value: [188.4, 187.9, 187.2, 186.8, 186.3][Math.floor((9 - i) / 2)],
      });
    }

    if ([9, 7, 5, 2, 0].includes(i)) {
      logs.push({
        habitId: habitIdByName["Gym Session"],
        date: formattedDate,
        value: 1,
        notes: "Lift + incline walk",
      });
    }
  }

  await tx.insert(habitLogs).values(logs);
}

export async function seedIfEmpty() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories);
  const existingCategoryCount = Number(count);

  const latestLog = await db.select({ date: habitLogs.date }).from(habitLogs).limit(1);
  const hasOldIsoDates =
    latestLog.length > 0 &&
    typeof latestLog[0].date === "string" &&
    latestLog[0].date.includes("T");
  const shouldReseedExisting =
    existingCategoryCount > 0 && (latestLog.length === 0 || hasOldIsoDates);

  if (existingCategoryCount > 0 && !shouldReseedExisting) return;

  await db.transaction(async (tx) => {
    if (existingCategoryCount > 0) {
      await tx.delete(habitLogs);
      await tx.delete(targets);
      await tx.delete(habits);
      await tx.delete(categories);
    }

    await insertChicagoCountdownData(tx);
  });
}
