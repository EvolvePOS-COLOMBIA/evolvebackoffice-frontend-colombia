import * as React from "react"
import { DayFlag, DayPicker, SelectionState, UI } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        [UI.Months]: "flex flex-col gap-4",
        [UI.Month]: "space-y-3",
        [UI.MonthCaption]: "flex items-center justify-between gap-2 px-2",
        [UI.CaptionLabel]: "text-sm font-semibold text-foreground",
        [UI.Nav]: "absolute top-2 right-2 flex items-center gap-2",
        [UI.PreviousMonthButton]:
          "inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/70 transition hover:bg-accent hover:text-foreground",
        [UI.NextMonthButton]:
          "inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/70 transition hover:bg-accent hover:text-foreground",
        [UI.Chevron]: "size-4 text-white",
        [UI.Weekdays]: "flex px-1 mt-2",
        [UI.Weekday]: "w-9 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-primary",
        [UI.Weeks]: "mt-2 flex flex-col gap-1",
        [UI.Week]: "flex px-1",
        [UI.Day]: "relative size-9 p-0 text-center rounded-full",
        [UI.DayButton]:
          "inline-flex h-full w-full items-center justify-center rounded-full text-sm font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        [SelectionState.selected]: "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(14,165,233,0.18)]",
        [SelectionState.range_middle]: "bg-accent text-foreground",
        [SelectionState.range_start]: "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(14,165,233,0.18)]",
        [SelectionState.range_end]: "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(14,165,233,0.18)]",
        [DayFlag.today]: "border border-primary/25 bg-primary/10 text-primary",
        [DayFlag.outside]: "text-muted-foreground/50",
        [DayFlag.disabled]: "text-muted-foreground/40 opacity-60",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
