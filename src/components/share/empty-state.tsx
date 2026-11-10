import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type EmptyStateProps = {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * Centered empty state: icon tile, title, short description and action.
 *
 * @example
 * <EmptyState icon={Users} title="Aún no hay clientes" description="Crea el primero..." action={<Button/>} />
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      {Icon ? (
        <div className="flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
          <Icon className="size-6" />
        </div>
      ) : null}
      <p className="mt-4 text-lg font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
