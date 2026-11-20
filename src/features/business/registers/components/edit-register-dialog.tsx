import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Cable, IdCard, Lock, Save, SquarePen } from "lucide-react"
import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"

import Spinner from "@/components/Spinner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { registerEditSchema } from "@/features/business/registers/schemas/register-schema"
import type { Register, RegisterFormValues } from "@/features/business/registers/types"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useTranslation } from "@/i18n/use-i18n"
import { DialogTitleBlock, FormSection, SerialSelect } from "./register-dialog-parts"

type EditRegisterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  registerToEdit: Register | null
  onSubmit: (values: RegisterFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: RegisterFormValues = {
  name: "",
  code: "",
  branchPublicId: "",
  deviceIdentifier: "",
  serialCode: "",
}

export function EditRegisterDialog({
  open,
  onOpenChange,
  registerToEdit,
  onSubmit,
  isSubmitting = false,
}: EditRegisterDialogProps) {
  const { t } = useTranslation("business-registers")
  const { data: branchesPage, isLoading: branchesLoading } = useBranches(1, 1000)
  const branches = branchesPage?.data ?? []

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerEditSchema(t)) as unknown as Resolver<RegisterFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (registerToEdit) {
      form.reset({
        name: registerToEdit.name,
        code: registerToEdit.code,
        branchPublicId: registerToEdit.branchPublicId,
        deviceIdentifier: registerToEdit.deviceIdentifier,
        serialCode: registerToEdit.serialCode,
      })
    } else {
      form.reset(defaultValues)
    }
  }, [open, registerToEdit, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(94vw,580px)] gap-5 overflow-y-auto">
        <DialogTitleBlock icon={SquarePen} title={t("edit_title")} description={t("edit_desc")} />

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormSection icon={IdCard} title={t("section_identity")}>
              <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>{t("name_label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("name_placeholder")} autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Solo lectura: no está registrado en el form, así que no usa FormLabel. */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="edit-register-code">{t("code_label")}</Label>
                  <div className="relative">
                    <Input
                      id="edit-register-code"
                      value={registerToEdit?.code ?? ""}
                      disabled
                      className="pr-9 font-mono"
                    />
                    <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("code_immutable")}</p>
            </FormSection>

            <FormSection icon={Building2} title={t("section_location")}>
              <FormField
                control={form.control}
                name="branchPublicId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t("branch_label")}</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={branchesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("branch_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection icon={Cable} title={t("section_link")} hint={t("optional")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="serialCode"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>{t("serial_label")}</FormLabel>
                      <SerialSelect value={field.value ?? ""} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deviceIdentifier"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>{t("device_label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("device_placeholder")} autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter className="pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || branchesLoading}>
                {isSubmitting && <Spinner IsButton />}
                {!isSubmitting && <Save className="size-4" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
