import { useMemo, useState } from "react"
import { Plus, Truck, UserCheck, UserX } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useToggleSupplierActive } from "../hooks/use-suppliers"
import { buildSupplierColumns } from "../components/suppliers-columns"
import { SupplierFormDialog } from "../components/supplier-form-dialog"
import type { CreateSupplierFormValues } from "../schemas/supplier-schema"
import type { SupplierResponseDto } from "../types"

const PAGE_SIZE = 20

export function SuppliersPage() {
  const { t } = useTranslation("business-suppliers")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponseDto | null>(null)

  const { data, isLoading } = useSuppliers()
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const toggleActiveMutation = useToggleSupplierActive()

  const suppliers = useMemo(() => data?.items ?? [], [data])
  const totalCount = data?.totalCount ?? suppliers.length

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers
    const term = search.toLowerCase()
    return suppliers.filter((supplier) => {
      return (
        supplier.company?.toLowerCase().includes(term) ||
        [supplier.firstName, supplier.lastName].filter(Boolean).join(" ").toLowerCase().includes(term) ||
        supplier.emailAddress?.toLowerCase().includes(term) ||
        supplier.identificationNumber?.toLowerCase().includes(term) ||
        supplier.code?.toLowerCase().includes(term) ||
        supplier.phoneNumber?.toLowerCase().includes(term)
      )
    })
  }, [suppliers, search])

  const activeCount = filteredSuppliers.filter((supplier) => !supplier.inactive).length
  const inactiveCount = filteredSuppliers.length - activeCount

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleSuppliers = filteredSuppliers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCreate = (values: CreateSupplierFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setFormOpen(false)
        notify.success(t("supplier_created"))
      },
      onError: (error) => notify.error(getErrorMessage(error)),
    })
  }

  const handleEdit = (values: CreateSupplierFormValues) => {
    if (!selectedSupplier) return
    updateMutation.mutate(
      { id: selectedSupplier.id, payload: values },
      {
        onSuccess: () => {
          setFormOpen(false)
          setSelectedSupplier(null)
          notify.success(t("supplier_updated"))
        },
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  const handleToggleActive = (supplier: SupplierResponseDto) => {
    toggleActiveMutation.mutate(
      { id: supplier.id, active: supplier.inactive },
      {
        onSuccess: () => notify.success(t("supplier_status_updated")),
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  const openCreateDialog = () => {
    setSelectedSupplier(null)
    setFormOpen(true)
  }

  const openEditDialog = (supplier: SupplierResponseDto) => {
    setSelectedSupplier(supplier)
    setFormOpen(true)
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setSelectedSupplier(null)
  }

  const columns = buildSupplierColumns(t, { onEdit: openEditDialog, onToggleActive: handleToggleActive })

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/people", label: t("back_to_people") }}
        title={t("supplier_catalog")}
        description={t("supplier_catalog_desc")}
        stats={[
          { icon: Truck, tone: "info", label: t("stats_total"), value: totalCount },
          { icon: UserCheck, tone: "success", label: t("stats_active"), value: activeCount },
          { icon: UserX, tone: "warning", label: t("stats_inactive"), value: inactiveCount },
        ]}
        toolbar={{
          search: { value: search, onChange: handleSearchChange, placeholder: t("search_suppliers") },
          actions: (
            <Button onClick={openCreateDialog} className="relative shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              {t("new_supplier")}
            </Button>
          ),
        }}
      >
        <DataTable
          columns={columns}
          data={visibleSuppliers}
          isLoading={isLoading}
          page={safePage}
          totalPages={totalPages}
          totalCount={filteredSuppliers.length}
          onPageChange={setPage}
          skeletonRows={6}
          emptyState={{
            icon: Truck,
            title: search ? t("search_title") : t("empty_title"),
            description: search ? t("search_desc") : t("empty_desc"),
            action: search ? null : (
              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                {t("new_supplier")}
              </Button>
            ),
          }}
          labels={{ paginationTotal: (count) => t("list_total", { total: count }) }}
        />
      </EntityListLayout>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={handleDialogClose}
        supplierToEdit={selectedSupplier}
        onSubmit={selectedSupplier ? handleEdit : handleCreate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  )
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response
    return response?.data?.message ?? response?.data?.title ?? "Error"
  }
  return "Error"
}
