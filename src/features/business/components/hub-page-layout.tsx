import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type HubPageLayoutProps = {
  badge: string
  title: string
  description: string
  icon: LucideIcon
  iconClass?: string
  children: React.ReactNode
}

export function HubPageLayout({ badge, title, description, icon: Icon, iconClass, children }: HubPageLayoutProps) {
  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 lg:p-8">
        <div className="flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {badge}
          </Badge>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{description}</p>
          <Icon
            color="#58626b"
            className={cn(
              "absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100",
              iconClass
            )}
          />
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-2">{children}</section>
      </CardContent>
    </Card>
  )
}
