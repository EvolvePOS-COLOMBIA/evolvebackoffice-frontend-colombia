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
import { useTranslation } from "@/i18n/use-i18n"
import { createItemSchema, type CreateItemFormValues } from "../schemas/item-schema"
import type { ItemResponseDto } from "../types"

type ItemFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemToEdit?: ItemResponseDto | null
  onSubmit: (values: CreateItemFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: CreateItemFormValues = {
  name: "",
  sku: null,
  description: null,
  salePrice: 0,
  costPrice: 0,
  stock: 0,
  minStockLevel: 0,
  category: null,
}

export function ItemFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSubmit,
  isSubmitting = false,
}: ItemFormDialogProps) {
  const isEditMode = Boolean(itemToEdit)
  const { t } = useTranslation("business-items-catalog")

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(createItemSchema(t)) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return

    if (itemToEdit) {
      form.reset({
        name: itemToEdit.name,
        sku: itemToEdit.sku,
        description: itemToEdit.description,
        salePrice: itemToEdit.salePrice,
        costPrice: itemToEdit.costPrice,
        stock: itemToEdit.stock,
        minStockLevel: itemToEdit.minStockLevel,
        category: itemToEdit.category,
      })
      return
    }

    form.reset(defaultValues)
  }, [itemToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_item") : t("create_item")}</DialogTitle>
          <DialogDescription>{t("item_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sale_price")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cost_price")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("stock")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("min_stock_level")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("category_placeholder")}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
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
                {isSubmitting ? t("saving") : isEditMode ? t("update_item") : t("create_item")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
