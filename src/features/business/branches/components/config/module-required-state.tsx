import type { LucideIcon } from "lucide-react"
import { ArrowRight, Lock, Puzzle } from "lucide-react"

import { EmptyState } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ModuleRequiredStateProps {
  icon: LucideIcon
  title: string
  description: string
  /** What the user gets by assigning the module, shown as locked chips. */
  unlocks: string[]
  /** Extra help for when assigning the module is not possible (license, requirements). */
  hint?: string
  actionLabel: string
  onAction: () => void
}

/**
 * Shown in place of a settings section whose module is not assigned to the branch: what the module
 * is for, what it unlocks and a direct way to assign it.
 */
export function ModuleRequiredState({
  icon,
  title,
  description,
  unlocks,
  hint,
  actionLabel,
  onAction,
}: ModuleRequiredStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 @xl:py-14">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <Button type="button" onClick={onAction}>
            <Puzzle className="size-4" />
            {actionLabel}
            <ArrowRight className="size-4" />
          </Button>
        }
      />
      {unlocks.length > 0 ? (
        <ul className="mt-7 flex flex-wrap justify-center gap-2" aria-label={title}>
          {unlocks.map((item) => (
            <li key={item}>
              <Badge tone="neutral" className="gap-1.5 font-medium tracking-normal normal-case">
                <Lock aria-hidden className="size-3" />
                {item}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? (
        <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
