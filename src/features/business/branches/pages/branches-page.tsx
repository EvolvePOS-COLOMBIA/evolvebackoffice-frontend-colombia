import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, CircleEllipsis, MonitorCog, Pencil, Plus, Power, RefreshCw, Search, Settings2 } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BranchFormDialog } from "@/features/business/branches/components/branch-form-dialog"
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

type PendingAction = "activate" | "deactivate"

export function BranchesPage() {
  const { t } = useTranslation("business-branches")
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [pendingAction, setPendingAction] = useState<{ branch: Branch; type: PendingAction } | null>(null)

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

  useEffect(() => {
    setPage(1)
  }, [deferredSearch])

  const branches = pagedData?.data ?? []
  const totalCount = pagedData?.totalCount ?? 0
  const totalPages = pagedData?.totalPages ?? 1
  const activeOnPage = branches.filter((branch) => branch.isActive).length
  const inactiveOnPage = branches.length - activeOnPage
  const isMutating =
    createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending || activateMutation.isPending

  const toPayload = (values: BranchFormValues): CreateBranchDto => ({
    name: values.name,
    adminUserId: values.adminUserId || null,
    identification: values.identification || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
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
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/80 bg-card/70 shadow-none">
        <CardHeader className="relative overflow-hidden border-b border-border/70 px-5 pt-6 pb-5 sm:px-7 sm:pt-7">
          <div className="pointer-events-none absolute -top-16 -right-14 size-64 rounded-full border border-primary/10 bg-primary/[0.035]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="relative space-y-3">
              <Badge tone="primary" className="w-fit text-[10px] tracking-[0.18em] uppercase">
                {t("eyebrow")}
              </Badge>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-semibold tracking-tight text-balance text-foreground">
                  {t("page_title")}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t("page_desc")}
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreate} disabled={isMutating} className="relative shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </div>
        </CardHeader>

        <div className="grid grid-cols-2 gap-3 border-b border-border/70 bg-muted/20 p-4 sm:grid-cols-4 sm:p-5">
          <SummaryTile label={t("total_branches")} value={totalCount} loading={isLoading} />
          <SummaryTile label={t("active_on_page")} value={activeOnPage} loading={isLoading} />
          <SummaryTile label={t("inactive_on_page")} value={inactiveOnPage} loading={isLoading} muted />
          <SummaryTile label={t("showing_on_page")} value={branches.length} loading={isLoading} muted />
        </div>

        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("search_placeholder")}
                className="pl-9"
              />
            </div>
            <Badge tone="neutral" className="w-fit rounded-full px-3 py-1 text-xs">
              {t("results", { count: totalCount })}
            </Badge>
          </div>

          {isLoading ? (
            <BranchesSkeleton />
          ) : branches.length === 0 ? (
            <EmptyState hasSearch={Boolean(deferredSearch)} onCreate={openCreate} t={t} />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border/70 xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("branch_label")}</TableHead>
                      <TableHead>{t("contact_label")}</TableHead>
                      <TableHead>{t("admin_label")}</TableHead>
                      <TableHead>{t("status_label")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id} className="group transition-colors hover:bg-muted/40">
                        <TableCell>
                          <BranchIdentity branch={branch} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="space-y-1">
                            <p>{branch.email || branch.phone || "—"}</p>
                            {branch.address ? <p className="max-w-64 truncate text-xs">{branch.address}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{branch.adminUserName || "—"}</TableCell>
                        <TableCell>
                          <BranchStatus active={branch.isActive} t={t} />
                        </TableCell>
                        <TableCell className="text-right">
                          <BranchActions
                            branch={branch}
                            disabled={isMutating}
                            onEdit={openEdit}
                            onNavigate={navigate}
                            onRequestAction={(target, type) => setPendingAction({ branch: target, type })}
                            t={t}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {branches.map((branch) => (
                  <Card
                    key={branch.id}
                    className="rounded-[24px] border-border/70 bg-background/45 shadow-none transition-colors hover:border-primary/25"
                  >
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <BranchIdentity branch={branch} />
                        <BranchStatus active={branch.isActive} t={t} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Meta label={t("contact_label")} value={branch.email || branch.phone || "—"} />
                        <Meta label={t("admin_label")} value={branch.adminUserName || "—"} />
                        {branch.address ? <Meta label={t("address_label")} value={branch.address} /> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(branch)}
                          disabled={isMutating}
                        >
                          <Pencil className="size-4" />
                          {t("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/business/branches/${branch.id}/config`)}
                        >
                          <Settings2 className="size-4" />
                          {t("configure")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/business/branches/${branch.id}/settings/terminals`)}
                        >
                          <MonitorCog className="size-4" />
                          {t("terminals")}
                        </Button>
                        <Button
                          type="button"
                          variant={branch.isActive ? "destructive" : "outline"}
                          size="sm"
                          onClick={() =>
                            setPendingAction({ branch, type: branch.isActive ? "deactivate" : "activate" })
                          }
                          disabled={isMutating}
                        >
                          <Power className="size-4" />
                          {branch.isActive ? t("deactivate") : t("activate")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("page_info", { page, totalPages })}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                {t("next")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

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
    </div>
  )
}

function BranchIdentity({ branch }: { branch: Branch }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/5">
        <Building2 className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground group-hover:text-primary">{branch.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{branch.identification || "—"}</p>
      </div>
    </div>
  )
}

function BranchStatus({ active, t }: { active: boolean; t: (key: string) => string }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? t("status_active") : t("status_inactive")}</Badge>
}

function BranchActions({
  branch,
  disabled,
  onEdit,
  onNavigate,
  onRequestAction,
  t,
}: {
  branch: Branch
  disabled: boolean
  onEdit: (branch: Branch) => void
  onNavigate: (path: string) => void
  onRequestAction: (branch: Branch, type: PendingAction) => void
  t: (key: string) => string
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(branch)} disabled={disabled}>
        <Pencil className="size-4" />
        {t("edit")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="icon-sm" aria-label={t("more_actions")} disabled={disabled}>
            <CircleEllipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => onNavigate(`/business/branches/${branch.id}/config`)}>
            <Settings2 className="size-4" />
            {t("configure")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onNavigate(`/business/branches/${branch.id}/settings/terminals`)}>
            <MonitorCog className="size-4" />
            {t("terminals")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={branch.isActive ? "destructive" : "default"}
            onSelect={() => onRequestAction(branch, branch.isActive ? "deactivate" : "activate")}
          >
            <Power className="size-4" />
            {branch.isActive ? t("deactivate") : t("activate")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  loading,
  muted = false,
}: {
  label: string
  value: number
  loading: boolean
  muted?: boolean
}) {
  return (
    <Card className="max-h-min rounded-2xl border-border/70 bg-background/45 shadow-none">
      <CardContent className="p-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-12" />
        ) : (
          <p
            className={
              "mt-2 text-2xl font-semibold tracking-tight " + (muted ? "text-muted-foreground" : "text-foreground")
            }
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function EmptyState({
  hasSearch,
  onCreate,
  t,
}: {
  hasSearch: boolean
  onCreate: () => void
  t: (key: string) => string
}) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
        {hasSearch ? <Search className="size-6" /> : <Building2 className="size-6" />}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        {hasSearch ? t("empty_search_title") : t("empty_title")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{hasSearch ? t("empty_search_desc") : t("empty_desc")}</p>
      {!hasSearch ? (
        <Button onClick={onCreate} className="mt-5">
          <Plus className="size-4" />
          {t("create")}
        </Button>
      ) : null}
    </Card>
  )
}

function BranchesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}
