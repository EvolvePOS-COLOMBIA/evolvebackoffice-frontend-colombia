import { useState } from "react"
import { Users, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { useTranslation } from "@/i18n/use-i18n"
import { useUsers, useCreateUser, useUpdateUser, useToggleUserStatus } from "../hooks/use-users"
import { getUserDisplayName, type UserResponseDto } from "../types"
import { UsersTable } from "../components/users-table"
import { UserFormDialog } from "../components/user-form-dialog"
import { CredentialsDialog } from "../components/credentials-dialog"
import { useAuth } from "@/features/auth/hooks/use-auth"
import type { CreateUserFormValues, UpdateUserFormValues } from "../schemas/user-schema"

export function UsersCatalogPage() {
  const { t } = useTranslation("business-users-catalog")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null)
  const [createdUser, setCreatedUser] = useState<UserResponseDto | null>(null)
  const [userToToggle, setUserToToggle] = useState<UserResponseDto | null>(null)
  const [confirmingToggle, setConfirmingToggle] = useState(false)

  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const { data: users, isLoading } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const toggleUserStatusMutation = useToggleUserStatus()

  const userList = users ?? []
  const filteredUsers = search
    ? userList.filter((user) => {
        const term = search.toLowerCase()
        return (
          getUserDisplayName(user).toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.identificationNumber?.toLowerCase().includes(term)
        )
      })
    : userList

  const handleCreate = (values: CreateUserFormValues) => {
    createUserMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        identificationTypeId: values.identificationTypeId,
        identificationNumber: values.identificationNumber,
        phoneNumber: values.phoneNumber ?? null,
        email: values.email ?? null,
        emailAddress: values.emailAddress ?? null,
        address: values.address ?? null,
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

  const handleEdit = (values: UpdateUserFormValues) => {
    if (!selectedUser) return
    updateUserMutation.mutate(
      {
        id: selectedUser.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber ?? null,
          address: values.address ?? null,
          emailAddress: values.emailAddress ?? null,
          email: values.email ?? null,
          role: values.role ?? null,
          isActive: values.isActive,
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

  // For self-edit case, we need to handle role differently
  const handleSelfEdit = (values: UpdateUserFormValues) => {
    if (!selectedUser) return
    // Role must be sent as null when user edits their own profile
    updateUserMutation.mutate(
      {
        id: selectedUser.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber ?? null,
          address: values.address ?? null,
          emailAddress: values.emailAddress ?? null,
          email: values.email ?? null,
          role: null, // Always null for self-edit
          isActive: values.isActive,
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

  const handleToggleStatus = (user: UserResponseDto) => {
    setUserToToggle(user)
    setConfirmingToggle(true)
  }

  const confirmToggleStatus = () => {
    if (!userToToggle) return
    toggleUserStatusMutation.mutate(
      { id: userToToggle.id, isActive: !userToToggle.isActive },
      {
        onSuccess: () => {
          setUserToToggle(null)
          setConfirmingToggle(false)
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
            <UsersTable users={filteredUsers} onEdit={openEditDialog} onToggleStatus={handleToggleStatus} />
          )}
        </div>

        <UserFormDialog
          open={formOpen}
          onOpenChange={handleDialogClose}
          userToEdit={selectedUser}
          onCreate={handleCreate}
          onUpdate={selectedUser?.id === userId ? handleSelfEdit : handleEdit}
          isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
          isSelfEdit={selectedUser?.id === userId}
        />

        <CredentialsDialog
          open={credentialsOpen}
          onOpenChange={handleCredentialsClose}
          user={createdUser}
          onGoToList={handleCredentialsClose}
        />

        <AlertDialog open={confirmingToggle} onOpenChange={setConfirmingToggle}>
          {userToToggle && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t(userToToggle.isActive ? "disable_user" : "enable_user")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {userToToggle.isActive
                    ? t("disable_user_confirm_description", { name: getUserDisplayName(userToToggle) })
                    : t("enable_user_confirm_description", { name: getUserDisplayName(userToToggle) })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={confirmToggleStatus}>
                  {userToToggle.isActive ? t("disable_user") : t("enable_user")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
