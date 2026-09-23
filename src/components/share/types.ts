import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export type StatTone = "primary" | "success" | "warning" | "danger" | "muted"

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
  back?: BackLinkConfig
  title?: string
  description?: string
  hero?: ReactNode
  decorative?: boolean
  className?: string
  children?: ReactNode
}

export type EntityListLayoutProps = EntityListLayoutBaseProps & {
  stats?: StatConfig[] | ReactNode
  toolbar?: ToolbarConfig | ReactNode
}
