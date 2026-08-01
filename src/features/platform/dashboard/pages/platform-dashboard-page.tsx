import { Building2, CircleOff, CirclePlus, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/store/app-store"
import { useTranslation } from "@/i18n/use-i18n"

export function PlatformDashboardPage() {
  const clients = useAppStore((state) => state.platformClients)
  const { t } = useTranslation("platform-dashboard")

  const activeClients = clients.filter((client) => client.status === "active").length
  const inactiveClients = clients.length - activeClients
  const recentClients = [...clients].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 3)

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("platform_overview")}</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("platform_overview_desc")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("platform_overview_subtitle")}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label={t("total_clients")} value={clients.length} icon={Building2} />
            <MetricCard label={t("active_clients")} value={activeClients} icon={Sparkles} />
            <MetricCard label={t("inactive_clients")} value={inactiveClients} icon={CircleOff} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recent_activity")}</CardTitle>
          <CardDescription>{t("recent_activity_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {recentClients.map((client) => (
            <Card key={client.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">{client.businessName}</h2>
                  <Badge tone={client.status === "active" ? "success" : "warning"}>{client.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{client.slug}</p>
                <p className="text-sm text-muted-foreground">{client.adminEmail}</p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-dashed">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <CirclePlus className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("next_step")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("next_step_desc")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Building2
}) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
          <Icon className="size-4 text-primary" />
        </div>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
