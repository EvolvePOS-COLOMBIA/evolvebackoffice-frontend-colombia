import { z } from "zod"
import type { TFunction } from "i18next"

export const createItemSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("name_required")),
    sku: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    salePrice: z.coerce.number().min(0, t("sale_price_min")),
    costPrice: z.coerce.number().min(0, t("cost_price_min")),
    stock: z.coerce.number().int().min(0, t("stock_min")),
    minStockLevel: z.coerce.number().int().min(0, t("min_stock_min")),
    category: z.string().nullable().optional(),
  })

export const updateItemSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("name_required")),
    sku: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    salePrice: z.coerce.number().min(0, t("sale_price_min")).nullable().optional(),
    costPrice: z.coerce.number().min(0, t("cost_price_min")).nullable().optional(),
    category: z.string().nullable().optional(),
  })

export const adjustStockSchema = (t: TFunction) =>
  z.object({
    delta: z.coerce.number().int().refine((val) => val !== 0, t("delta_not_zero")),
  })

export type CreateItemFormValues = z.infer<ReturnType<typeof createItemSchema>>
export type UpdateItemFormValues = z.infer<ReturnType<typeof updateItemSchema>>
export type AdjustStockFormValues = z.infer<ReturnType<typeof adjustStockSchema>>
