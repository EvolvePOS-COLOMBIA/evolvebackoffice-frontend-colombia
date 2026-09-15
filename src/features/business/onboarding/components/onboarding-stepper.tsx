import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"
import { NUMBERED_STEPS, ONBOARDING_STEPS, type OnboardingStepId } from "../types"

type OnboardingStepperProps = {
  currentIndex: number
  onSelect: (id: OnboardingStepId) => void
}

const STEP_LABEL_KEYS: Record<string, string> = {
  account: "step_account",
  business: "step_business",
  branch: "step_branch",
}

const STEP_LABEL_SHORT_KEYS: Record<string, string> = {
  account: "step_account_short",
  business: "step_business_short",
  branch: "step_branch_short",
}

export function OnboardingStepper({ currentIndex, onSelect }: OnboardingStepperProps) {
  const { t } = useTranslation("business-onboarding")

  return (
    <nav aria-label={t("steps_nav_label")} className="flex w-full px-4 md:max-w-3xl md:px-6">
      {NUMBERED_STEPS.map((id, position) => {
        const index = ONBOARDING_STEPS.indexOf(id)
        const isDone = currentIndex > index
        const isActive = currentIndex === index
        const isConnectorFilled = currentIndex > index

        return (
          <div key={id} className="flex min-w-0 flex-1 items-start last:flex-none">
            <button
              type="button"
              onClick={() => onSelect(id)}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5 sm:gap-2.5"
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold transition-colors sm:size-8 sm:text-[13px]",
                  isDone && "border-primary/45 bg-primary/12 text-primary",
                  isActive && "border-primary/45 bg-primary text-white",
                  !isDone && !isActive && "border-border/70 text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-3 sm:size-3.5" strokeWidth={3} /> : position + 1}
              </span>
              <span
                className={cn(
                  "text-center text-[11px] leading-4 font-medium sm:text-[13px] sm:leading-4.25",
                  isDone || isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="sm:hidden">{t(STEP_LABEL_SHORT_KEYS[id] ?? id)}</span>
                <span className="hidden sm:inline">{t(STEP_LABEL_KEYS[id] ?? id)}</span>
              </span>
            </button>

            {position < NUMBERED_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-2.5 min-w-3 flex-1 rounded-full transition-colors sm:mt-3.75 sm:min-w-5",
                  "h-0.5",
                  isConnectorFilled ? "bg-primary/45" : "bg-border/70"
                )}
              />
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
