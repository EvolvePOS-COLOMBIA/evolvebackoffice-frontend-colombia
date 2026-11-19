import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"

interface SettingsGroupProps {
  icon: LucideIcon
  title: string
  /** Right side of the heading: a counter, a badge or an action. */
  aside?: ReactNode
  className?: string
  children: ReactNode
}

/** Titled block of related settings. Rows go inside as `SettingRow`s or any custom content. */
export function SettingsGroup({ icon: Icon, title, aside, className, children }: SettingsGroupProps) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-border/70 bg-card/60", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  )
}

interface SettingRowProps {
  title: string
  description?: string
  children: ReactNode
}

/** One setting: its name and hint on the left, the control on the right (below it when the pane is narrow). */
export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="grid gap-2.5 border-b border-border/70 px-4 py-3.5 last:border-b-0 @lg:grid-cols-[minmax(0,1fr)_auto] @lg:items-center @lg:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 @lg:justify-end">{children}</div>
    </div>
  )
}

interface SaveBarProps {
  visible: boolean
  isPending?: boolean
  onSave: () => void
  onDiscard: () => void
}

/** Appears at the bottom of a section while it has unsaved edits. */
export function SaveBar({ visible, isPending = false, onSave, onDiscard }: SaveBarProps) {
  const { t } = useTranslation("business-branches")
  if (!visible) return null

  return (
    // Right padding leaves room for the floating assistant button of the app layout.
    <div className="flex shrink-0 animate-in flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-card/90 py-3 pr-20 pl-5 backdrop-blur fade-in slide-in-from-bottom-2">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-amber-400" />
        {t("cfg_unsaved")}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onDiscard} disabled={isPending}>
          <X className="size-4" />
          {t("cfg_discard")}
        </Button>
        <Button type="button" onClick={onSave} disabled={isPending}>
          <Check className="size-4" />
          {isPending ? t("saving") : t("save_changes")}
        </Button>
      </div>
    </div>
  )
}

interface SectionShellProps {
  icon: LucideIcon
  title: string
  description: string
  /** Status badge shown at the right of the heading. */
  status?: ReactNode
  /** Usually a `SaveBar`. */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Pane of one settings section: heading, body that scrolls vertically and optional footer. It is a
 * size container, so `@lg:`-style classes inside adapt to the pane width and not to the screen.
 */
export function SectionShell({ icon: Icon, title, description, status, footer, children }: SectionShellProps) {
  return (
    <section
      aria-labelledby="branch-config-title"
      className="@container flex min-h-0 min-w-0 flex-col rounded-2xl border border-border/70 bg-background/35"
    >
      <header className="flex shrink-0 items-center gap-3.5 border-b border-border/70 px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="branch-config-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {status}
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4 @xl:p-5">{children}</div>
      {footer}
    </section>
  )
}
