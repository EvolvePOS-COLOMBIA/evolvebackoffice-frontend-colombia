import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function parseIsoDate(value: string) {
  const parts = value.split("-").map((segment) => Number(segment))
  if (parts.length !== 3) {
    return undefined
  }

  const [year, month, day] = parts
  if (!year || !month || !day) {
    return undefined
  }

  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", disabled, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => {
    if (!value) {
      return undefined
    }

    return parseIsoDate(value)
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-card/75 text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              return
            }
            onChange(formatIsoDate(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
