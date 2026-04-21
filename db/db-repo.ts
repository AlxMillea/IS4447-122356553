import { asc, desc, eq } from "drizzle-orm";
import { db } from "./client";
import { categories, habitLogs, habits } from "./schema";

function formatDayMonthYear(date: Date): string {
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
