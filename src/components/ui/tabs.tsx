import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error("Tabs components must be used within Tabs.")
  }

  return context
}

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: React.ComponentProps<"div"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const currentValue = value ?? internalValue

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue)
      }

      onValueChange?.(nextValue)
    },
    [onValueChange, value]
  )

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("inline-flex rounded-xl border border-border/70 bg-background/90 p-1", className)} {...props} />
  )
}

function TabsTrigger({
  className,
  value,
  ...props
}: React.ComponentProps<"button"> & {
  value: string
}) {
  const context = useTabsContext()
  const isActive = context.value === value

  return (
    <button
      type="button"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex min-w-0 cursor-pointer items-center justify-center rounded-xl px-4 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-secondary text-foreground shadow-sm dark:bg-accent/60"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    />
  )
}

function TabsContent({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  value: string
}) {
  const context = useTabsContext()

  if (context.value !== value) {
    return null
  }

  return <div className={className} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
