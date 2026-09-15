import { useState } from "react"
import { Users, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/use-i18n"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "../hooks/use-customers"
import { getCustomerDisplayName, type CustomerResponseDto } from "../types"
import { CustomersTable } from "../components/customers-table"
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

  const customerList = customers ?? []

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

  const totalPages = Math.max(1, Math.ceil(customerList.length / pageSize))

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {t("customers")}
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("customer_catalog")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("customer_catalog_desc")}</p>
          <Users
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : (
            <CustomersTable customers={customerList} onEdit={openEditDialog} onDelete={openDeleteDialog} />
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("page")} {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("previous")}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("next")}
              </Button>
            </div>
          </div>
        )}

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
      </CardContent>
    </Card>
  )
}
