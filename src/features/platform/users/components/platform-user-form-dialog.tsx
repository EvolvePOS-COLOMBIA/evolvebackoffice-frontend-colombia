import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { useCreatePlatformUser, useUpdatePlatformUser } from "@/features/platform/users/hooks/use-platform-users"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { platformUserSchema, type PlatformUserFormValues } from "../schemas/platform-user-schema"
import type { CreatePlatformUserRequest, PlatformUser, UpdatePlatformUserRequest } from "../types"

interface PlatformUserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit: PlatformUser | null
}

export function PlatformUserFormDialog({ open, onOpenChange, userToEdit }: PlatformUserFormDialogProps) {
  const { t } = useTranslation("platform-users")
  const createMutation = useCreatePlatformUser()
  const updateMutation = useUpdatePlatformUser()

  const isEditMode = Boolean(userToEdit)

  // El esquema comparte los campos editables; la contraseña solo se exige al crear.
  const form = useForm<PlatformUserFormValues>({
    resolver: zodResolver(platformUserSchema(t)),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      role: "PlatformSupervisor" as const,
    },
  })

  // Handle form reset when dialog opens
  useEffect(() => {
    if (!open) return

    if (userToEdit) {
      form.reset({
        email: userToEdit.email,
        fullName: userToEdit.fullName,
        password: "",
        role: userToEdit.role,
      })
    } else {
      form.reset({
        email: "",
        fullName: "",
        password: "",
        role: "PlatformSupervisor" as const,
      })
    }
  }, [userToEdit, form, open])

  const handleSubmit = (values: PlatformUserFormValues) => {
    if (isEditMode) {
      const updateData: UpdatePlatformUserRequest = {
        fullName: values.fullName,
        role: values.role,
      }

      updateMutation.mutate(
        {
          id: userToEdit!.id,
          data: updateData,
        },
        {
          onSuccess: () => {
            notify.success(t("user_updated"))
            onOpenChange(false)
          },
          onError: (error) => {
            notify.error(error instanceof Error ? error.message : t("unable_to_save"))
          },
        }
      )
    } else {
      if (!values.password) {
        form.setError("password", { message: t("password_min_length") })
        return
      }

      const createData: CreatePlatformUserRequest = {
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        role: values.role,
      }

      createMutation.mutate(createData, {
        onSuccess: (result) => {
          notify.success(t("user_created"))
          if (result.temporaryPassword) {
            notify.info(`${t("temporary_password")}: ${result.temporaryPassword}`)
          }
          onOpenChange(false)
        },
        onError: (error) => {
          notify.error(error instanceof Error ? error.message : t("unable_to_save"))
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_user") : t("create_user")}</DialogTitle>
          <DialogDescription>{isEditMode ? t("edit_user_desc") : t("create_user_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("email_placeholder")}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("full_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("full_name_placeholder")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("password_placeholder")}
                        {...field}
                        value={field.value ?? ""}
                        minLength={8}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("role")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PlatformAdmin">{t("role_admin")}</SelectItem>
                      <SelectItem value="PlatformSubAdmin">{t("role_subadmin")}</SelectItem>
                      <SelectItem value="PlatformSupervisor">{t("role_supervisor")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditMode ? t("save") : t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
