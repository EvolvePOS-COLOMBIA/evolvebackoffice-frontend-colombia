import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export type StatTone = "primary" | "success" | "warning" | "danger" | "muted" | "info"

export type StatConfig = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  tone?: StatTone
}

export type BackLinkConfig = {
  to: string
  label: string
}

export type ToolbarSearchConfig = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export type ToolbarConfig = {
  search?: ToolbarSearchConfig
  actions?: ReactNode
}

export type EntityListLayoutBaseProps = {
  /** Badge/eyebrow content rendered above the title (hero zone). */
  eyebrow?: ReactNode
  back?: BackLinkConfig
  title?: string
  description?: string
  hero?: ReactNode
  /** Tab bar rendered in the hero's right column, stacked above the stats. */
  tabs?: ReactNode
  /** Extra content in the hero's left column, rendered right after the title/description. */
  heroFooter?: ReactNode
  decorative?: boolean
  className?: string
  children?: ReactNode
}

export type EntityListLayoutProps = EntityListLayoutBaseProps & {
  stats?: StatConfig[] | ReactNode
  toolbar?: ToolbarConfig | ReactNode
}
