import { useMemo, useState } from "react"
import { Plus, UserCheck, UserX, Users } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { useCustomers, useCreateCustomer, useUpdateCustomer, useToggleCustomerActive } from "../hooks/use-customers"
import { buildCustomerColumns } from "../components/customers-columns"
import { CustomerFormDialog } from "../components/customer-form-dialog"
import { CreditDialog } from "../../credit/components/credit-dialog"
import type { CreateCustomerFormValues } from "../schemas/customer-schema"
import type { CustomerResponseDto } from "../types"

const PAGE_SIZE = 20

export function CustomersPage() {
  const { t } = useTranslation("business-customers")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseDto | null>(null)
  const [creditCustomer, setCreditCustomer] = useState<CustomerResponseDto | null>(null)

  const { data, isLoading } = useCustomers()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const toggleActiveMutation = useToggleCustomerActive()

  const customers = useMemo(() => data?.items ?? [], [data])
  const totalCount = data?.totalCount ?? 0

  const filteredCustomers = useMemo(() => {
    if (!search) return customers
    const term = search.toLowerCase()
    return customers.filter((customer) => {
      return (
        [customer.firstName, customer.lastName].filter(Boolean).join(" ").toLowerCase().includes(term) ||
        customer.emailAddress?.toLowerCase().includes(term) ||
        customer.identificationNumber?.toLowerCase().includes(term) ||
        customer.city?.toLowerCase().includes(term) ||
        customer.phoneNumber?.toLowerCase().includes(term)
      )
    })
  }, [customers, search])

  const activeCount = filteredCustomers.filter((customer) => customer.isActive).length
  const inactiveCount = filteredCustomers.length - activeCount

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleCustomers = filteredCustomers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCreate = (values: CreateCustomerFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setFormOpen(false)
        notify.success(t("customer_created"))
      },
      onError: (error) => notify.error(getErrorMessage(error)),
    })
  }

  const handleEdit = (values: CreateCustomerFormValues) => {
    if (!selectedCustomer) return
    updateMutation.mutate(
      { id: selectedCustomer.id, payload: values },
      {
        onSuccess: () => {
          setFormOpen(false)
          setSelectedCustomer(null)
          notify.success(t("customer_updated"))
        },
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  const handleToggleActive = (customer: CustomerResponseDto) => {
    toggleActiveMutation.mutate(
      { id: customer.id, active: !customer.isActive },
      {
        onSuccess: () => notify.success(t("customer_status_updated")),
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  const openCreateDialog = () => {
    setSelectedCustomer(null)
    setFormOpen(true)
  }

  const openEditDialog = (customer: CustomerResponseDto) => {
    setSelectedCustomer(customer)
    setFormOpen(true)
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setSelectedCustomer(null)
  }

  const columns = buildCustomerColumns(t, {
    onEdit: openEditDialog,
    onToggleActive: handleToggleActive,
    onCredit: setCreditCustomer,
  })

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/people", label: t("back_to_people") }}
        title={t("customer_catalog")}
        description={t("customer_catalog_desc")}
        stats={[
          { icon: Users, tone: "info", label: t("stats_total"), value: totalCount },
          { icon: UserCheck, tone: "success", label: t("stats_active"), value: activeCount },
          { icon: UserX, tone: "warning", label: t("stats_inactive"), value: inactiveCount },
        ]}
        toolbar={{
          search: { value: search, onChange: handleSearchChange, placeholder: t("search_customers") },
          actions: (
            <Button onClick={openCreateDialog} className="relative shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              {t("new_customer")}
            </Button>
          ),
        }}
      >
        <DataTable
          columns={columns}
          data={visibleCustomers}
          isLoading={isLoading}
          page={safePage}
          totalPages={totalPages}
          totalCount={filteredCustomers.length}
          onPageChange={setPage}
          skeletonRows={6}
          emptyState={{
            icon: Users,
            title: search ? t("search_title") : t("empty_title"),
            description: search ? t("search_desc") : t("empty_desc"),
            action: search ? null : (
              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                {t("new_customer")}
              </Button>
            ),
          }}
          labels={{
            paginationTotal: (count) => t("list_total", { total: count }),
            paginationProgress: (count, total) => t("list_progress", { count, total }),
          }}
        />
      </EntityListLayout>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={handleDialogClose}
        customerToEdit={selectedCustomer}
        onSubmit={selectedCustomer ? handleEdit : handleCreate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <CreditDialog
        open={creditCustomer != null}
        onOpenChange={(open) => {
          if (!open) setCreditCustomer(null)
        }}
        personId={creditCustomer?.personPublicId ?? null}
        personName={creditCustomer ? [creditCustomer.firstName, creditCustomer.lastName].filter(Boolean).join(" ") : ""}
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
