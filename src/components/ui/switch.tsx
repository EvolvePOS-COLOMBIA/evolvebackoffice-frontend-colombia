import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  glow = false,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  /** Optional soft glow while the switch is on. Off by default. */
  glow?: boolean
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
        glow && "data-[state=checked]:shadow-[0_0_14px_color-mix(in_oklab,var(--primary)_45%,transparent)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-1"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
