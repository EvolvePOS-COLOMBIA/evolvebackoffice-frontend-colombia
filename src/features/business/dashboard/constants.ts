/**
 * Brand chart colors — source of truth for dashboard charts.
 * Mirrors --chart-primary / --chart-secondary in index.css.
 * Recharts SVG attributes can't resolve CSS variables,
 * so we reference the same hex values here.
 */

export const CHART_PRIMARY = "#29a1ff"
export const CHART_SECONDARY = "#60c9f0"

/** Derived variants — same hue, different lightness/saturation for multi-series charts */
export const CHART_PRIMARY_LIGHT = "#7ec4ff"
export const CHART_PRIMARY_DARK = "#1a7fd4"
export const CHART_SECONDARY_LIGHT = "#a3e0f7"
export const CHART_SECONDARY_DARK = "#3ea8c9"
