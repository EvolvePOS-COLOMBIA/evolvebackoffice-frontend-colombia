import { useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { branchesKeys } from "@/features/business/branches/hooks/use-branches"
import { useAppStore } from "@/store/app-store"

import { EMPTY_DRAFT } from "../constants"
import { clearOnboardingForce } from "../dev-override"
import { ONBOARDING_STEPS } from "../types"
import type {
  AccountStepValues,
  BranchStepValues,
  BusinessStepValues,
  ModuleKey,
  ModuleSelection,
  OnboardingDraft,
  OnboardingStepId,
} from "../types"

/**
 * Controlador del wizard: navegación entre pasos y borrador persistido.
 * Las llamadas a la API viven en `use-onboarding-mutations`.
 */
export function useOnboarding() {
  const { session, tenantId } = useAuth()
  const queryClient = useQueryClient()

  const drafts = useAppStore((state) => state.onboardingDrafts)
  const setOnboardingDraft = useAppStore((state) => state.setOnboardingDraft)
  const clearOnboardingDraft = useAppStore((state) => state.clearOnboardingDraft)
  const markOnboardingCompleted = useAppStore((state) => state.markOnboardingCompleted)

  const draftKey = tenantId ?? "__no_tenant__"
  const draft = useMemo<OnboardingDraft>(() => drafts[draftKey] ?? EMPTY_DRAFT, [drafts, draftKey])

  const patchDraft = useCallback(
    (patch: Partial<OnboardingDraft>) => {
      setOnboardingDraft(draftKey, { ...draft, ...patch })
    },
    [draft, draftKey, setOnboardingDraft]
  )

  const stepIndex = Math.min(Math.max(draft.stepIndex, 0), ONBOARDING_STEPS.length - 1)
  const stepId: OnboardingStepId = ONBOARDING_STEPS[stepIndex] ?? "welcome"

  const goToStep = useCallback(
    (id: OnboardingStepId) => {
      const index = ONBOARDING_STEPS.indexOf(id)
      if (index >= 0) {
        patchDraft({ stepIndex: index })
      }
    },
    [patchDraft]
  )

  const next = useCallback(
    () => patchDraft({ stepIndex: Math.min(ONBOARDING_STEPS.length - 1, stepIndex + 1) }),
    [patchDraft, stepIndex]
  )

  const back = useCallback(
    () => patchDraft({ stepIndex: Math.max(0, stepIndex - 1) }),
    [patchDraft, stepIndex]
  )

  const setAccount = useCallback(
    (account: AccountStepValues, saved: boolean, passwordChanged: boolean) =>
      patchDraft({ account, accountSaved: saved, passwordChanged }),
    [patchDraft]
  )

  const setBusiness = useCallback(
    (business: BusinessStepValues) => patchDraft({ business }),
    [patchDraft]
  )

  const setBranch = useCallback(
    (branch: BranchStepValues, createdBranchId: string | null) =>
      patchDraft({ branch, createdBranchId }),
    [patchDraft]
  )

  const toggleModule = useCallback(
    (key: ModuleKey) =>
      patchDraft({ modules: { ...draft.modules, [key]: !draft.modules[key] } as ModuleSelection }),
    [draft.modules, patchDraft]
  )

  /** Cierra el onboarding: marca el tenant como configurado y limpia el borrador. */
  const finish = useCallback(() => {
    if (tenantId) {
      markOnboardingCompleted(tenantId)
      clearOnboardingDraft(tenantId)
    }
    // Si se estaba probando con el override de desarrollo, apagarlo aquí evita
    // que el gate rebote al usuario de vuelta al wizard.
    clearOnboardingForce()
    queryClient.invalidateQueries({ queryKey: branchesKeys.all })
  }, [clearOnboardingDraft, markOnboardingCompleted, queryClient, tenantId])

  return {
    tenantId,
    userId: session?.user.id ?? null,
    userFullName: session?.user.fullName ?? "",
    userEmail: session?.user.email ?? "",
    forcePasswordChange: session?.forcePasswordChange ?? false,
    draft,
    stepId,
    stepIndex,
    goToStep,
    next,
    back,
    setAccount,
    setBusiness,
    setBranch,
    toggleModule,
    finish,
  }
}
