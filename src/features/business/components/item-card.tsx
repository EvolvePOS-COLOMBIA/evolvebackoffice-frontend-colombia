import { ChevronRight, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"

export type ItemCardLink = {
  name: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  onClick?: () => void
}

export function ItemCard({ item }: { item: ItemCardLink }) {
  const isDisabled = item.disabled ?? false
  const { t } = useTranslation("common")

  return (
    <Card
      className={cn(
        "group rounded-xl border-border/70 bg-background/45 shadow-none transition-all duration-300 ease-out",
        isDisabled
          ? "cursor-default opacity-60"
          : "cursor-pointer hover:border-primary/80 hover:bg-primary hover:shadow-lg hover:shadow-primary/20"
      )}
      onClick={isDisabled ? undefined : item.onClick}
    >
      <CardContent className="flex items-center p-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all duration-300 ease-out",
            !isDisabled &&
              "group-hover:scale-105 group-hover:border-white/25 group-hover:bg-white/15 group-hover:shadow-md group-hover:shadow-white/10"
          )}
        >
          <item.icon
            className={cn(
              "size-5 text-primary transition-all duration-300 ease-out",
              !isDisabled && "group-hover:scale-110 group-hover:text-white"
            )}
          />
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              className={cn(
                "line-clamp-1 text-base font-semibold text-foreground transition-colors duration-300 ease-out",
                !isDisabled && "group-hover:text-white"
              )}
            >
              {item.name}
            </h2>
            {isDisabled && (
              <Badge tone="warning" className="shrink-0 text-[8px]">
                {t("coming_soon")}
              </Badge>
            )}
          </div>
          <p
            className={cn(
              "line-clamp-2 text-xs text-muted-foreground transition-colors duration-300 ease-out md:line-clamp-1 md:text-sm",
              !isDisabled && "group-hover:text-white/80"
            )}
          >
            {item.label}
          </p>
        </div>
        {!isDisabled && (
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:text-white/90" />
        )}
      </CardContent>
    </Card>
  )
}
