import { ArrowRight, Building2, LayoutDashboard, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/use-i18n"

export function MarketingPage() {
  const { t } = useTranslation("marketing")

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_28%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-primary/80 uppercase">{t("pos_manager")}</p>
            <h1 className="text-lg font-semibold text-foreground">{t("multitenant_frontend")}</h1>
          </div>
          <Button asChild>
            <Link to="/login">
              {t("sign_in")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </header>

        <main className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <Badge tone="primary">{t("saas_operations")}</Badge>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold text-balance text-foreground sm:text-5xl">
                {t("main_heading")}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">{t("main_desc")}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/login">{t("go_to_login")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/platform/dashboard">{t("explore_protected_flow")}</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4">
            <FeatureCard
              icon={ShieldCheck}
              title={t("platform_administration")}
              description={t("platform_administration_desc")}
            />
            <FeatureCard
              icon={Building2}
              title={t("business_operations")}
              description={t("business_operations_desc")}
            />
            <FeatureCard
              icon={LayoutDashboard}
              title={t("clean_saas_dashboards")}
              description={t("clean_saas_dashboards_desc")}
            />
          </section>
        </main>
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck
  title: string
  description: string
}) {
  return (
    <Card className="rounded-[28px] border-border/70 bg-card/75">
      <CardContent className="flex gap-4 p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
