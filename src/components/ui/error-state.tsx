import type { ComponentType, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ErrorStateProps = {
  title?: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  icon?: ComponentType<{ className?: string }>
  variant?: "page" | "inline"
  className?: string
}

export function ErrorState(props: ErrorStateProps) {
  const { title, description, eyebrow, action, icon: Icon = AlertTriangle, variant = "page", className } = props

  const isInline = variant === "inline"

  return (
    <Card
      className={cn(
        "overflow-hidden border-destructive/20 bg-gradient-to-br from-card via-card to-destructive/5 shadow-[0_24px_70px_rgba(127,29,29,0.08)]",
        isInline ? "rounded-[24px]" : "rounded-[28px]",
        className
      )}
    >
      <CardContent
        className={cn(
          "relative",
          isInline
            ? "flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
            : "flex flex-col items-start gap-5 p-8"
        )}
      >
        <div className={cn("flex items-center gap-4", !isInline && "max-w-2xl")}>
          <div className="flex size-22 shrink-0 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
            <Icon className="size-10 -rotate-360 animate-in duration-1000 spin-in" />
          </div>

          <div className="space-y-3">
            <Badge tone="danger" className="w-fit">
              {eyebrow}
            </Badge>
            <div className="space-y-2">
              <h2 className={cn("font-semibold text-foreground", isInline ? "text-lg" : "text-2xl")}>{title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {action ? <div className={cn("flex shrink-0", isInline ? "sm:self-center" : "")}>{action}</div> : null}
      </CardContent>
    </Card>
  )
}
