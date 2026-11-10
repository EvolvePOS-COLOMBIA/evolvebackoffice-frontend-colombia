import { useDeferredValue, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, CheckCircle2, Plus, RefreshCw, XCircle } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { BranchFormDialog } from "@/features/business/branches/components/branch-form-dialog"
import { buildBranchColumns, type BranchPendingAction } from "@/features/business/branches/components/branches-columns"
import {
  useActivateBranch,
  useBranches,
  useCreateBranch,
  useDeactivateBranch,
  useUpdateBranch,
} from "@/features/business/branches/hooks/use-branches"
import type { Branch, BranchFormValues } from "@/features/business/branches/types"
import type { CreateBranchDto, UpdateBranchDto } from "@/features/business/branches/types/api"
import { useUsers } from "@/features/business/people/users/hooks/use-users"
import { useTranslation } from "@/i18n/use-i18n"
import { notify } from "@/hooks/use-notify"

const PAGE_SIZE = 10

export function BranchesPage() {
  const { t } = useTranslation("business-branches")
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [pendingAction, setPendingAction] = useState<{ branch: Branch; type: BranchPendingAction } | null>(null)

  const listOptions = useMemo(
    () => (deferredSearch ? { searchField: "name", searchValue: deferredSearch } : {}),
    [deferredSearch]
  )
  const { data: pagedData, isLoading, isError, refetch } = useBranches(page, PAGE_SIZE, listOptions)
  const { data: users = [], isLoading: isUsersLoading } = useUsers()
  const createMutation = useCreateBranch()
  const updateMutation = useUpdateBranch()
  const deactivateMutation = useDeactivateBranch()
  const activateMutation = useActivateBranch()

  const branches = pagedData?.data ?? []
  const totalCount = pagedData?.totalCount ?? 0
  const totalPages = pagedData?.totalPages ?? 1
  const activeOnPage = branches.filter((branch) => branch.isActive).length
  const inactiveOnPage = branches.length - activeOnPage
  const isMutating =
    createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending || activateMutation.isPending

  /** Convierte una coordenada del formulario a número; vacío → null (opcional en el backend). */
  const toCoordinate = (value: string): number | null => {
    const trimmed = value.trim()
    return trimmed === "" ? null : Number(trimmed)
  }

  const toPayload = (values: BranchFormValues): CreateBranchDto => ({
    name: values.name,
    adminUserId: values.adminUserId || null,
    identification: values.identification || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
    latitude: toCoordinate(values.latitude),
    longitude: toCoordinate(values.longitude),
    isSupplier: values.isSupplier,
  })

  const handleCreate = (values: BranchFormValues) => {
    createMutation.mutate(toPayload(values), {
      onSuccess: () => {
        notify.success(t("created_success"))
        setFormOpen(false)
      },
      onError: (error) => notify.error(error instanceof Error ? error.message : t("save_error")),
    })
  }

  const handleEdit = (values: BranchFormValues) => {
    if (!selectedBranch) return

    const payload: UpdateBranchDto = toPayload(values)
    updateMutation.mutate(
      { id: selectedBranch.id, payload },
      {
        onSuccess: () => {
          notify.success(t("updated_success"))
          closeForm()
        },
        onError: (error) => notify.error(error instanceof Error ? error.message : t("save_error")),
      }
    )
  }

  const handleAction = () => {
    if (!pendingAction) return

    const { branch, type } = pendingAction
    const mutation = type === "activate" ? activateMutation : deactivateMutation
    mutation.mutate(branch.id, {
      onSuccess: () => {
        notify.success(type === "activate" ? t("activated_success") : t("deactivated_success"))
        setPendingAction(null)
      },
      onError: (error) => notify.error(error instanceof Error ? error.message : t("action_error")),
    })
  }

  const openCreate = () => {
    setSelectedBranch(null)
    setFormOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setSelectedBranch(branch)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setSelectedBranch(null)
  }

  const columns = buildBranchColumns(t, {
    isMutating,
    onEdit: openEdit,
    onNavigate: navigate,
    onRequestAction: (branch, type) => setPendingAction({ branch, type }),
  })

  if (isError && !isLoading) {
    return (
      <ErrorState
        eyebrow={t("eyebrow")}
        title={t("error_load_title")}
        description={t("error_load_desc")}
        action={
          <Button onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
        }
      />
    )
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/settings", label: t("back_to_settings") }}
        title={t("page_title")}
        description={t("page_desc")}
        stats={[
          { icon: Building2, tone: "info", label: t("total_branches"), value: totalCount },
          { icon: CheckCircle2, tone: "success", label: t("active_on_page"), value: activeOnPage },
          { icon: XCircle, tone: "warning", label: t("inactive_on_page"), value: inactiveOnPage },
        ]}
        toolbar={{
          search: { value: search, onChange: setSearch, placeholder: t("search_placeholder") },
          actions: (
            <Button onClick={openCreate} disabled={isMutating} className="relative shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              {t("create")}
            </Button>
          ),
        }}
      >
        <DataTable
          columns={columns}
          data={branches}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          skeletonRows={5}
          emptyState={{
            icon: Building2,
            title: deferredSearch ? t("empty_search_title") : t("empty_title"),
            description: deferredSearch ? t("empty_search_desc") : t("empty_desc"),
            action: deferredSearch ? null : (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                {t("create")}
              </Button>
            ),
          }}
          labels={{
            previous: t("previous"),
            next: t("next"),
            paginationTotal: (count) => t("list_total", { total: count }),
            paginationProgress: (count, total) => t("list_progress", { count, total }),
          }}
        />
      </EntityListLayout>

      <BranchFormDialog
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}
        branchToEdit={selectedBranch}
        users={users}
        isUsersLoading={isUsersLoading}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={selectedBranch ? handleEdit : handleCreate}
      />

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "activate" ? t("activate_confirm_title") : t("deactivate_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "activate"
                ? t("activate_confirm_desc", { name: pendingAction?.branch.name })
                : t("deactivate_confirm_desc", { name: pendingAction?.branch.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={pendingAction?.type === "activate" ? "default" : "destructive"}
              disabled={isMutating}
              onClick={handleAction}
            >
              {pendingAction?.type === "activate" ? t("activate") : t("deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
