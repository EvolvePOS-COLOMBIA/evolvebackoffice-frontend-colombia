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
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/i18n/use-i18n"
import { createItemSchema, type CreateItemFormValues } from "../schemas/item-schema"
import { useCreateItem, useUpdateItem } from "../hooks/use-items"
import { useDepartmentsAll } from "../../departments/hooks/use-departments"
import type { ItemResponseDto } from "../types"

type ItemFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemToEdit?: ItemResponseDto | null
}

const defaultValues: CreateItemFormValues = {
  name: "",
  sku: null,
  description: null,
  plu: 0,
  departmentId: 0,
  itemType: 0,
  unitOfMeasure: null,
  taxable: false,
  webItem: false,
  extendedDescription: null,
  subDescription1: null,
  subDescription2: null,
  subDescription3: null,
  priceMustBeEntered: false,
  brandId: 0,
  itemPresentationId: 0,
  askQuantity: 0,
}

export function ItemFormDialog({ open, onOpenChange, itemToEdit }: ItemFormDialogProps) {
  const isEditMode = Boolean(itemToEdit)
  const { t } = useTranslation("business-items-catalog")
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const { data: departments, isLoading: departmentsLoading } = useDepartmentsAll()

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(createItemSchema(t)) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return

    if (itemToEdit) {
      form.reset({
        name: itemToEdit.name ?? "",
        sku: itemToEdit.sku,
        description: itemToEdit.description,
        plu: itemToEdit.plu,
        departmentId: itemToEdit.departmentId,
        itemType: itemToEdit.itemType,
        unitOfMeasure: itemToEdit.unitOfMeasure,
        taxable: itemToEdit.taxable,
        webItem: itemToEdit.webItem,
        extendedDescription: null,
        subDescription1: null,
        subDescription2: null,
        subDescription3: null,
        priceMustBeEntered: itemToEdit.priceMustBeEntered,
        brandId: itemToEdit.brandId,
        itemPresentationId: itemToEdit.itemPresentationId,
        askQuantity: itemToEdit.askQuantity,
      })
      return
    }

    form.reset(defaultValues)
  }, [itemToEdit, form, open])

  const handleSubmit = (values: CreateItemFormValues) => {
    // Transform form values to API types (convert undefined to null)
    const transformValues = (v: CreateItemFormValues) => ({
      ...v,
      sku: v.sku ?? null,
      description: v.description ?? null,
      unitOfMeasure: v.unitOfMeasure ?? null,
      extendedDescription: v.extendedDescription ?? null,
      subDescription1: v.subDescription1 ?? null,
      subDescription2: v.subDescription2 ?? null,
      subDescription3: v.subDescription3 ?? null,
    })

    if (isEditMode && itemToEdit) {
      updateItem.mutate(
        { id: itemToEdit.id, payload: transformValues(values) },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createItem.mutate(transformValues(values), { onSuccess: () => onOpenChange(false) })
    }
  }

  const isSubmitting = createItem.isPending || updateItem.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-190">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_item") : t("create_item")}</DialogTitle>
          <DialogDescription>{t("item_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sku")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("sku_placeholder")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("description_placeholder")}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Numeric Fields */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="plu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("plu")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("department")}</FormLabel>
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={departmentsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("department_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{t("department_none")}</SelectItem>
                        {(departments ?? []).map((d) => (
                          <SelectItem key={d.id} value={String(d.internalId)}>
                            {d.parentName ? `${d.name} (${d.parentName})` : d.name}
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
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("item_type")}</FormLabel>
                    <Select value={String(field.value ?? 0)} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("item_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{t("item_type_standard")}</SelectItem>
                        <SelectItem value="1">{t("item_type_weighted")}</SelectItem>
                        <SelectItem value="2">{t("item_type_no_inventory")}</SelectItem>
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
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("unit_of_measure")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("unit_of_measure_placeholder")}
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
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("brand_id")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="askQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ask_quantity")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Boolean Toggles */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="taxable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>{t("taxable")}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webItem"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>{t("web_item")}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceMustBeEntered"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>{t("price_must_be_entered")}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
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
                {isSubmitting ? t("saving") : isEditMode ? t("update_item") : t("create_item")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
