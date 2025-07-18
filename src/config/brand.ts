/**
 * LinkVault Pro Brand Configuration
 * Comprehensive brand identity and design tokens
 */

export const brandConfig = {
  name: "LinkVault Pro",
  tagline: "Professional Affiliate Marketing Platform",
  description: "Transform your affiliate marketing with intelligent link management, advanced analytics, and beautiful product showcases.",
  
  // Color System - Modern and Professional
  colors: {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe", 
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Main brand blue
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
      950: "#082f49"
    },
    secondary: {
      50: "#fdf4ff",
      100: "#fae8ff",
      200: "#f5d0fe",
      300: "#f0abfc",
      400: "#e879f9",
      500: "#d946ef", // Purple accent
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
      950: "#4a044e"
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d"
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f"
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d"
    },
    neutral: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712"
    }
  },

  // Typography System
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      display: ["Cal Sans", "Inter", "system-ui", "sans-serif"]
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.5rem", { lineHeight: "2rem" }],
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      "5xl": ["3rem", { lineHeight: "1" }],
      "6xl": ["3.75rem", { lineHeight: "1" }],
      "7xl": ["4.5rem", { lineHeight: "1" }],
      "8xl": ["6rem", { lineHeight: "1" }],
      "9xl": ["8rem", { lineHeight: "1" }]
    },
    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900"
    }
  },

  // Spacing System
  spacing: {
    container: {
      sm: "640px",
      md: "768px", 
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    section: {
      xs: "2rem",
      sm: "3rem",
      md: "4rem",
      lg: "5rem",
      xl: "6rem"
    }
  },

  // Border Radius System
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px"
  },

  // Shadow System
  boxShadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
  },

  // Animation System
  animation: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms"
    },
    easing: {
      linear: "linear",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  },

  // Breakpoints
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px"
  }
} as const;

// Theme variants for light and dark modes
export const themeVariants = {
  light: {
    background: brandConfig.colors.neutral[50],
    foreground: brandConfig.colors.neutral[900],
    card: "#ffffff",
    cardForeground: brandConfig.colors.neutral[900],
    popover: "#ffffff",
    popoverForeground: brandConfig.colors.neutral[900],
    primary: brandConfig.colors.primary[500],
    primaryForeground: "#ffffff",
    secondary: brandConfig.colors.neutral[100],
    secondaryForeground: brandConfig.colors.neutral[900],
    muted: brandConfig.colors.neutral[100],
    mutedForeground: brandConfig.colors.neutral[500],
    accent: brandConfig.colors.secondary[100],
    accentForeground: brandConfig.colors.secondary[900],
    destructive: brandConfig.colors.error[500],
    destructiveForeground: "#ffffff",
    border: brandConfig.colors.neutral[200],
    input: brandConfig.colors.neutral[200],
    ring: brandConfig.colors.primary[500]
  },
  dark: {
    background: brandConfig.colors.neutral[950],
    foreground: brandConfig.colors.neutral[50],
    card: brandConfig.colors.neutral[900],
    cardForeground: brandConfig.colors.neutral[50],
    popover: brandConfig.colors.neutral[900],
    popoverForeground: brandConfig.colors.neutral[50],
    primary: brandConfig.colors.primary[400],
    primaryForeground: brandConfig.colors.neutral[900],
    secondary: brandConfig.colors.neutral[800],
    secondaryForeground: brandConfig.colors.neutral[50],
    muted: brandConfig.colors.neutral[800],
    mutedForeground: brandConfig.colors.neutral[400],
    accent: brandConfig.colors.secondary[800],
    accentForeground: brandConfig.colors.secondary[50],
    destructive: brandConfig.colors.error[400],
    destructiveForeground: brandConfig.colors.neutral[50],
    border: brandConfig.colors.neutral[800],
    input: brandConfig.colors.neutral[800],
    ring: brandConfig.colors.primary[400]
  }
} as const;

export type BrandConfig = typeof brandConfig;
export type ThemeVariant = keyof typeof themeVariants;