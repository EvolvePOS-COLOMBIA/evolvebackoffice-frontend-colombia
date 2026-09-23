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
      className={cn("min-w-0 rounded-2xl border border-border/70 bg-background/45 px-3.5 py-3 sm:min-w-32", className)}
    >
      {Icon ? (
        <div className={cn("flex size-7 items-center justify-center rounded-lg border", badgeTones[badgeTone])}>
          <Icon className="size-3.5" />
        </div>
      ) : null}
      <div className="flex min-w-0 justify-between gap-2">
        <p
          className={cn(
            "text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:text-[10px]",
            Icon ? "mt-2.5" : "mt-1"
          )}
        >
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  )
}
