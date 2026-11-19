/** Time zones offered for a branch: Colombia first, then the usual neighbours. */
export const BRANCH_TIME_ZONES = [
  "America/Bogota",
  "America/Lima",
  "America/Guayaquil",
  "America/Panama",
  "America/Caracas",
  "America/Mexico_City",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/Madrid",
]

/** The list with the branch's current zone included, even when it is not one of the usual ones. */
export function timeZoneOptions(current?: string): string[] {
  return current && !BRANCH_TIME_ZONES.includes(current) ? [current, ...BRANCH_TIME_ZONES] : BRANCH_TIME_ZONES
}
