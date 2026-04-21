export const CATEGORY_COLORS = {
  Train: "#FF3B30", // red
  Fuel: "#34C759", // green
  Recover: "#007AFF", // blue
  Measure: "#A52A2A", // brown
} as const;

export const CATEGORY_COLOR_OPTIONS = [
  CATEGORY_COLORS.Train,
  CATEGORY_COLORS.Fuel,
  CATEGORY_COLORS.Recover,
  CATEGORY_COLORS.Measure,
] as const;

export function normalizeCategoryColor(color: string): string {
  const normalized = color.trim().toLowerCase();
  const match = CATEGORY_COLOR_OPTIONS.find(
    (c) => c.toLowerCase() === normalized,
  );
  return match ?? CATEGORY_COLORS.Train;
}
