import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, SquarePen } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useCreateUser, useUpdateUser } from "@/features/users/hooks/use-users"
import { createUserSchema, updateUserSchema } from "@/features/users/schemas/user-schema"
import type { UserFormValues } from "@/features/users/types/user-types"
import { notify } from "@/hooks/use-notify"
import type { CreateUserRequest, UpdateUserRequest, UserResponse, UserRole } from "@/types/domain"
import Spinner from "@/components/Spinner"

const USER_ROLES: UserRole[] = ["admin", "user", "app"]

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserResponse | null
}

const defaultValues: UserFormValues = {
  userName: "",
  email: "",
  fullName: "",
  role: "admin",
  isActive: true,
  password: "",
}

export function UserFormDialog({ open, onOpenChange, userToEdit }: UserFormDialogProps) {
  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()
  const isEditMode = Boolean(userToEdit)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (userToEdit) {
      form.reset({
        userName: userToEdit.userName,
        email: userToEdit.email,
        fullName: userToEdit.fullName,
        role: userToEdit.role,
        isActive: userToEdit.isActive,
        password: "",
      })
      return
    }

    form.reset(defaultValues)
  }, [form, open, userToEdit])

  const onSubmit = (values: UserFormValues) => {
    if (userToEdit) {
      const passwordValue = values.password?.trim() ?? ""
      const payload: UpdateUserRequest = {
        email: values.email,
        fullName: values.fullName,
        role: values.role as UserRole,
        isActive: values.isActive,
        ...(passwordValue.length > 0 ? { newPassword: passwordValue } : {}),
      }

      updateUser(
        { userId: userToEdit.id, data: payload },
        {
          onSuccess: () => {
            notify.success("User updated successfully.")
            form.reset()
            onOpenChange(false)
          },
          onError: (error) => {
            notify.error(error instanceof Error ? error.message : "Unable to update the user.")
            form.setError("root", {
              message: error instanceof Error ? error.message : "Unable to update the user.",
            })
          },
        }
      )
      return
    }

    const createPayload: CreateUserRequest = {
      userName: values.userName,
      email: values.email,
      fullName: values.fullName,
      role: values.role as UserRole,
      isActive: values.isActive,
      password: values.password ?? "",
    }

    createUser(createPayload, {
      onSuccess: () => {
        notify.success("User created successfully.")
        form.reset()
        onOpenChange(false)
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : "Unable to create the user.")
        form.setError("root", {
          message: error instanceof Error ? error.message : "Unable to create the user.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-5rem)] lg:w-[850px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Selected User" : "Create a new User"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Username is immutable and cannot not be changed."
              : "Fill in the form to create a new user account."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" autoComplete="off" {...field} readOnly={isEditMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@company.local" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Initial Administrator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? "New password" : "Password"}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete={isEditMode ? "new-password" : "new-password"}
                        placeholder={isEditMode ? "Leave empty to keep current password" : "Minimum 8 characters"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <p className="text-sm text-muted-foreground">Inactive users should not be able to log in.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Spinner IsButton />}

                {/* Condición para ocultar el ícono durante la carga */}
                {!(isCreating || isUpdating) &&
                  (isEditMode ? <SquarePen className="size-4" /> : <Sparkles className="size-4" />)}

                {isEditMode ? "Update User" : "Save User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
