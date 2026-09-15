import { Check, MapPin, Phone, Mail, Store, User } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useTranslation } from "@/i18n/use-i18n"

import type { BranchStepValues } from "../types"
import { StepCard, StepFooter } from "./step-frame"

type StepBranchSummaryProps = {
  branch: BranchStepValues
  adminUserName: string
  onContinue: () => void
  onBack: () => void
}

export function StepBranchSummary({ branch, adminUserName, onContinue, onBack }: StepBranchSummaryProps) {
  const { t } = useTranslation("business-onboarding")

  const fields = [
    { label: t("branch_name"), value: branch.name, icon: Store },
    { label: t("address"), value: branch.address, icon: MapPin },
    { label: t("phone"), value: branch.phone, icon: Phone },
    { label: t("email"), value: branch.email, icon: Mail },
    { label: t("branch_admin"), value: adminUserName, icon: User },
  ].filter((f) => f.value)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
    >
      <StepCard icon={Check} title={t("branch_exists_title")} description={t("branch_description")}>
        <Card className="grid w-full gap-4 px-6 py-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <field.icon className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {field.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium">{field.value}</p>
              </div>
            </div>
          ))}
        </Card>
      </StepCard>

      <StepFooter onBack={onBack} backLabel={t("back")} submitLabel={t("save_and_continue")} />
    </form>
  )
}
