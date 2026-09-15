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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/i18n/use-i18n"
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "../schemas/user-schema"
import { IdentificationType, type UserResponseDto } from "../types"

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserResponseDto | null
  onCreate: (values: CreateUserFormValues) => void
  onUpdate: (values: UpdateUserFormValues) => void
  isSubmitting?: boolean
  isSelfEdit?: boolean
}

const defaultValues: CreateUserFormValues = {
  firstName: "",
  lastName: "",
  email: null,
  identificationTypeId: IdentificationType.CedulaCiudadania,
  identificationNumber: "",
  phoneNumber: null,
  role: "Cashier",
  address: null,
  emailAddress: null,
}

export function UserFormDialog({
  open,
  onOpenChange,
  userToEdit,
  onCreate,
  onUpdate,
  isSubmitting = false,
  isSelfEdit = false,
}: UserFormDialogProps) {
  const isEditMode = Boolean(userToEdit)
  const { t } = useTranslation("business-users-catalog")

  const schema = isEditMode ? updateUserSchema(t) : createUserSchema(t)
  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return

    if (userToEdit) {
      form.reset({
        firstName: userToEdit.firstName ?? "",
        lastName: userToEdit.lastName ?? "",
        email: userToEdit.email,
        identificationTypeId: userToEdit.identificationTypeId || IdentificationType.CedulaCiudadania,
        identificationNumber: userToEdit.identificationNumber ?? "",
        phoneNumber: userToEdit.phoneNumber,
        role: userToEdit.role ?? "Cashier",
        address: userToEdit.address ?? null,
        emailAddress: userToEdit.emailAddress ?? userToEdit.email ?? null,
      })
      return
    }

    form.reset(defaultValues)
  }, [userToEdit, form, open])

  // Handle self-edit case: role must be null when user edits their own profile
  const handleFormSubmit = (values: CreateUserFormValues | UpdateUserFormValues) => {
    if (isSelfEdit && isEditMode) {
      // For self-edit, we need to set role to null
      onUpdate({ ...values, role: null } as UpdateUserFormValues)
    } else if (isEditMode) {
      onUpdate(values as UpdateUserFormValues)
    } else {
      onCreate(values as CreateUserFormValues)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-150">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_user") : t("create_user")}</DialogTitle>
          <DialogDescription>{t("user_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleFormSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("first_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("first_name_placeholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("last_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("last_name_placeholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="emailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email_address")}</FormLabel>
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

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("phone_placeholder")}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("address_placeholder")}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
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
                    name="identificationTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("document_type")}</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
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
                    name="identificationNumber"
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

            {isEditMode && (
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium">{t("role")}</span>
                  <span className="text-xs text-muted-foreground">{t("role_disabled_for_self_edit")}</span>
                </div>
                <div className="font-medium text-foreground">
                  {userToEdit?.role ?? "—"}
                </div>
              </div>
            )}

            <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
              <div className="space-y-1 leading-none">
                <span className="text-sm font-medium">{t("status")}</span>
                <span className="text-xs text-muted-foreground">{t("status_description")}</span>
              </div>
              <Switch
                checked={form.getValues("isActive")}
                onCheckedChange={(value) => form.setValue("isActive", value)}
                disabled={isSelfEdit}
              />
            </div>

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
