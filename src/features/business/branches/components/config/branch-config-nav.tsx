import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"
import { CONFIG_GROUPS, type ConfigSectionDef, type ConfigSectionId } from "./config-sections"

interface BranchConfigNavProps {
  sections: ConfigSectionDef[]
  active: ConfigSectionId
  onSelect: (id: ConfigSectionId) => void
  /** Small status at the right of each item: a count, a lock, a connection dot. */
  indicators?: Partial<Record<ConfigSectionId, ReactNode>>
}

/**
 * Section menu of the branch settings. Vertical with group headings when there is room; when the
 * container is narrow it becomes a wrapping row of chips, so it never scrolls sideways.
 */
export function BranchConfigNav({ sections, active, onSelect, indicators = {} }: BranchConfigNavProps) {
  const { t } = useTranslation("business-branches")

  return (
    <nav
      aria-label={t("cfg_nav_label")}
      className="flex min-h-0 flex-wrap gap-1.5 @3xl:flex-col @3xl:gap-4 @3xl:overflow-y-auto"
    >
      {CONFIG_GROUPS.map((group) => {
        const items = sections.filter((section) => section.group === group)
        if (items.length === 0) return null
        return (
          <div key={group} className="contents @3xl:block">
            <p className="mb-1 hidden px-2.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase @3xl:block">
              {t(`group_${group}`)}
            </p>
            <div className="contents @3xl:flex @3xl:flex-col @3xl:gap-0.5">
              {items.map(({ id, icon: Icon }) => {
                const isActive = id === active
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(id)}
                    className={cn(
                      "relative h-9 justify-start gap-2.5 px-2.5 font-medium text-muted-foreground @3xl:w-full",
                      isActive &&
                        "bg-primary/10 text-foreground ring-1 ring-primary/25 before:absolute before:top-2 before:bottom-2 before:-left-2 before:hidden before:w-[3px] before:rounded-full before:bg-primary before:shadow-[0_0_12px_var(--primary)] @3xl:before:block"
                    )}
                  >
                    <Icon className={cn("size-4", isActive && "text-primary")} />
                    {t(`section_${id}`)}
                    {indicators[id] ? (
                      <span className="ml-auto flex items-center text-xs">{indicators[id]}</span>
                    ) : null}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
