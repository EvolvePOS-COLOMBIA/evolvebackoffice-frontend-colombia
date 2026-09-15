import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useTranslation } from "@/i18n/use-i18n"

export function BusinessModulePlaceholder({ title, description }: { title: string; description: string }) {
  const { tenantId } = useAuth()
  const { t } = useTranslation("common")

  return (
    <Card className="rounded-[30px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[24px] border border-border/70 bg-accent/35 p-5">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            {t("current_business")}
          </p>
          <p className="mt-3 text-lg font-semibold text-foreground">{tenantId ?? t("no_business_selected")}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("placeholder_desc")}</p>
        </div>
      </CardContent>
    </Card>
  )
}
