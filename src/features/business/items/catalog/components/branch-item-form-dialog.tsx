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
import {
  updateBranchItemPricingSchema,
  type UpdateBranchItemPricingFormValues,
} from "../schemas/item-schema"
import { useUpdateBranchItemPricing } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"

type BranchItemFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  item: BranchItemResponseDto
}

export function BranchItemFormDialog({
  open,
  onOpenChange,
  branchId,
  item,
}: BranchItemFormDialogProps) {
  const { t } = useTranslation("business-items-catalog")
  const updatePricing = useUpdateBranchItemPricing(branchId)

  const form = useForm<UpdateBranchItemPricingFormValues>({
    resolver: zodResolver(updateBranchItemPricingSchema()) as never,
    defaultValues: {
      price: item.price,
      priceA: item.priceA,
      priceB: item.priceB,
      priceC: item.priceC,
      salePrice: item.salePrice,
      saleStartDate: item.saleStartDate,
      saleEndDate: item.saleEndDate,
      cost: item.cost,
      replacementCost: item.replacementCost,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        price: item.price,
        priceA: item.priceA,
        priceB: item.priceB,
        priceC: item.priceC,
        salePrice: item.salePrice,
        cost: item.cost,
        replacementCost: item.replacementCost,
      })
    }
  }, [item, form, open])

  const handleSubmit = (values: UpdateBranchItemPricingFormValues) => {
    // Transform form values to API types (convert undefined to null)
    const payload = {
      price: values.price ?? null,
      priceA: values.priceA ?? null,
      priceB: values.priceB ?? null,
      priceC: values.priceC ?? null,
      salePrice: values.salePrice ?? null,
      saleStartDate: values.saleStartDate ?? null,
      saleEndDate: values.saleEndDate ?? null,
      cost: values.cost ?? null,
      replacementCost: values.replacementCost ?? null,
    }

    updatePricing.mutate(
      { id: item.id, payload },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("edit_pricing")}</DialogTitle>
          <DialogDescription>
            {t("edit_pricing_desc", { name: item.itemName })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sale_price")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="priceA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price_a")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price_b")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="priceC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price_c")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cost")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="replacementCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("replacement_cost")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={updatePricing.isPending}>
                {updatePricing.isPending ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
