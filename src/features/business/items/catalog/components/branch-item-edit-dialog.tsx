import { useEffect, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/i18n/use-i18n"
import {
  adjustStockSchema,
  updateBranchItemPricingSchema,
  type AdjustStockFormValues,
  type UpdateBranchItemPricingFormValues,
} from "../schemas/item-schema"
import { useAdjustBranchItemStock, useUpdateBranchItemPricing } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"
import { BranchItemModifierPanel } from "./branch-item-modifier-panel"
import { BranchItemTaxPanel } from "./branch-item-tax-panel"

type BranchItemEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  item: BranchItemResponseDto | null
}

/**
 * Edición de un ítem EN LA SUCURSAL con pestañas (igual que el modal del
 * catálogo general): Precios, Stock, Impuestos y Modificadores — reemplaza a
 * los antiguos botones sueltos de la fila.
 */
export function BranchItemEditDialog({ open, onOpenChange, branchId, item }: BranchItemEditDialogProps) {
  const { t } = useTranslation("business-items-catalog")
  const [activeTab, setActiveTab] = useState("prices")

  useEffect(() => {
    if (open) setActiveTab("prices")
  }, [open])

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-190">
        <DialogHeader>
          <DialogTitle>{t("edit_in_branch")}</DialogTitle>
          <DialogDescription>{item.itemName ?? ""}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prices">{t("tab_prices")}</TabsTrigger>
            <TabsTrigger value="stock">{t("tab_stock")}</TabsTrigger>
            <TabsTrigger value="taxes">{t("tab_taxes")}</TabsTrigger>
            <TabsTrigger value="modifiers">{t("tab_modifiers")}</TabsTrigger>
          </TabsList>

          <TabsContent value="prices">
            <PricingPanel branchId={branchId} item={item} />
          </TabsContent>
          <TabsContent value="stock">
            <StockPanel branchId={branchId} item={item} />
          </TabsContent>
          <TabsContent value="taxes">
            <BranchItemTaxPanel branchId={branchId} item={item} />
          </TabsContent>
          <TabsContent value="modifiers">
            <BranchItemModifierPanel branchId={branchId} item={item} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Pestaña "Precios": mismos campos que el antiguo BranchItemFormDialog. */
function PricingPanel({ branchId, item }: { branchId: string; item: BranchItemResponseDto }) {
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
    form.reset({
      price: item.price,
      priceA: item.priceA,
      priceB: item.priceB,
      priceC: item.priceC,
      salePrice: item.salePrice,
      cost: item.cost,
      replacementCost: item.replacementCost,
    })
  }, [item, form])

  const handleSubmit = (values: UpdateBranchItemPricingFormValues) => {
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

    updatePricing.mutate({ id: item.id, payload })
  }

  const numberField = (
    name: "price" | "salePrice" | "priceA" | "priceB" | "priceC" | "cost" | "replacementCost",
    label: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberField("price", t("price"))}
          {numberField("salePrice", t("sale_price"))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberField("priceA", t("price_a"))}
          {numberField("priceB", t("price_b"))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberField("priceC", t("price_c"))}
          {numberField("cost", t("cost"))}
        </div>
        {numberField("replacementCost", t("replacement_cost"))}

        <div className="flex justify-end">
          <Button type="submit" disabled={updatePricing.isPending}>
            {updatePricing.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  )
}

/** Pestaña "Stock": ajuste de la cantidad existente en la sucursal. */
function StockPanel({ branchId, item }: { branchId: string; item: BranchItemResponseDto }) {
  const { t } = useTranslation("business-items-catalog")
  const adjustStock = useAdjustBranchItemStock(branchId)

  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema(t)) as never,
    defaultValues: { quantity: 0 },
  })

  useEffect(() => {
    form.reset({ quantity: 0 })
  }, [form, item.id])

  const handleSubmit = (values: AdjustStockFormValues) => {
    adjustStock.mutate(
      { id: item.id, payload: { quantity: values.quantity, quantityCommitted: item.quantityCommitted } },
      { onSuccess: () => form.reset({ quantity: 0 }) }
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="rounded-lg border border-border/70 bg-accent/35 p-4">
          <p className="text-xs text-muted-foreground">{t("current_stock")}</p>
          <p className="text-2xl font-semibold text-foreground">{item.quantity ?? 0}</p>
        </div>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("new_quantity")}</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">{t("quantity_hint")}</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={adjustStock.isPending}>
            {adjustStock.isPending ? t("saving") : t("apply")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
