import { useState } from "react"
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { useTranslation } from "@/i18n/use-i18n"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "../hooks/use-customers"
import {
  getCustomerDisplayName,
  type CustomerResponseDto,
  IDENTIFICATION_TYPE_LABELS,
  IdentificationType,
} from "../types"
import { CustomerFormDialog } from "../components/customer-form-dialog"
import { DeleteConfirmDialog } from "../components/delete-confirm-dialog"
import type { CreateCustomerFormValues } from "../schemas/customer-schema"

export function CustomersCatalogPage() {
  const { t } = useTranslation("business-customers-catalog")
  const { isBusinessAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseDto | null>(null)

  const { data: customers, isLoading } = useCustomers(page, pageSize, search)
  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()
  const deleteCustomerMutation = useDeleteCustomer()

  const customerList = customers?.data ?? []
  const totalPages = customers?.totalPages ?? 1
  const totalCount = customers?.totalCount ?? 0

  const handleCreate = (values: CreateCustomerFormValues) => {
    createCustomerMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        identificationTypeId: values.identificationTypeId,
        identificationNumber: values.identificationNumber,
        phoneNumber: values.phoneNumber ?? null,
        emailAddress: values.emailAddress ?? null,
        address: values.address ?? null,
        city: values.city ?? null,
        department: values.department ?? null,
      },
      {
        onSuccess: () => {
          setFormOpen(false)
          notify.success(t("toast_created"))
        },
      }
    )
  }

  const handleEdit = (values: CreateCustomerFormValues) => {
    if (!selectedCustomer) return
    updateCustomerMutation.mutate(
      {
        id: selectedCustomer.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          identificationTypeId: values.identificationTypeId,
          identificationNumber: values.identificationNumber,
          phoneNumber: values.phoneNumber ?? null,
          emailAddress: values.emailAddress ?? null,
          address: values.address ?? null,
          city: values.city ?? null,
          department: values.department ?? null,
        },
      },
      {
        onSuccess: () => {
          setFormOpen(false)
          setSelectedCustomer(null)
          notify.success(t("toast_updated"))
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedCustomer) return
    deleteCustomerMutation.mutate(selectedCustomer.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelectedCustomer(null)
        notify.success(t("toast_deleted"))
      },
    })
  }

  const openEditDialog = (customer: CustomerResponseDto) => {
    setSelectedCustomer(customer)
    setFormOpen(true)
  }

  const openDeleteDialog = (customer: CustomerResponseDto) => {
    setSelectedCustomer(customer)
    setDeleteOpen(true)
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setSelectedCustomer(null)
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
    setSelectedCustomer(null)
  }

  const customerColumns: ColumnDef<CustomerResponseDto>[] = [
    {
      key: "fullName",
      header: t("full_name"),
      minWidth: "min-w-[180px]",
      render: (customer) => <p className="font-medium text-foreground">{getCustomerDisplayName(customer)}</p>,
    },
    {
      key: "documentType",
      header: t("document_type"),
      responsive: "md",
      minWidth: "min-w-[140px]",
      render: (customer) => (
        <span className="text-muted-foreground">
          {IDENTIFICATION_TYPE_LABELS[customer.identificationTypeId as IdentificationType] ?? "—"}
        </span>
      ),
    },
    {
      key: "documentNumber",
      header: t("document_number"),
      responsive: "md",
      minWidth: "min-w-[120px]",
      render: (customer) => <span className="text-muted-foreground">{customer.identificationNumber ?? "—"}</span>,
    },
    {
      key: "email",
      header: t("email"),
      responsive: "sm",
      minWidth: "min-w-[140px]",
      render: (customer) => <span className="text-muted-foreground">{customer.emailAddress ?? "—"}</span>,
    },
    {
      key: "phone",
      header: t("phone"),
      responsive: "sm",
      minWidth: "min-w-[100px]",
      render: (customer) => <span className="text-muted-foreground">{customer.phoneNumber ?? "—"}</span>,
    },
    {
      key: "city",
      header: t("city"),
      responsive: "lg",
      minWidth: "min-w-[100px]",
      render: (customer) => <span className="text-muted-foreground">{customer.city ?? "—"}</span>,
    },
    {
      key: "status",
      header: t("status"),
      responsive: "lg",
      minWidth: "min-w-[80px]",
      render: (customer) => (
        <Badge tone={customer.isActive ? "success" : "neutral"}>
          {customer.isActive ? t("active") : t("inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      minWidth: "min-w-[100px]",
      render: (customer) => (
        <div className="flex justify-end gap-1 sm:gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => openEditDialog(customer)}
            aria-label={t("edit_customer")}
          >
            <Pencil className="size-3.5 sm:size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="size-7 text-destructive sm:size-8"
            onClick={() => openDeleteDialog(customer)}
            aria-label={t("delete")}
          >
            <Trash2 className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card className="flex h-[calc(100vh-5.5rem)] flex-col gap-4 overflow-hidden px-4 py-4 pb-2 shadow-none sm:px-6 sm:pb-4 md:h-[calc(100vh-6.5rem)]">
      {/* Header - fixed, not scrollable */}
      <header className="relative flex shrink-0 flex-col gap-2">
        <Badge className="max-w-fit" tone="primary">
          {t("customers")}
        </Badge>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("customer_catalog")}</h1>
        <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("customer_catalog_desc")}</p>
        <Users
          color="#58626b"
          className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
        />
      </header>

      {/* Toolbar - fixed, not scrollable */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_customers")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        {isBusinessAdmin && (
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 size-4" />
            {t("new_customer")}
          </Button>
        )}
      </div>

      {/* Content - scrollable */}
      <div className="min-h-0 flex-1">
        <DataTable
          columns={customerColumns}
          data={customerList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          emptyIcon={Users}
          emptyMessage={t("no_customers")}
          labels={{
            previous: t("previous"),
            next: t("next"),
            selected: t("selected"),
            paginationTotal: (count) => t("pagination_total", { count }),
            noResults: (searchValue) => t("no_results_for_search", { search: searchValue }),
          }}
        />
      </div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={handleDialogClose}
        customerToEdit={selectedCustomer}
        onSubmit={selectedCustomer ? handleEdit : handleCreate}
        isSubmitting={createCustomerMutation.isPending || updateCustomerMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={handleDeleteClose}
        customerName={selectedCustomer ? getCustomerDisplayName(selectedCustomer) : ""}
        onConfirm={handleDelete}
        isPending={deleteCustomerMutation.isPending}
      />
    </Card>
  )
}
