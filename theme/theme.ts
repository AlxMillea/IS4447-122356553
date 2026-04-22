export type AppTheme = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
};

export const DARK_THEME: AppTheme = {
  background: "#121212",
  surface: "#1E1E1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  accent: "#F59E0B",
  border: "#333333",
};

export const LIGHT_THEME: AppTheme = {
  background: "#F5F5F5",
  surface: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#52525B",
  accent: "#D97706",
  border: "#D4D4D8",
};

export function getThemeByMode(mode: "dark" | "light"): AppTheme {
  return mode === "dark" ? DARK_THEME : LIGHT_THEME;
}

// compatibility fallback for any unchanged screens still importing `theme`
export const theme = { colors: DARK_THEME };
