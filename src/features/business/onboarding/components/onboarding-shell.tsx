import type { ReactNode } from "react"

import { Logo } from "@/components/icons/logo"
import { OnboardingStepper } from "./onboarding-stepper"
import type { OnboardingStepId } from "../types"

type OnboardingShellProps = {
  currentIndex: number
  stepId: OnboardingStepId
  onSelectStep: (id: OnboardingStepId) => void
  children: ReactNode
}

/**
 * Layout del onboarding: pantalla completa, sin sidebar ni navbar.
 * Reusa los gradientes del AppLayout para que se sienta la misma app.
 */
export function OnboardingShell({ currentIndex, stepId, onSelectStep, children }: OnboardingShellProps) {
  const showStepper = currentIndex !== 0 && stepId !== "done"

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-center gap-4 px-4 py-5 sm:px-6 lg:px-12">
        <Logo className="w-50" />
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-92 bg-[radial-gradient(circle_at_top,rgba(41,161,255,0.18),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(41,161,255,0.22),transparent_36%)]" />
          <div className="absolute right-0 bottom-0 h-80 w-80 bg-[radial-gradient(circle,rgba(41,161,255,0.12),transparent_55%)] dark:bg-[radial-gradient(circle,rgba(41,161,255,0.16),transparent_55%)]" />
        </div>

        <div className="relative flex h-full flex-col items-center overflow-y-auto px-4 py-7 sm:px-6 lg:px-12">
          {showStepper && <OnboardingStepper currentIndex={currentIndex} onSelect={onSelectStep} />}

          <div className="flex w-full flex-1 items-center justify-center py-8">
            <div className="w-full max-w-220">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
