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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { createUserSchema, type CreateUserFormValues } from "../schemas/user-schema"
import type { UserResponseDto } from "../types"

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserResponseDto | null
  onSubmit: (values: CreateUserFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: CreateUserFormValues = {
  fullName: "",
  email: null,
  documentType: 1,
  documentNumber: "",
  role: "Cashier",
}

export function UserFormDialog({
  open,
  onOpenChange,
  userToEdit,
  onSubmit,
  isSubmitting = false,
}: UserFormDialogProps) {
  const isEditMode = Boolean(userToEdit)
  const { t } = useTranslation("business-users-catalog")

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema(t)) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return

    if (userToEdit) {
      form.reset({
        fullName: userToEdit.fullName ?? "",
        email: userToEdit.email,
        documentType: userToEdit.documentType ?? 1,
        documentNumber: userToEdit.documentNumber ?? "",
        role: userToEdit.role ?? "Cashier",
      })
      return
    }

    form.reset(defaultValues)
  }, [userToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_user") : t("create_user")}</DialogTitle>
          <DialogDescription>{t("user_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
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
              <>
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
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("document_type")}</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">CC</SelectItem>
                            <SelectItem value="2">CE</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("document_number")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("document_number_placeholder")} {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("role")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? "Cashier"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">{t("role_admin")}</SelectItem>
                          <SelectItem value="Manager">{t("role_manager")}</SelectItem>
                          <SelectItem value="Cashier">{t("role_cashier")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : isEditMode ? t("update_user") : t("create_user")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
