import { useMemo, useState } from "react"
import { Plus, UserCheck, UserX, Users } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { useUsers, useCreateUser, useUpdateUser } from "../hooks/use-users"
import { getUserDisplayName, type UserResponseDto } from "../types"
import { buildUserColumns } from "../components/users-columns"
import { UserFormDialog } from "../components/user-form-dialog"
import { CredentialsDialog } from "../components/credentials-dialog"
import type { CreateUserFormValues } from "../schemas/user-schema"

const PAGE_SIZE = 20

export function UsersCatalogPage() {
  const { t } = useTranslation("business-users-catalog")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null)
  const [createdUser, setCreatedUser] = useState<UserResponseDto | null>(null)

  const { data: users, isLoading } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const userList = useMemo(() => users ?? [], [users])

  const filteredUsers = useMemo(() => {
    if (!search) return userList
    const term = search.toLowerCase()
    return userList.filter(
      (user) =>
        getUserDisplayName(user).toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.identificationNumber?.toLowerCase().includes(term)
    )
  }, [userList, search])

  const activeCount = filteredUsers.filter((user) => user.isActive).length
  const inactiveCount = filteredUsers.length - activeCount

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCreate = (values: CreateUserFormValues) => {
    createUserMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        identificationTypeId: values.identificationTypeId,
        identificationNumber: values.identificationNumber,
        phoneNumber: values.phoneNumber ?? null,
        email: values.email ?? null,
        role: values.role,
      },
      {
        onSuccess: (result) => {
          setFormOpen(false)
          setCreatedUser(result)
          setCredentialsOpen(true)
        },
      }
    )
  }

  const handleEdit = (values: CreateUserFormValues) => {
    if (!selectedUser) return
    updateUserMutation.mutate(
      {
        id: selectedUser.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber ?? null,
        },
      },
      {
        onSuccess: () => {
          setFormOpen(false)
          setSelectedUser(null)
        },
      }
    )
  }

  const openEditDialog = (user: UserResponseDto) => {
    setSelectedUser(user)
    setFormOpen(true)
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setSelectedUser(null)
  }

  const handleCredentialsClose = () => {
    setCredentialsOpen(false)
    setCreatedUser(null)
  }

  const columns = buildUserColumns(t, { onEdit: openEditDialog })

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/people", label: t("back_to_people") }}
        title={t("user_catalog")}
        description={t("user_catalog_desc")}
        stats={[
          { icon: Users, tone: "info", label: t("stats_total"), value: filteredUsers.length },
          { icon: UserCheck, tone: "success", label: t("stats_active"), value: activeCount },
          { icon: UserX, tone: "warning", label: t("stats_inactive"), value: inactiveCount },
        ]}
        toolbar={{
          search: { value: search, onChange: handleSearchChange, placeholder: t("search_users") },
          actions: (
            <Button onClick={() => setFormOpen(true)} className="relative shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              {t("new_user")}
            </Button>
          ),
        }}
      >
        <DataTable
          columns={columns}
          data={visibleUsers}
          isLoading={isLoading}
          page={safePage}
          totalPages={totalPages}
          totalCount={filteredUsers.length}
          onPageChange={setPage}
          skeletonRows={6}
          emptyState={{
            icon: Users,
            title: search ? t("search_title") : t("empty_title"),
            description: search ? t("search_desc") : t("empty_desc"),
            action: search ? null : (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" />
                {t("new_user")}
              </Button>
            ),
          }}
          labels={{
            paginationTotal: (count) => t("list_total", { total: count }),
            paginationProgress: (count, total) => t("list_progress", { count, total }),
          }}
        />
      </EntityListLayout>

      <UserFormDialog
        open={formOpen}
        onOpenChange={handleDialogClose}
        userToEdit={selectedUser}
        onSubmit={selectedUser ? handleEdit : handleCreate}
        isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
      />

      <CredentialsDialog
        open={credentialsOpen}
        onOpenChange={handleCredentialsClose}
        user={createdUser}
        onGoToList={handleCredentialsClose}
      />
    </>
  )
}
