import { useMemo, useState } from "react"
import { Plus, SquarePen, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDeleteUser, useGetUsers } from "@/features/users/hooks/use-users"
import { UserDeleteDialog } from "@/features/users/components/user-delete-dialog"
import { UserFormDialog } from "@/features/users/components/user-form-dialog"
import { notify } from "@/hooks/use-notify"
import type { UserResponse } from "@/types/domain"
import { formatDateTime } from "@/utils/format"
import { UserManagerSkeleton } from "../components/user-manager-skeleton"

export function UserManagerPage() {
  const { data: users, isLoading, isError } = useGetUsers()
  const { mutate: deleteUser } = useDeleteUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [query, setQuery] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery.length === 0) {
      return users ?? []
    }

    return (users ?? []).filter((user) => {
      return (
        user.userName.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.fullName.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, users])

  const totalUsers = users?.length ?? 0
  const activeUsers = (users ?? []).filter((user) => user.isActive).length

  const handleCreateClick = () => {
    setSelectedUser(null)
    setErrorMessage(null)
    setIsDialogOpen(true)
  }

  const handleEditClick = (user: UserResponse) => {
    setSelectedUser(user)
    setErrorMessage(null)
    setIsDialogOpen(true)
  }

  if (isLoading) return <UserManagerSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Unable to load users"
        description="The user directory could not be retrieved from the API. Please try again in a moment."
        eyebrow="User error"
        icon={Users}
        variant="inline"
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.7fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">User directory</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">
                Manage users and access to Version Manager.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Create, review, and remove accounts. Backend integration will be added later.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label="Total users" value={totalUsers} />
            <SummaryTile label="Active Users" value={activeUsers} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>User Manager</CardTitle>
              <CardDescription>Search by username, email, or full name.</CardDescription>
            </div>
            <Button onClick={handleCreateClick} className="sm:self-start">
              <Plus className="size-4" />
              Create user
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users..." />
            </div>
            <Badge tone="neutral" className="w-fit">
              {filteredUsers.length} result(s)
            </Badge>
          </div>

          {errorMessage ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-sm font-medium text-destructive">{errorMessage}</CardContent>
            </Card>
          ) : null}

          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge tone={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={user.isActive ? "success" : "warning"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(user.createdAtUtc)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                          <SquarePen className="size-4" />
                          Edit
                        </Button>
                        <UserDeleteDialog
                          userLabel={user.userName}
                          onDelete={() => {
                            setErrorMessage(null)
                            deleteUser(user.id, {
                              onSuccess: () => notify.success("User deleted successfully."),
                              onError: (error) => {
                                notify.error(error instanceof Error ? error.message : "Unable to delete the user.")
                                setErrorMessage(error instanceof Error ? error.message : "Unable to delete the user.")
                              },
                            })
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{user.userName}</h3>
                        <Badge tone={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
                        <Badge tone={user.isActive ? "success" : "warning"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.fullName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                        <SquarePen className="size-4" />
                        Edit
                      </Button>
                      <UserDeleteDialog
                        userLabel={user.userName}
                        onDelete={() => {
                          setErrorMessage(null)
                          deleteUser(user.id, {
                            onSuccess: () => notify.success("User deleted successfully."),
                            onError: (error) => {
                              notify.error(error instanceof Error ? error.message : "Unable to delete the user.")
                              setErrorMessage(error instanceof Error ? error.message : "Unable to delete the user.")
                            },
                          })
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <CompactMeta label="Email" value={user.email} />
                    <CompactMeta label="Created" value={formatDateTime(user.createdAtUtc)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Users className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">No users found</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try a different search or create a new user.</p>
            </Card>
          ) : null}
        </CardContent>
      </Card>

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setSelectedUser(null)
        }}
        userToEdit={selectedUser}
      />
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
      <p className="mt-2 text-sm font-medium break-words text-foreground">{value}</p>
    </div>
  )
}
