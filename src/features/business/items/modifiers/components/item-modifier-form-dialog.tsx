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
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/i18n/use-i18n"
import { useCreateItemModifier, useModifierGroups, useUpdateItemModifier } from "../hooks/use-modifiers"
import { itemModifierSchema, type ItemModifierFormValues } from "../schemas/modifier-schema"
import {
  MODIFIER_TYPE_CODES,
  MODIFIER_TYPE_LABEL_KEYS,
  normalizeModifierTypeCode,
  type CreateItemModifierDto,
  type ItemModifier,
  type ItemResponseDto,
  type UpdateItemModifierDto,
} from "../types"

type ItemModifierFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentItemId: string
  modifierToEdit?: ItemModifier | null
  items: ItemResponseDto[]
}

const defaultValues: ItemModifierFormValues = {
  parentItemId: "",
  childItemId: "",
  modifierGroupId: "",
  modifierTypeCode: "Optional",
  minQuantity: 0,
  maxQuantity: 1,
  extraPrice: 0,
  sortOrder: 0,
  isActive: true,
}

export function ItemModifierFormDialog({
  open,
  onOpenChange,
  parentItemId,
  modifierToEdit,
  items,
}: ItemModifierFormDialogProps) {
  const isEditMode = Boolean(modifierToEdit)
  const { t } = useTranslation("business-items-modifiers")
  const createModifier = useCreateItemModifier()
  const updateModifier = useUpdateItemModifier()
  const { data: groups, isLoading: groupsLoading } = useModifierGroups()

  const form = useForm<ItemModifierFormValues>({
    resolver: zodResolver(itemModifierSchema(t)) as Resolver<ItemModifierFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (modifierToEdit) {
      form.reset({
        parentItemId: modifierToEdit.parentItemId,
        childItemId: modifierToEdit.childItemId,
        modifierGroupId: modifierToEdit.modifierGroupId ?? "",
        modifierTypeCode: normalizeModifierTypeCode(modifierToEdit.modifierTypeCode),
        minQuantity: modifierToEdit.minQuantity,
        maxQuantity: modifierToEdit.maxQuantity,
        extraPrice: modifierToEdit.extraPrice,
        sortOrder: modifierToEdit.sortOrder,
        isActive: modifierToEdit.isActive,
      })
      return
    }
    form.reset({ ...defaultValues, parentItemId })
  }, [modifierToEdit, form, open, parentItemId])

  // El producto padre no puede ser su propio complemento
  const childOptions = useMemo(() => items.filter((item) => item.id !== parentItemId), [items, parentItemId])

  const handleSubmit = (values: ItemModifierFormValues) => {
    if (isEditMode && modifierToEdit) {
      const payload: UpdateItemModifierDto = {
        modifierGroupId: values.modifierGroupId ? values.modifierGroupId : null,
        modifierTypeCode: values.modifierTypeCode,
        minQuantity: values.minQuantity,
        maxQuantity: values.maxQuantity,
        extraPrice: values.extraPrice,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      }
      updateModifier.mutate(
        { id: modifierToEdit.id, payload, parentItemId: modifierToEdit.parentItemId },
        { onSuccess: () => onOpenChange(false) }
      )
      return
    }

    const payload: CreateItemModifierDto = {
      parentItemId: values.parentItemId,
      childItemId: values.childItemId,
      modifierGroupId: values.modifierGroupId ? values.modifierGroupId : null,
      modifierTypeCode: values.modifierTypeCode,
      minQuantity: values.minQuantity,
      maxQuantity: values.maxQuantity,
      extraPrice: values.extraPrice,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    }
    createModifier.mutate(payload, { onSuccess: () => onOpenChange(false) })
  }

  const isSubmitting = createModifier.isPending || updateModifier.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-140">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_modifier_title") : t("create_modifier_title")}</DialogTitle>
          <DialogDescription>{t("modifier_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="childItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("child_item_label")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("child_item_placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {childOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name ?? item.sku ?? item.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("child_item_hint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="modifierGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("group_label")}</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      disabled={groupsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("group_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("no_group")}</SelectItem>
                        {(groups ?? []).map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
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
                name="modifierTypeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modifier_type_label")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("modifier_type_label")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODIFIER_TYPE_CODES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {t(MODIFIER_TYPE_LABEL_KEYS[code])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="minQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("min_quantity_label")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("max_quantity_label")}</FormLabel>
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

            <FormField
              control={form.control}
              name="extraPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("extra_price_label")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("extra_price_hint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
