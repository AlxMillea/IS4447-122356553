import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./client";
import { categories, habitLogs, habits, targets } from "./schema";

export function formatDayMonthYear(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export type HabitLogListItem = {
  id: number;
  date: string;
  value: number;
  notes: string | null;
  habitId: number;
  habitName: string;
  metricType: string;
};

export type HabitLogRow = {
  id: number;
  habitId: number;
  date: string;
  value: number;
  notes: string | null;
};

export type CategoryWithHabits = {
  id: number;
  name: string;
  color: string;
  icon: string;
  habits: { id: number; name: string; metricType: string }[];
};

export type TargetWithHabit = {
  targetId: number;
  period: string;
  targetValue: number;
  habitId: number;
  habitName: string;
};

export type RecordHistoryRow = {
  id: number;
  date: string;
  value: number;
  notes: string | null;
  habitId: number;
  habitName: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
};

export function parseDayMonthYear(value: string): Date {
  const [d, m, y] = value.split("/").map(Number);
  return new Date(y, m - 1, d);
}

export async function getRecentHabitLogs(
  limit = 30,
): Promise<HabitLogListItem[]> {
  return db
    .select({
      id: habitLogs.id,
      date: habitLogs.date,
      value: habitLogs.value,
      notes: habitLogs.notes,
      habitId: habits.id,
      habitName: habits.name,
      metricType: habits.metricType,
    })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .orderBy(desc(habitLogs.id))
    .limit(limit);
}

export async function getCategoriesWithHabits(): Promise<CategoryWithHabits[]> {
  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      habitId: habits.id,
      habitName: habits.name,
      habitMetricType: habits.metricType,
    })
    .from(categories)
    .leftJoin(habits, eq(habits.categoryId, categories.id))
    .orderBy(asc(categories.id), asc(habits.id));

  const grouped = new Map<number, CategoryWithHabits>();

  for (const row of rows) {
    if (!grouped.has(row.categoryId)) {
      grouped.set(row.categoryId, {
        id: row.categoryId,
        name: row.categoryName,
        color: row.categoryColor,
        icon: row.categoryIcon,
        habits: [],
      });
    }

    if (row.habitId !== null) {
      grouped.get(row.categoryId)!.habits.push({
        id: row.habitId,
        name: row.habitName!,
        metricType: row.habitMetricType!,
      });
    }
  }

  return Array.from(grouped.values());
}

export async function getLogsForToday(): Promise<HabitLogRow[]> {
  const today = formatDayMonthYear(new Date());

  const rows = await db
    .select({
      id: habitLogs.id,
      habitId: habitLogs.habitId,
      date: habitLogs.date,
      value: habitLogs.value,
      notes: habitLogs.notes,
    })
    .from(habitLogs)
    .where(eq(habitLogs.date, today))
    .orderBy(desc(habitLogs.id));

  return rows;
}

export async function getLogsForDate(date: string): Promise<HabitLogRow[]> {
  return db
    .select({
      id: habitLogs.id,
      habitId: habitLogs.habitId,
      date: habitLogs.date,
      value: habitLogs.value,
      notes: habitLogs.notes,
    })
    .from(habitLogs)
    .where(eq(habitLogs.date, date))
    .orderBy(desc(habitLogs.id));
}

export async function insertLog(
  habitId: number,
  value: number,
  notes?: string,
) {
  const today = formatDayMonthYear(new Date());

  await db.insert(habitLogs).values({
    habitId,
    date: today,
    value,
    notes: notes?.trim() ? notes.trim() : null,
  });
}

export async function insertLogAtDate(
  habitId: number,
  date: string,
  value: number,
  notes?: string,
) {
  await db.insert(habitLogs).values({
    habitId,
    date,
    value,
    notes: notes?.trim() ? notes.trim() : null,
  });
}

export async function updateLog(
  logId: number,
  newValue: number,
  newNotes?: string,
) {
  await db
    .update(habitLogs)
    .set({
      value: newValue,
      notes: newNotes?.trim() ? newNotes.trim() : null,
    })
    .where(eq(habitLogs.id, logId));
}

export async function deleteLog(logId: number) {
  await db.delete(habitLogs).where(eq(habitLogs.id, logId));
}

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.id));
}

export async function insertCategory(
  name: string,
  color: string,
  icon?: string,
) {
  await db.insert(categories).values({
    name: name.trim(),
    color: color.trim(),
    icon: icon?.trim() ?? "",
  });
}

export async function updateCategory(
  id: number,
  name: string,
  color: string,
  icon?: string,
) {
  await db
    .update(categories)
    .set({
      name: name.trim(),
      color: color.trim(),
      icon: icon?.trim() ?? "",
    })
    .where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  await db.transaction(async (tx) => {
    // delete child habits first due RESTRICT on categories -> habits FK
    await tx.delete(habits).where(eq(habits.categoryId, id));
    await tx.delete(categories).where(eq(categories.id, id));
  });
}

export async function getTargetsWithHabits(): Promise<TargetWithHabit[]> {
  return db
    .select({
      targetId: targets.id,
      period: targets.period,
      targetValue: targets.targetValue,
      habitId: habits.id,
      habitName: habits.name,
    })
    .from(targets)
    .innerJoin(habits, eq(targets.habitId, habits.id))
    .orderBy(asc(targets.id));
}

export async function getHabitsByNames(names: string[]) {
  if (!names.length) return [];
  return db
    .select({ id: habits.id, name: habits.name, metricType: habits.metricType })
    .from(habits)
    .where(inArray(habits.name, names))
    .orderBy(asc(habits.id));
}

export async function getHabitLogsByHabitIds(habitIds: number[]) {
  if (!habitIds.length) return [];
  return db
    .select({
      id: habitLogs.id,
      habitId: habitLogs.habitId,
      date: habitLogs.date,
      value: habitLogs.value,
      notes: habitLogs.notes,
    })
    .from(habitLogs)
    .where(inArray(habitLogs.habitId, habitIds))
    .orderBy(desc(habitLogs.id));
}

export async function getRecordHistory(): Promise<RecordHistoryRow[]> {
  return db
    .select({
      id: habitLogs.id,
      date: habitLogs.date,
      value: habitLogs.value,
      notes: habitLogs.notes,
      habitId: habits.id,
      habitName: habits.name,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .innerJoin(categories, eq(habits.categoryId, categories.id))
    .orderBy(desc(habitLogs.id));
}
