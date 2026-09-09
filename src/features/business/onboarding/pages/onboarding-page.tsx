import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useUser } from "@/features/business/people/users/hooks/use-users"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

import { OnboardingShell } from "../components/onboarding-shell"
import { StepAccount } from "../components/step-account"
import { StepBranch } from "../components/step-branch"
import { StepBranchSummary } from "../components/step-branch-summary"
import { StepBusiness } from "../components/step-business"
import { StepDone } from "../components/step-done"
import { StepWelcome } from "../components/step-welcome"
import { countActiveModules } from "../constants"
import { useCreateFirstBranch, useSaveAdminProfile, useSaveBusinessProfile } from "../hooks/use-onboarding-mutations"
import { useOnboarding } from "../hooks/use-onboarding"
import { useOnboardingStatus } from "../hooks/use-onboarding-status"
import { useTenantSettings } from "../hooks/use-tenant-settings"
import type { AccountFormValues, BranchFormValues, BusinessFormValues } from "../schemas/onboarding-schemas"

export function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation("business-onboarding")
  const { defaultRoute } = useAuth()
  const status = useOnboardingStatus()

  const [sameAsBusiness, setSameAsBusiness] = useState(false)

  const {
    draft,
    stepId,
    stepIndex,
    userId,
    userFullName,
    goToStep,
    next,
    back,
    setAccount,
    setBusiness,
    setBranch,
    finish,
  } = useOnboarding()

  const { data: backendUser } = useUser(userId)
  const { data: tenantSettings } = useTenantSettings()
  const { data: existingBranches } = useBranches(1, 1)

  // Auto-detectar si ya existe una sucursal en el backend
  useEffect(() => {
    if (stepId === "branch" && !draft.createdBranchId && existingBranches && existingBranches.totalCount > 0) {
      const firstBranch = existingBranches.data[0]
      if (firstBranch) {
        setBranch(
          {
            name: firstBranch.name,
            identification: firstBranch.identification,
            address: firstBranch.address,
            phone: firstBranch.phone,
            email: firstBranch.email,
            adminUserId: firstBranch.adminUserId,
          },
          firstBranch.id
        )
      }
    }
  }, [stepId, draft.createdBranchId, existingBranches, setBranch])

  const saveAccountMutation = useSaveAdminProfile()
  const saveBusinessMutation = useSaveBusinessProfile()
  const createBranchMutation = useCreateFirstBranch()

  // Si el borrador quedó en el paso de módulos (omitido), saltar a done.
  useEffect(() => {
    if (stepId === "modules") goToStep("done")
  }, [stepId, goToStep])

  // Si el tenant ya está configurado, esta ruta no tiene nada que hacer.
  if (!status.isLoading && !status.isPending) {
    return <Navigate to={defaultRoute} replace />
  }

  // Nombre más actualizado: backend API > borrador de la sesión > JWT
  const backendFullName = backendUser ? [backendUser.firstName, backendUser.lastName].filter(Boolean).join(" ") : ""
  const firstName = draft.account?.firstName || backendUser?.firstName || userFullName.split(" ")[0] || ""
  const displayName = draft.account
    ? [draft.account.firstName, draft.account.lastName].filter(Boolean).join(" ")
    : backendFullName || userFullName
  const businessName = draft.business?.name || tenantSettings?.name || ""
  const branchName = draft.branch?.name ?? ""

  const handleAccountSubmit = (values: AccountFormValues) => {
    if (!userId) {
      notify.error(t("error_no_session"))
      return
    }

    saveAccountMutation.mutate(
      {
        userId,
        values,
      },
      {
        onSuccess: () => {
          setAccount(values, true, draft.passwordChanged)
          next()
        },
        onError: (error) => {
          notify.error(error instanceof Error ? error.message : t("error_saving"))
        },
      }
    )
  }

  const handleBusinessSubmit = (values: BusinessFormValues) => {
    saveBusinessMutation.mutate(values, {
      onSuccess: () => {
        setBusiness(values)
        next()
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : t("error_saving"))
      },
    })
  }

  const handleBranchSubmit = (values: BranchFormValues) => {
    if (!userId) {
      notify.error(t("error_no_session"))
      return
    }

    const branchValues = {
      name: values.name,
      identification: values.identification,
      address: values.address,
      phone: values.phone,
      email: values.email,
      adminUserId: values.adminUserId || userId,
    }

    // Si el usuario retrocedió y vuelve a avanzar, no creamos la sucursal otra vez.
    if (draft.createdBranchId) {
      setBranch(branchValues, draft.createdBranchId)
      goToStep("done")
      return
    }

    createBranchMutation.mutate(
      { values: branchValues, adminUserId: userId },
      {
        onSuccess: (branch) => {
          setBranch(branchValues, branch.id)
          notify.success(t("branch_created", { name: branch.name || branchValues.name }))
          goToStep("done")
        },
        onError: (error) => {
          notify.error(error instanceof Error ? error.message : t("error_creating_branch"))
        },
      }
    )
  }

  const handleGoToDashboard = () => {
    finish()
    navigate("/business/dashboard", { replace: true })
  }

  return (
    <OnboardingShell currentIndex={stepIndex} stepId={stepId} onSelectStep={goToStep}>
      {stepId === "welcome" ? (
        <StepWelcome userFirstName={firstName} businessName={businessName} onStart={next} />
      ) : null}

      {stepId === "account" ? (
        <StepAccount
          initialValues={draft.account}
          backendUser={backendUser}
          isSubmitting={saveAccountMutation.isPending}
          onBack={back}
          onSubmit={handleAccountSubmit}
        />
      ) : null}

      {stepId === "business" ? (
        <StepBusiness
          initialValues={draft.business}
          tenantSettings={tenantSettings}
          isSubmitting={saveBusinessMutation.isPending}
          onBack={back}
          onSubmit={handleBusinessSubmit}
        />
      ) : null}

      {stepId === "branch" ? (
        draft.createdBranchId && draft.branch ? (
          <StepBranchSummary branch={draft.branch} adminUserName={displayName} onContinue={next} onBack={back} />
        ) : (
          <StepBranch
            initialValues={draft.branch}
            tenantSettings={tenantSettings}
            adminUserId={userId ?? ""}
            adminUserName={displayName}
            isSubmitting={createBranchMutation.isPending}
            sameAsBusiness={sameAsBusiness}
            onToggleSameAsBusiness={setSameAsBusiness}
            onBack={back}
            onSubmit={handleBranchSubmit}
          />
        )
      ) : null}

      {stepId === "done" ? (
        <StepDone
          userFirstName={firstName}
          businessName={businessName}
          branchName={branchName}
          activeModules={countActiveModules(draft.modules)}
          onGoToDashboard={handleGoToDashboard}
        />
      ) : null}
    </OnboardingShell>
  )
}
