import { ArrowRight, Building2, LayoutDashboard, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function MarketingPage() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_28%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-primary/80 uppercase">POS Manager</p>
            <h1 className="text-lg font-semibold text-foreground">Multitenant Frontend</h1>
          </div>
          <Button asChild>
            <Link to="/login">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </header>

        <main className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <Badge tone="primary">SaaS operations</Badge>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold text-balance text-foreground sm:text-5xl">
                One control center for platform teams and every business they manage.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                Centralize tenant onboarding, preserve role-based access, and let business administrators switch between
                storefronts without interrupting their session.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/login">Go to login</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/platform/dashboard">Explore protected flow</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4">
            <FeatureCard
              icon={ShieldCheck}
              title="Platform administration"
              description="Create and maintain tenants, monitor active clients, and keep the whole portfolio under control."
            />
            <FeatureCard
              icon={Building2}
              title="Business operations"
              description="Switch the active business instantly and keep dashboards aligned with the current tenant context."
            />
            <FeatureCard
              icon={LayoutDashboard}
              title="Clean SaaS dashboards"
              description="Feature-driven routing, persisted session state, and consistent shadcn-style UI patterns."
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
