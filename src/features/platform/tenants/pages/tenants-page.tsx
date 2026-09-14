import { useMemo, useState } from "react"
import { Building2, Eye, Plus, SquarePen, CheckCircle, XCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { AlertDeleteDialog } from "@/components/alert-delete-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TenantFormDialog } from "@/features/platform/tenants/components/tenant-form-dialog"
import { useTenants, useUpdateTenant, useActivateTenant, useDeactivateTenant, useDeleteTenant, useApproveTenant, useRejectTenant } from "@/features/platform/tenants/hooks/use-tenants"
import type { Tenant, TenantFormValues } from "@/features/platform/tenants/types"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

const PAGE_SIZE = 20

export function TenantsPage() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [tenantToReject, setTenantToReject] = useState<Tenant | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation("platform-tenants")
  const { session, isPlatformAdmin, isPlatformSupervisor } = useAuth()
  const token = session?.accessToken

  const { data: pagedData, isLoading } = useTenants(page, PAGE_SIZE)
  const updateTenantMutation = useUpdateTenant()
  const activateTenantMutation = useActivateTenant()
  const deactivateTenantMutation = useDeactivateTenant()
  const deleteTenantMutation = useDeleteTenant()
  const approveTenantMutation = useApproveTenant()
  const rejectTenantMutation = useRejectTenant()

  const tenants = pagedData?.data ?? []
  const totalCount = pagedData?.totalCount ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  const filteredTenants = useMemo(() => {
    const source = pagedData?.data ?? []
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return source
    }

    return source.filter((tenant) => {
      return (
        tenant.name.toLowerCase().includes(normalizedQuery) ||
        tenant.tenantId.toLowerCase().includes(normalizedQuery) ||
        tenant.contactEmail.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [pagedData?.data, query])

  const activeTenants = tenants.filter((tenant) => tenant.isActive).length

  const handleSubmit = (values: TenantFormValues) => {
    if (selectedTenant && token) {
      updateTenantMutation.mutate(
        { id: selectedTenant.id, values, token },
        {
          onSuccess: () => {
            notify.success(t("tenant_updated"))
            setIsDialogOpen(false)
            setSelectedTenant(null)
          },
          onError: (error) => {
            notify.error(error instanceof Error ? error.message : t("unable_to_save"))
          },
        }
      )
    }
  }

  const handleToggleActive = (tenant: Tenant) => {
    if (tenant.isActive) {
      deactivateTenantMutation.mutate(tenant.id, {
        onSuccess: () => notify.success(t("tenant_deactivated")),
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      })
    } else {
      activateTenantMutation.mutate(tenant.id, {
        onSuccess: () => notify.success(t("tenant_activated")),
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      })
    }
  }

  const handleDelete = (tenant: Tenant) => {
    deleteTenantMutation.mutate(tenant.id, {
      onSuccess: () => notify.success(t("tenant_deleted")),
      onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_delete")),
    })
  }

  const handleApprove = (tenant: Tenant) => {
    approveTenantMutation.mutate(tenant.id, {
      onSuccess: (result) => {
        notify.success(t("tenant_approved"))
        if (result.adminTemporaryPassword) {
          notify.info(`${t("admin_credentials")}: ${result.adminUsername} / ${result.adminTemporaryPassword}`)
        }
      },
      onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
    })
  }

  const handleReject = () => {
    if (!tenantToReject || !rejectReason) return
    rejectTenantMutation.mutate(
      { tenantId: tenantToReject.id, reason: rejectReason },
      {
        onSuccess: () => {
          notify.success(t("tenant_rejected"))
          setRejectDialogOpen(false)
          setRejectReason("")
          setTenantToReject(null)
        },
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      }
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge tone="success">{t("status_active")}</Badge>
      case "Pending":
        return <Badge tone="warning">{t("status_pending")}</Badge>
      case "Rejected":
        return <Badge tone="danger">{t("status_rejected")}</Badge>
      case "Inactive":
        return <Badge tone="neutral">{t("status_inactive")}</Badge>
      default:
        return <Badge tone="neutral">{status}</Badge>
    }
  }

  const canWrite = isPlatformAdmin && !isPlatformSupervisor

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("tenant_management")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("create_maintain_tenants")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("search_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label={t("total_tenants")} value={totalCount} />
            <SummaryTile label={t("active_tenants")} value={activeTenants} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("tenants")}</CardTitle>
              <CardDescription>{t("search_tenants_placeholder")}</CardDescription>
            </div>
            <Button
              onClick={() => {
                navigate("/platform/tenants/create")
              }}
            >
              <Plus className="size-4" />
              {t("create_tenant")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search_tenants")}
              />
            </div>
            <Badge tone="neutral" className="w-fit">
              {filteredTenants.length} {t("results")}
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">{t("loading")}</div>
            </div>
          ) : (
            <>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("tenant_id")}</TableHead>
                      <TableHead>{t("contact_email")}</TableHead>
                      <TableHead>{t("phone")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("created")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell className="text-muted-foreground">{tenant.tenantId}</TableCell>
                        <TableCell className="text-muted-foreground">{tenant.contactEmail}</TableCell>
                        <TableCell className="text-muted-foreground">{tenant.phone}</TableCell>
                        <TableCell>
                          {getStatusBadge(tenant.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(tenant.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {tenant.status === "Pending" && isPlatformAdmin && (
                              <>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(tenant)}
                                  disabled={approveTenantMutation.isPending}
                                >
                                  <CheckCircle className="size-4" />
                                  {t("approve")}
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setTenantToReject(tenant)
                                    setRejectDialogOpen(true)
                                  }}
                                >
                                  <XCircle className="size-4" />
                                  {t("reject")}
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                            >
                              <Eye className="size-4" />
                              {t("view_detail")}
                            </Button>
                            {canWrite && tenant.status !== "Pending" && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTenant(tenant)
                                    setIsDialogOpen(true)
                                  }}
                                >
                                  <SquarePen className="size-4" />
                                  {t("edit")}
                                </Button>
                                <Button
                                  type="button"
                                  variant={tenant.isActive ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleToggleActive(tenant)}
                                  disabled={activateTenantMutation.isPending || deactivateTenantMutation.isPending}
                                >
                                  {tenant.isActive ? t("deactivate") : t("activate")}
                                </Button>
                                <AlertDeleteDialog
                                  title={t("delete_tenant")}
                                  selectedLabel={tenant.name}
                                  onDelete={() => handleDelete(tenant)}
                                />
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {filteredTenants.map((tenant) => (
                  <Card key={tenant.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{tenant.name}</h3>
                            <Badge tone={tenant.isActive ? "success" : "warning"}>
                              {tenant.isActive ? t("active") : t("inactive")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tenant.tenantId}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                          >
                            <Eye className="size-4" />
                            {t("view_detail")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTenant(tenant)
                              setIsDialogOpen(true)
                            }}
                          >
                            <SquarePen className="size-4" />
                            {t("edit")}
                          </Button>
                          <Button
                            type="button"
                            variant={tenant.isActive ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleToggleActive(tenant)}
                            disabled={activateTenantMutation.isPending || deactivateTenantMutation.isPending}
                          >
                            {tenant.isActive ? t("deactivate") : t("activate")}
                          </Button>
                          <AlertDeleteDialog
                            title={t("delete_tenant")}
                            selectedLabel={tenant.name}
                            onDelete={() => handleDelete(tenant)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <CompactMeta label={t("contact_email")} value={tenant.contactEmail} />
                        <CompactMeta label={t("phone")} value={tenant.phone} />
                        <CompactMeta label={t("created")} value={formatDateTime(tenant.createdAt)} />
                        <CompactMeta label={t("tenant_id")} value={tenant.tenantId} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {filteredTenants.length === 0 && !isLoading ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Building2 className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{t("no_tenants_found")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("try_different_search")}</p>
            </Card>
          ) : null}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("page_info", { page, totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                {t("next")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <TenantFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setSelectedTenant(null)
          }
        }}
        tenantToEdit={selectedTenant}
        onSubmit={handleSubmit}
        isSubmitting={updateTenantMutation.isPending}
      />

      {/* Reject Tenant Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject_tenant")}</DialogTitle>
            <DialogDescription>
              {t("reject_tenant_desc", { name: tenantToReject?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">{t("rejection_reason")}</Label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder={t("rejection_reason_placeholder")}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectTenantMutation.isPending}
            >
              {rejectTenantMutation.isPending ? t("rejecting") : t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function CompactMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
