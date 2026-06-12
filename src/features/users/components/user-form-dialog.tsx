import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Sparkles } from "lucide-react"
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
import { createUserSchema, updateUserSchema } from "@/features/users/schemas/user-schema"
import type { UserFormValues } from "@/features/users/types/user-types"
import { useAppStore } from "@/store/app-store"
import { type UserAccount, USER_ROLES } from "@/types/domain"

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserAccount | null
}

const defaultValues: UserFormValues = {
  userName: "",
  email: "",
  fullName: "",
  role: "user",
  isActive: true,
  password: "",
}

export function UserFormDialog({ open, onOpenChange, userToEdit }: UserFormDialogProps) {
  const createUser = useAppStore((state) => state.createUser)
  const updateUser = useAppStore((state) => state.updateUser)
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
    try {
      const { password, ...userValues } = values
      void password
      if (userToEdit) {
        updateUser(userToEdit.id, userValues)
      } else {
        createUser(userValues)
      }
      form.reset()
      onOpenChange(false)
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to create the user.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-5rem)] lg:w-[820px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the selected user. Later this flow will call the backend user endpoints."
              : "This is a mock-only flow for now. Later this form will call the backend user endpoints."}
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
                      <Input placeholder="admin" autoComplete="off" {...field} />
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
                        placeholder={isEditMode ? "Leave empty to keep current password" : "Minimum 6 characters"}
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
                        <p className="mt-1 text-sm text-muted-foreground">
                          Inactive users should not be able to log in.
                        </p>
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
              <Button type="submit">
                {isEditMode ? <Pencil className="size-4" /> : <Sparkles className="size-4" />}
                {isEditMode ? "Update user" : "Save user"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
