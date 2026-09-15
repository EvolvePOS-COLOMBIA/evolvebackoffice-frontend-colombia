import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 [&:has(svg)]:pl-11 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card/60 text-card-foreground",
        success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-200",
        warning: "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-200",
        danger: "border-rose-400/30 bg-rose-500/10 text-rose-500 dark:text-rose-200",
        info: "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("mb-1 text-sm leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-sm leading-6", className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
