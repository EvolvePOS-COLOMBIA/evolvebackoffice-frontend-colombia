import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { badgeTones } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { StatTone } from "./types"

export type StatTileProps = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  tone?: StatTone
  className?: string
}

export function StatTile({ label, value, icon: Icon, tone = "muted", className }: StatTileProps) {
  const badgeTone = tone === "muted" ? "neutral" : tone

  return (
    <div
      className={cn(
        // Móvil (<sm): chip píldora en una línea. sm+: card con icono arriba.
        "group/tile flex items-center gap-2 rounded-full border border-border/70 bg-background/45 px-3 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:block sm:min-w-32 sm:rounded-2xl sm:px-3.5 sm:py-3",
        className
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-transform duration-200 group-hover/tile:scale-110 group-hover/tile:-rotate-3 motion-reduce:transition-none motion-reduce:group-hover/tile:transform-none sm:size-7 sm:rounded-lg",
            badgeTones[badgeTone]
          )}
        >
          <Icon className="size-3 sm:size-3.5" />
        </div>
      ) : null}
      <div className={cn("flex min-w-0 flex-1 items-center justify-between gap-2", Icon ? "sm:mt-2.5" : "sm:mt-1")}>
        <p className="truncate text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:text-[10px]">
          {label}
        </p>
        <p className="text-sm font-semibold tracking-tight sm:text-lg">{value}</p>
      </div>
    </div>
  )
}
