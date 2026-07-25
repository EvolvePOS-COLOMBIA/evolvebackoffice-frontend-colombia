import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function BusinessModulePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { currentTenant } = useAuth()

  return (
    <Card className="rounded-[30px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[24px] border border-border/70 bg-accent/35 p-5">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">Current business</p>
          <p className="mt-3 text-lg font-semibold text-foreground">{currentTenant?.businessName ?? "No business selected"}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            This placeholder is already tenant-aware, so the future implementation can plug into the active business
            context directly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
