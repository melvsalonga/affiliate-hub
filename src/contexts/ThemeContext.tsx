// ThemeContext is currently disabled for optional implementation later

export function useTheme() {
  return { theme: 'light', toggleTheme: () => {} };
}

export function ThemeProvider({ children }) {
  return children;
}
