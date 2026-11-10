import { useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import { useCreateModifierGroup, useUpdateModifierGroup } from "../hooks/use-modifiers"
import { modifierGroupSchema, type ModifierGroupFormValues } from "../schemas/modifier-schema"
import type { CreateModifierGroupDto, ModifierGroup } from "../types"

type ModifierGroupFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupToEdit?: ModifierGroup | null
}

const defaultValues: ModifierGroupFormValues = {
  name: "",
  description: "",
  minSelection: 0,
  maxSelection: 1,
  sortOrder: 0,
  isActive: true,
}

export function ModifierGroupFormDialog({ open, onOpenChange, groupToEdit }: ModifierGroupFormDialogProps) {
  const isEditMode = Boolean(groupToEdit)
  const { t } = useTranslation("business-items-modifiers")
  const createGroup = useCreateModifierGroup()
  const updateGroup = useUpdateModifierGroup()

  const form = useForm<ModifierGroupFormValues>({
    resolver: zodResolver(modifierGroupSchema(t)) as Resolver<ModifierGroupFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (groupToEdit) {
      form.reset({
        name: groupToEdit.name,
        description: groupToEdit.description ?? "",
        minSelection: groupToEdit.minSelection,
        maxSelection: groupToEdit.maxSelection,
        sortOrder: groupToEdit.sortOrder,
        isActive: groupToEdit.isActive,
      })
      return
    }
    form.reset(defaultValues)
  }, [groupToEdit, form, open])

  const handleSubmit = (values: ModifierGroupFormValues) => {
    const payload: CreateModifierGroupDto = {
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      minSelection: values.minSelection,
      maxSelection: values.maxSelection,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    }

    if (isEditMode && groupToEdit) {
      updateGroup.mutate({ id: groupToEdit.id, payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      createGroup.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  const isSubmitting = createGroup.isPending || updateGroup.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-140">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_group_title") : t("create_group_title")}</DialogTitle>
          <DialogDescription>{t("group_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description_label")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("description_placeholder")} rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="minSelection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("min_selection_label")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSelection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("max_selection_label")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sort_order_label")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-xs text-muted-foreground">{t("min_selection_hint")}</p>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("active_label")}</FormLabel>
                    <p className="text-xs text-muted-foreground">{t("active_hint")}</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
