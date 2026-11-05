import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"

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
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { PersonLookupBanner } from "../../persons/person-lookup-banner"
import { usePersonLookup } from "../../persons/use-person-lookup"
import type { PersonResponseDto } from "../../persons/types"
import { createUserSchema, type CreateUserFormValues } from "../schemas/user-schema"
import { IdentificationType, type UserResponseDto } from "../types"

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserResponseDto | null
  onSubmit: (values: CreateUserFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: CreateUserFormValues = {
  firstName: "",
  lastName: "",
  email: null,
  identificationTypeId: IdentificationType.CedulaCiudadania,
  identificationNumber: "",
  phoneNumber: null,
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
  const { t: tCommon } = useTranslation("common")
  const { lookup, isLooking } = usePersonLookup()
  const [foundPerson, setFoundPerson] = useState<PersonResponseDto | null>(null)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema(t)) as never,
    defaultValues,
  })

  /**
   * Consulta la tabla Persons compartida por tipo + número de identificación
   * para precargar los datos de un colaborador ya registrado.
   */
  const runLookup = async (explicit: boolean) => {
    const typeId = Number(form.getValues("identificationTypeId")) || IdentificationType.CedulaCiudadania
    const number = form.getValues("identificationNumber") ?? ""

    if (!number.trim()) {
      if (explicit) notify.info(tCommon("person_not_found"))
      return
    }

    const person = await lookup(typeId, number)
    if (!person) {
      setFoundPerson(null)
      if (explicit) notify.info(tCommon("person_not_found"))
      return
    }

    setFoundPerson(person)
    form.reset({
      ...form.getValues(),
      firstName: person.firstName ?? "",
      lastName: person.lastName ?? "",
      phoneNumber: person.phoneNumber ?? null,
      email: person.emailAddress ?? null,
    })
  }

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevUserToEdit, setPrevUserToEdit] = useState(userToEdit)
  if (open !== prevOpen || userToEdit !== prevUserToEdit) {
    setPrevOpen(open)
    setPrevUserToEdit(userToEdit)
    if (open) setFoundPerson(null)
  }

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
                        <Select
                          onValueChange={(val) => {
                            field.onChange(Number(val))
                            setFoundPerson(null)
                          }}
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
                    name="identificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("document_number")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("document_number_placeholder")}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              field.onChange(e.target.value)
                              setFoundPerson(null)
                            }}
                            onBlur={() => void runLookup(false)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={isLooking}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void runLookup(true)}
                >
                  <Search className="mr-1 size-4" />
                  {isLooking ? tCommon("person_looking") : tCommon("person_lookup")}
                </Button>

                {foundPerson && <PersonLookupBanner person={foundPerson} onDismiss={() => setFoundPerson(null)} />}

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
