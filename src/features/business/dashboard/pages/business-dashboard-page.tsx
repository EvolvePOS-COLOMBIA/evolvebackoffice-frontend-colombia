import { Boxes, Building2, PackageSearch, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function BusinessDashboardPage() {
  const { availableTenants, currentTenant } = useAuth()

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">Business overview</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-balance text-foreground">
                {currentTenant ? `Welcome to ${currentTenant.businessName}.` : "Welcome to the business workspace."}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Your current dashboard follows the selected business. Switching tenants keeps the session active and the
                shell in sync.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Managed businesses" value={availableTenants.length} icon={Building2} />
            <MetricCard label="Active tenant" value={currentTenant ? 1 : 0} icon={Boxes} />
            <MetricCard label="Inventory modules" value={3} icon={PackageSearch} />
            <MetricCard label="People modules" value={2} icon={Users} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <FocusCard title="Items" description="Catalog workflows and selling units are ready for the next implementation step." />
        <FocusCard title="Inventory" description="Use the active tenant context to scope stock, movements, and replenishment data." />
        <FocusCard title="People" description="Role-aware employee and customer management can build on the same tenant context." />
      </div>
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

function FocusCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-[28px] border-border/70 bg-background/45">
      <CardContent className="space-y-3 p-5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
