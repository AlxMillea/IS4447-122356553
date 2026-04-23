export type AppTheme = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
};

export const DARK_THEME: AppTheme = {
  background: "#0A0A0A",
  surface: "#111111",
  textPrimary: "#FFFFFF",
  textSecondary: "#D4758A",
  accent: "#CE1141",
  border: "#2C2C2C",
};

export const LIGHT_THEME: AppTheme = {
  background: "#EFEFEF",
  surface: "#FFFFFF",
  textPrimary: "#0A0A0A",
  textSecondary: "#A84060",
  accent: "#CE1141",
  border: "#CCCCCC",
};

export function getThemeByMode(mode: "dark" | "light"): AppTheme {
  return mode === "dark" ? DARK_THEME : LIGHT_THEME;
}

export const theme = { colors: DARK_THEME };
