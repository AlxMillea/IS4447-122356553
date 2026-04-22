import { sql } from "drizzle-orm";
import { CATEGORY_COLORS } from "../constants/category-colors";
import { db } from "./client";
import { categories, habitLogs, habits, targets } from "./schema";

function formatDayMonthYear(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

async function insertChicagoCountdownData(tx: any) {
  await tx.insert(categories).values([
    { name: "Train", color: CATEGORY_COLORS.Train},
    { name: "Fuel", color: CATEGORY_COLORS.Fuel},
    { name: "Recover", color: CATEGORY_COLORS.Recover},
    { name: "Measure", color: CATEGORY_COLORS.Measure},
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
    {
      name: "Football Session",
      categoryId: categoryIdByName.Train,
      metricType: "boolean",
    },
    {
      name: "Calories (Gym Day)",
      categoryId: categoryIdByName.Fuel,
      metricType: "count",
    },
    {
      name: "Calories (Rest Day)",
      categoryId: categoryIdByName.Fuel,
      metricType: "count",
    },
    {
      name: "Water Intake (ml)",
      categoryId: categoryIdByName.Recover,
      metricType: "count",
    },
    {
      name: "Whoop Recovery %",
      categoryId: categoryIdByName.Recover,
      metricType: "count",
    },
  ]);

  const habitRows = await tx.select().from(habits);
  const habitIdByName = Object.fromEntries(
    habitRows.map((h: { name: string; id: number }) => [h.name, h.id]),
  );

  await tx.insert(targets).values([
    {
      habitId: habitIdByName["Gym Session"],
      period: "global_5w",
      targetValue: 20,
    },
    {
      habitId: habitIdByName["Football Session"],
      period: "global_5w",
      targetValue: 5,
    },
    {
      habitId: habitIdByName["Hit 185g Protein"],
      period: "global_5w",
      targetValue: 35,
    },
    {
      habitId: habitIdByName["Gym Session"],
      period: "weekly",
      targetValue: 4,
    },
    {
      habitId: habitIdByName["Football Session"],
      period: "weekly",
      targetValue: 1,
    },
    {
      habitId: habitIdByName["Hit 185g Protein"],
      period: "weekly",
      targetValue: 7,
    },
    {
      habitId: habitIdByName["Gym Session"],
      period: "monthly",
      targetValue: 16,
    },
    {
      habitId: habitIdByName["Football Session"],
      period: "monthly",
      targetValue: 4,
    },
    {
      habitId: habitIdByName["Hit 185g Protein"],
      period: "monthly",
      targetValue: 30,
    },
    {
      habitId: habitIdByName["Calories (Gym Day)"],
      period: "daily_baseline",
      targetValue: 2800,
    },
    {
      habitId: habitIdByName["Calories (Rest Day)"],
      period: "daily_baseline",
      targetValue: 2100,
    },
    {
      habitId: habitIdByName["Hit 185g Protein"],
      period: "daily_baseline",
      targetValue: 185,
    },
    {
      habitId: habitIdByName["Water Intake (ml)"],
      period: "daily_baseline",
      targetValue: 3500,
    },
  ]);

  const logs: {
    habitId: number;
    date: string;
    value: number;
    notes?: string;
  }[] = [];

  // Seed a rolling 7-day dummy history ending on today's date.
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);
  const proteinWeek = [192, 181, 189, 176, 185, 193, 188];
  const sleepWeek = [7.4, 6.8, 7.2, 7.0, 7.8, 7.6, 7.1];
  const gymCalsWeek = [2820, 2760, 2875, 2790]; // 4 gym days
  const restCalsWeek = [2050, 2140, 2080]; // 3 rest days
  const waterWeek = [3600, 3300, 3700, 3450, 3550, 3800, 3400];
  const weightWeek = [90.0, 89.8, 89.4, 89.1, 88.8, 88.4, 88.0];
  const gymDays = [0, 2, 4, 6]; // indexes inside 7-day window
  const footballDay = 5;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    const date = formatDayMonthYear(d);
    const idx = 6 - i;

    logs.push({
      habitId: habitIdByName["Hit 185g Protein"],
      date,
      value: proteinWeek[idx],
      notes: "Chicago Countdown protein",
    });

    logs.push({
      habitId: habitIdByName["Log Sleep"],
      date,
      value: sleepWeek[idx],
    });

    logs.push({
      habitId: habitIdByName["Water Intake (ml)"],
      date,
      value: waterWeek[idx],
    });

    logs.push({
      habitId: habitIdByName["Weigh-in"],
      date,
      value: weightWeek[idx],
    });

    if (gymDays.includes(idx)) {
      const gymIdx = gymDays.indexOf(idx);
      logs.push({
        habitId: habitIdByName["Gym Session"],
        date,
        value: 1,
      });
      logs.push({
        habitId: habitIdByName["Calories (Gym Day)"],
        date,
        value: gymCalsWeek[gymIdx],
      });
    } else {
      const restIdx = [1, 3, 5].indexOf(idx);
      logs.push({
        habitId: habitIdByName["Calories (Rest Day)"],
        date,
        value: restCalsWeek[restIdx],
      });
    }

    if (idx === footballDay) {
      logs.push({
        habitId: habitIdByName["Football Session"],
        date,
        value: 1,
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

  const latestLog = await db
    .select({ date: habitLogs.date })
    .from(habitLogs)
    .limit(1);
  const targetRows = await db
    .select({ targetValue: targets.targetValue })
    .from(targets);
  const habitRows = await db.select({ name: habits.name }).from(habits);
  const categoryRows = await db
    .select({ name: categories.name, color: categories.color, icon: categories.icon })
    .from(categories);

  const hasOldIsoDates =
    latestLog.length > 0 &&
    typeof latestLog[0].date === "string" &&
    latestLog[0].date.includes("T");
  const expectedTargetValues = [
    20, 5, 35, 4, 1, 7, 16, 30, 2800, 2100, 185, 3500,
  ];
  const hasChicagoTargets = expectedTargetValues.every((v) =>
    targetRows.some((t) => Number(t.targetValue) === v),
  );
  const requiredHabitNames = [
    "Gym Session",
    "Football Session",
    "Hit 185g Protein",
    "Calories (Gym Day)",
    "Calories (Rest Day)",
    "Water Intake (ml)",
    "Weigh-in",
    "Log Sleep",
    "Whoop Recovery %",
  ];
  const hasRequiredHabits = requiredHabitNames.every((name) =>
    habitRows.some((h) => h.name === name),
  );
  const requiredCategoryNames = ["Train", "Fuel", "Recover", "Measure"];
  const hasRequiredCategories = requiredCategoryNames.every((name) =>
    categoryRows.some((c) => c.name === name),
  );
  const expectedCategoryColors: Record<string, string> = {
    Train: CATEGORY_COLORS.Train,
    Fuel: CATEGORY_COLORS.Fuel,
    Recover: CATEGORY_COLORS.Recover,
    Measure: CATEGORY_COLORS.Measure,
  };
  const hasExpectedCategoryColors = Object.entries(
    expectedCategoryColors,
  ).every(([name, color]) =>
    categoryRows.some(
      (c) =>
        c.name === name &&
        String(c.color).trim().toLowerCase() === color.toLowerCase(),
    ),
  );
  const hasCategoryIcons = categoryRows.every(
    (category) => category.icon && String(category.icon).trim().length > 0,
  );

  const shouldReseedExisting =
    existingCategoryCount > 0 &&
    (latestLog.length === 0 ||
      hasOldIsoDates ||
      !hasChicagoTargets ||
      !hasRequiredHabits ||
      !hasRequiredCategories ||
      !hasExpectedCategoryColors ||
      !hasCategoryIcons);

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
