import { ArrowRight, ChevronRight, Layers, Monitor, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/i18n/use-i18n"

import { TOTAL_MODULE_COUNT } from "../constants"

type StepDoneProps = {
  userFirstName: string
  businessName: string
  branchName: string
  activeModules: number
  onGoToDashboard: () => void
}

const NEXT_STEPS = [
  { key: "register", icon: Monitor },
  { key: "items", icon: Layers },
  { key: "branch", icon: Store },
] as const

export function StepDone({ userFirstName, businessName, branchName, activeModules, onGoToDashboard }: StepDoneProps) {
  const { t } = useTranslation("business-onboarding")

  const summary = [
    { label: t("summary_business"), value: businessName },
    { label: t("summary_branch"), value: branchName },
    { label: t("summary_modules"), value: `${activeModules} / ${TOTAL_MODULE_COUNT}` },
  ]

  return (
    <div className="flex flex-col items-start">
      <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-[34px]">
        {t("done_title", { name: userFirstName })}
      </h1>

      <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
        {t("done_description", { business: businessName })}
      </p>

      <Card className="mt-5.5 grid w-full gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {item.label}
            </span>
            <span className="text-[15px] font-medium">{item.value || "—"}</span>
          </div>
        ))}
      </Card>

      <div className="mt-5.5 w-full">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {t("next_steps")}
        </p>

        <div className="flex flex-col gap-2.5">
          {NEXT_STEPS.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/55 px-3.5 py-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[9.6px] bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(`next_${key}`, { branch: branchName })}</p>
                <p className="text-[13px] leading-[18px] text-muted-foreground">{t(`next_${key}_desc`)}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      <Button className="mt-6" onClick={onGoToDashboard}>
        {t("go_to_dashboard")}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
