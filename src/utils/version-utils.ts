import { ReleaseType, type ChangeType, type VersionChange } from "@/types/domain"
import { Sparkles, Bug, TrendingUp, ShieldAlert, AlertTriangle, Trash2, HelpCircle } from "lucide-react"
const semVerPattern = /^\d+\.\d+\.\d+\.\d+$/
const DEFAULT_VERSION_NUMBER = "1.0.0.0"

export function isValidSemVer(value: string) {
  return semVerPattern.test(value.trim())
}

export function sortVersionsByPublishedAt<T extends { publishedAtUtc: string }>(versions: T[]) {
  return [...versions].sort((left, right) => right.publishedAtUtc.localeCompare(left.publishedAtUtc))
}

export function buildVersionPackageFileName(softwareName: string | null | undefined, versionNumber: string) {
  const sanitizedSoftwareName = (softwareName ?? "software").trim().replaceAll(/\s+/g, "-")
  return `${sanitizedSoftwareName}-${versionNumber}.zip`
}

export function getNextVersionNumber(versionNumbers: Array<string | null | undefined>) {
  const parsedVersions = versionNumbers
    .filter((value): value is string => Boolean(value && isValidSemVer(value)))
    .map((value) => value.split(".").map((segment) => Number(segment)))

  if (parsedVersions.length === 0) {
    return DEFAULT_VERSION_NUMBER
  }

  const highestVersion = parsedVersions.sort((left, right) => {
    for (let index = 0; index < 4; index += 1) {
      const difference = right[index] - left[index]
      if (difference !== 0) {
        return difference
      }
    }

    return 0
  })[0]

  const nextVersion = [...highestVersion]
  nextVersion[3] += 1

  return nextVersion.join(".")
}

export function serializeVersionChanges(changes: VersionChange[]) {
  return JSON.stringify(
    changes.map((change) => ({
      id: change.id,
      type: change.type,
      description: change.description.trim(),
    }))
  )
}

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  [ReleaseType.Development]: "Development",
  [ReleaseType.Testing]: "Testing",
  [ReleaseType.Staging]: "Staging",
  [ReleaseType.Production]: "Production",
  [ReleaseType.Preview]: "Preview",
  [ReleaseType.Beta]: "Beta",
}

export const EMPTY_CHANGES: VersionChange[] = []

export function groupChangesByType(changes: VersionChange[]) {
  const groups = new Map<ChangeType, VersionChange[]>()

  for (const change of changes) {
    const list = groups.get(change.type) ?? []
    if (list.length === 0) {
      groups.set(change.type, list)
    }
    list.push(change)
  }

  const order: ChangeType[] = ["Security", "BugFix", "Feature", "Improvement", "Deprecated", "Removed", "Others"]
  const entries = Array.from(groups.entries()).map(([type, items]) => ({ type, items }))

  return entries.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
}

export function getChangeTypeTone(changeType: ChangeType) {
  switch (changeType) {
    case "Feature":
      return "success"
    case "BugFix":
      return "danger"
    case "Improvement":
      return "primary"
    case "Security":
      return "purple"
    case "Deprecated":
      return "warning"
    case "Removed":
      return "orange"
    case "Others":
    default:
      return "neutral"
  }
}

// Devuelve el icono de Lucide exacto según el tipo de cambio
export function getChangeTypeIcon(changeType: ChangeType) {
  switch (changeType) {
    case "Feature":
      return Sparkles // Chispas para nuevas características
    case "BugFix":
      return Bug // Escarabajo/Bug para corrección de errores
    case "Improvement":
      return TrendingUp // Gráfica hacia arriba para mejoras de rendimiento
    case "Security":
      return ShieldAlert // Escudo con alerta para parches de seguridad
    case "Deprecated":
      return AlertTriangle // Triángulo de advertencia para código obsoleto
    case "Removed":
      return Trash2 // Basurero para funciones eliminadas
    case "Others":
    default:
      return HelpCircle // Signo de interrogación para otros tipos generales
  }
}

// Mapea cada tono visual a una clase de color de texto de Tailwind para el icono
export function getIconColorClass(tone: string, isBackground?: boolean): string {
  // Fondos sutiles con opacidad del 10% para mantener la coherencia con el Badge
  const bgColors: Record<string, string> = {
    neutral: "dark:bg-background/60 dark:border-border/70 bg-background/80 border-border/80",
    primary: "dark:bg-cyan-500/10 dark:border-cyan-400/30 bg-cyan-500/10 border-cyan-400/30",
    success: "dark:bg-emerald-500/10 dark:border-emerald-400/30 bg-emerald-500/10 border-emerald-400/30",
    warning: "dark:bg-amber-500/10 dark:border-amber-400/30 bg-amber-500/10 border-amber-400/30",
    danger: "dark:bg-rose-500/10 dark:border-rose-400/30 bg-rose-500/10 border-rose-400/30",
    info: "dark:bg-sky-500/10 dark:border-sky-400/30 bg-sky-500/10 border-sky-400/30",
    purple: "dark:bg-purple-500/10 dark:border-purple-400/30 bg-purple-500/10 border-purple-400/30",
    orange: "dark:bg-orange-500/10 dark:border-orange-400/30 bg-orange-500/10 border-orange-400/30",
  }

  // Colores de texto/icono brillantes para contrastar sobre el fondo opaco
  const iconColors: Record<string, string> = {
    neutral: "text-muted-foreground",
    primary: "dark:text-cyan-200 text-cyan-500/50",
    success: "dark:text-emerald-200 text-emerald-500/50",
    warning: "dark:text-amber-200 text-amber-500/50",
    danger: "dark:text-rose-200 text-rose-500/50",
    info: "dark:text-sky-200 text-sky-500/50",
    purple: "dark:text-purple-200 text-purple-500/50",
    orange: "dark:text-orange-200 text-orange-500/50",
  }

  if (isBackground) {
    return bgColors[tone] || bgColors.neutral
  }

  return iconColors[tone] || iconColors.neutral
}
