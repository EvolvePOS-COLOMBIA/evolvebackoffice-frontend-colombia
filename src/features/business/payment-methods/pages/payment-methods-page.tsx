import { useMemo, useState } from "react"
import { CreditCard, Plus, RotateCcw, UserCheck, UserX } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import {
  useAllPaymentMethods,
  useCreatePaymentMethod,
  useRestoreCountryDefaults,
  useSetActivePaymentMethod,
  useUpdatePaymentMethod,
} from "../hooks/use-payment-methods"
import { buildPaymentMethodColumns } from "../components/payment-methods-columns"
import { PaymentMethodFormDialog } from "../components/payment-method-form-dialog"
import { PendingAuthorizationsSection } from "../components/pending-authorizations-section"
import type { PaymentMethodResponseDto } from "../types"

const PAGE_SIZE = 20

export function PaymentMethodsPage() {
  const { t } = useTranslation("business-payment-methods")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodResponseDto | null>(null)

  const { data: methods, isLoading } = useAllPaymentMethods()
  const createMutation = useCreatePaymentMethod()
  const updateMutation = useUpdatePaymentMethod()
  const toggleMutation = useSetActivePaymentMethod()
  const restoreMutation = useRestoreCountryDefaults()

  const list = useMemo(() => methods ?? [], [methods])

  const filtered = useMemo(() => {
    if (!search) return list
    const term = search.toLowerCase()
    return list.filter((m) => m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term))
  }, [list, search])

  const activeCount = filtered.filter((m) => m.isActive).length
  const inactiveCount = filtered.length - activeCount

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleMethods = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCreate = (values: Parameters<typeof createMutation.mutate>[0]) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setFormOpen(false)
        notify.success(t("method_created"))
      },
      onError: (error) => notify.error(getErrorMessage(error)),
    })
  }

  const handleEdit = (values: Parameters<typeof updateMutation.mutate>[0]["payload"]) => {
    if (!selectedMethod) return
    updateMutation.mutate(
      { id: selectedMethod.id, payload: values },
      {
        onSuccess: () => {
          setFormOpen(false)
          setSelectedMethod(null)
          notify.success(t("method_updated"))
        },
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  const handleToggleActive = (method: PaymentMethodResponseDto) => {
    toggleMutation.mutate(
      { id: method.id, active: !method.isActive },
      {
        onSuccess: () => notify.success(t("method_status_updated")),
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  const handleRestoreDefaults = () => {
    if (!window.confirm(t("restore_confirm"))) return
    restoreMutation.mutate(undefined, {
      onSuccess: (result) => notify.success(t("restored", { count: result.inserted })),
      onError: (error) => notify.error(getErrorMessage(error)),
    })
  }

  const openCreateDialog = () => {
    setSelectedMethod(null)
    setFormOpen(true)
  }

  const openEditDialog = (method: PaymentMethodResponseDto) => {
    setSelectedMethod(method)
    setFormOpen(true)
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setSelectedMethod(null)
  }

  const columns = buildPaymentMethodColumns(t, { onEdit: openEditDialog, onToggleActive: handleToggleActive })

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/settings", label: t("back_to_settings") }}
        title={t("catalog")}
        description={t("catalog_desc")}
        stats={[
          { icon: CreditCard, tone: "info", label: t("stats_total"), value: filtered.length },
          { icon: UserCheck, tone: "success", label: t("stats_active"), value: activeCount },
          { icon: UserX, tone: "warning", label: t("stats_inactive"), value: inactiveCount },
        ]}
        toolbar={{
          search: { value: search, onChange: handleSearchChange, placeholder: t("search_methods") },
          actions: (
            <>
              <Button variant="outline" onClick={handleRestoreDefaults} disabled={restoreMutation.isPending}>
                <RotateCcw className="size-4" />
                {t("restore_defaults")}
              </Button>
              <Button onClick={openCreateDialog} className="relative shadow-sm shadow-primary/20">
                <Plus className="size-4" />
                {t("new_method")}
              </Button>
            </>
          ),
        }}
      >
        <DataTable
          columns={columns}
          data={visibleMethods}
          isLoading={isLoading}
          page={safePage}
          totalPages={totalPages}
          totalCount={filtered.length}
          onPageChange={setPage}
          skeletonRows={6}
          emptyState={{
            icon: CreditCard,
            title: search ? t("search_title") : t("empty_title"),
            description: search ? t("search_desc") : t("empty_desc"),
            action: search ? null : (
              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                {t("new_method")}
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
        <div className="shrink-0">
          <PendingAuthorizationsSection />
        </div>
      </EntityListLayout>

      <PaymentMethodFormDialog
        open={formOpen}
        onOpenChange={handleDialogClose}
        methodToEdit={selectedMethod}
        onSubmit={selectedMethod ? handleEdit : handleCreate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  )
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string; title?: string } } }).response
    return response?.data?.error ?? response?.data?.message ?? response?.data?.title ?? "Error"
  }
  return "Error"
}
