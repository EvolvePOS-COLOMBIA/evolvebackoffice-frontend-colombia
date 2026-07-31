import { ChevronRight, type LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export type ItemCardLink = {
  name: string
  label: string
  icon: LucideIcon
}

export function ItemCard({ item }: { item: ItemCardLink }) {
  return (
    <Card className="group cursor-pointer rounded-xl border-border/70 bg-background/45 shadow-none transition-all duration-300 ease-out hover:border-primary/80 hover:bg-primary hover:shadow-lg hover:shadow-primary/20">
      <CardContent className="flex items-center p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all duration-300 ease-out group-hover:scale-105 group-hover:border-white/25 group-hover:bg-white/15 group-hover:shadow-md group-hover:shadow-white/10">
          <item.icon className="size-5 text-primary transition-all duration-300 ease-out group-hover:scale-110 group-hover:text-white" />
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <h2 className="line-clamp-1 text-base font-semibold text-foreground transition-colors duration-300 ease-out group-hover:text-white">
            {item.name}
          </h2>
          <p className="line-clamp-2 text-xs text-muted-foreground transition-colors duration-300 ease-out group-hover:text-white/80 md:line-clamp-1 md:text-sm">
            {item.label}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:text-white/90" />
      </CardContent>
    </Card>
  )
}
