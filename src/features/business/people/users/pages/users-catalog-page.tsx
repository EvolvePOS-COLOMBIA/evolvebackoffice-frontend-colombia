import { useState } from "react"
import { Users, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/use-i18n"
import { useUsers, useCreateUser, useUpdateUser } from "../hooks/use-users"
import type { UserResponseDto } from "../types"
import { UsersTable } from "../components/users-table"
import { UserFormDialog } from "../components/user-form-dialog"
import { CredentialsDialog } from "../components/credentials-dialog"
import type { CreateUserFormValues } from "../schemas/user-schema"

export function UsersCatalogPage() {
  const { t } = useTranslation("business-users-catalog")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null)
  const [createdUser, setCreatedUser] = useState<UserResponseDto | null>(null)

  const { data: users, isLoading } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const userList = users ?? []
  const filteredUsers = search
    ? userList.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase()) ||
          user.documentNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : userList

  const handleCreate = (values: CreateUserFormValues) => {
    createUserMutation.mutate(
      {
        ...values,
        email: values.email ?? null,
        documentNumber: values.documentNumber ?? null,
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
      { id: selectedUser.id, payload: { fullName: values.fullName } },
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

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {t("users")}
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("user_catalog")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("user_catalog_desc")}</p>
          <Users
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search_users")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 size-4" />
            {t("new_user")}
          </Button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : (
            <UsersTable users={filteredUsers} onEdit={openEditDialog} />
          )}
        </div>

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
      </CardContent>
    </Card>
  )
}
