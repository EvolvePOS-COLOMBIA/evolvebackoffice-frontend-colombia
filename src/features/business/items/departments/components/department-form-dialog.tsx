import { useEffect, useMemo } from "react"
import { useForm, type Resolver } from "react-hook-form"
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
import { useTranslation } from "@/i18n/use-i18n"
import { departmentSchema, type DepartmentFormValues } from "../schemas/department-schema"
import { useCreateDepartment, useDepartments, useUpdateDepartment } from "../hooks/use-departments"
import type { Department } from "../types"

type DepartmentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  departmentToEdit?: Department | null
}

const defaultValues: DepartmentFormValues = {
  code: "",
  name: "",
  parentPublicId: "",
}

export function DepartmentFormDialog({ open, onOpenChange, departmentToEdit }: DepartmentFormDialogProps) {
  const isEditMode = Boolean(departmentToEdit)
  const { t } = useTranslation("business-items-departments")
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const { data: departmentsPage } = useDepartments(1, 500)
  const departments = useMemo(() => departmentsPage?.data ?? [], [departmentsPage?.data])

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema(t)) as Resolver<DepartmentFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (departmentToEdit) {
      form.reset({
        code: departmentToEdit.code,
        name: departmentToEdit.name,
        parentPublicId: departmentToEdit.parentPublicId ?? "",
      })
      return
    }
    form.reset(defaultValues)
  }, [departmentToEdit, form, open])

  // Excluir el departamento editado y sus descendientes como padre (evita ciclos)
  const excludedParents = useMemo(() => {
    const excluded = new Set<string>()
    if (!departmentToEdit) return excluded
    excluded.add(departmentToEdit.id)
    let changed = true
    while (changed) {
      changed = false
      for (const d of departments) {
        if (!excluded.has(d.id) && d.parentPublicId && excluded.has(d.parentPublicId)) {
          excluded.add(d.id)
          changed = true
        }
      }
    }
    return excluded
  }, [departmentToEdit, departments])

  const parentOptions = departments.filter((d) => !excludedParents.has(d.id))

  const handleSubmit = (values: DepartmentFormValues) => {
    const payload = {
      code: values.code,
      name: values.name,
      parentPublicId: values.parentPublicId ? values.parentPublicId : null,
    }

    if (isEditMode && departmentToEdit) {
      updateDepartment.mutate({ id: departmentToEdit.id, payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      createDepartment.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  const isSubmitting = createDepartment.isPending || updateDepartment.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-140">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_title") : t("create_title")}</DialogTitle>
          <DialogDescription>{t("create_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("code_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("code_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentPublicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("parent_label")}</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("parent_placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("no_parent_option")}</SelectItem>
                      {parentOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("parent_hint")}</p>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : isEditMode ? t("update") : t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
