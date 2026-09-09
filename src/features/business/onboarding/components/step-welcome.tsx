import { ArrowRight, Clock, Grid2x2, Store, UserRound, Building2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/i18n/use-i18n"

type StepWelcomeProps = {
  userFirstName: string
  businessName: string
  onStart: () => void
}

const HIGHLIGHTS = [
  { icon: UserRound, titleKey: "welcome_item_account", descKey: "welcome_item_account_desc" },
  { icon: Building2, titleKey: "welcome_item_business", descKey: "welcome_item_business_desc" },
  { icon: Store, titleKey: "welcome_item_branch", descKey: "welcome_item_branch_desc" },
  { icon: Grid2x2, titleKey: "welcome_item_modules", descKey: "welcome_item_modules_desc" },
] as const

export function StepWelcome({ userFirstName, businessName, onStart }: StepWelcomeProps) {
  const { t } = useTranslation("business-onboarding")

  return (
    <div className="flex flex-col">
      <Badge tone="primary" className="w-fit">
        {t("initial_setup")}
      </Badge>

      <h1 className="mt-4.5 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {t("welcome_title", { name: userFirstName })}
      </h1>

      <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
        {t("welcome_description", { business: businessName })}
      </p>

      <Card className="mt-7 p-2">
        {HIGHLIGHTS.map(({ icon: Icon, titleKey, descKey }) => (
          <div key={titleKey} className="flex items-center gap-3.5 rounded-xl px-3.5 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-medium">{t(titleKey)}</p>
              <p className="text-[13px] leading-4.5 text-muted-foreground">{t(descKey)}</p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button onClick={onStart}>
          {t("start_setup")}
          <ArrowRight className="size-4" />
        </Button>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Clock className="size-4" />
          {t("estimated_time")}
        </span>
      </div>
    </div>
  )
}
