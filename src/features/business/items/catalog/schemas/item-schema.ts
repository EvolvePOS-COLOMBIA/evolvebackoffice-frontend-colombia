import { z } from "zod"
import type { TFunction } from "i18next"

// ─── Global Catalog Schemas ──────────────────────────────────────────────────

export const createItemSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("name_required")),
    sku: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    plu: z.coerce.number().int().min(0, t("plu_min")),
    departmentId: z.coerce.number().int().min(1, t("department_required")),
    itemType: z.coerce.number().int().min(1, t("item_type_required")),
    unitOfMeasure: z.string().nullable().optional(),
    taxable: z.boolean().default(false),
    webItem: z.boolean().default(false),
    extendedDescription: z.string().nullable().optional(),
    subDescription1: z.string().nullable().optional(),
    subDescription2: z.string().nullable().optional(),
    subDescription3: z.string().nullable().optional(),
    priceMustBeEntered: z.boolean().default(false),
    brandId: z.coerce.number().int().default(0),
    itemPresentationId: z.coerce.number().int().default(0),
    askQuantity: z.coerce.number().int().default(0),
  })

export const updateItemSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("name_required")).nullable().optional(),
    sku: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    plu: z.coerce.number().int().min(0).nullable().optional(),
    departmentId: z.coerce.number().int().min(1).nullable().optional(),
    itemType: z.coerce.number().int().min(1).nullable().optional(),
    unitOfMeasure: z.string().nullable().optional(),
    taxable: z.boolean().nullable().optional(),
    webItem: z.boolean().nullable().optional(),
    extendedDescription: z.string().nullable().optional(),
    subDescription1: z.string().nullable().optional(),
    subDescription2: z.string().nullable().optional(),
    subDescription3: z.string().nullable().optional(),
    priceMustBeEntered: z.boolean().nullable().optional(),
    brandId: z.coerce.number().int().nullable().optional(),
    itemPresentationId: z.coerce.number().int().nullable().optional(),
    askQuantity: z.coerce.number().int().nullable().optional(),
  })

// ─── Branch Item Schemas ─────────────────────────────────────────────────────

export const createBranchItemSchema = (t: TFunction) =>
  z.object({
    itemPublicId: z.string().min(1, t("item_required")),
    price: z.coerce.number().min(0, t("price_min")),
    priceA: z.coerce.number().min(0).default(0),
    priceB: z.coerce.number().min(0).default(0),
    priceC: z.coerce.number().min(0).default(0),
    salePrice: z.coerce.number().min(0).default(0),
    cost: z.coerce.number().min(0, t("cost_min")),
    quantity: z.coerce.number().min(0, t("quantity_min")),
    reorderPoint: z.coerce.number().min(0).default(0),
    restockLevel: z.coerce.number().min(0).default(0),
    binLocation: z.string().nullable().optional(),
  })

export const updateBranchItemPricingSchema = () =>
  z.object({
    price: z.coerce.number().min(0).nullable().optional(),
    priceA: z.coerce.number().min(0).nullable().optional(),
    priceB: z.coerce.number().min(0).nullable().optional(),
    priceC: z.coerce.number().min(0).nullable().optional(),
    salePrice: z.coerce.number().min(0).nullable().optional(),
    saleStartDate: z.string().nullable().optional(),
    saleEndDate: z.string().nullable().optional(),
    cost: z.coerce.number().min(0).nullable().optional(),
    replacementCost: z.coerce.number().min(0).nullable().optional(),
  })

export const adjustStockSchema = (t: TFunction) =>
  z.object({
    quantity: z.coerce.number().refine((val) => val !== 0, t("quantity_not_zero")),
  })

// ─── Form Value Types ────────────────────────────────────────────────────────

export type CreateItemFormValues = z.infer<ReturnType<typeof createItemSchema>>
export type UpdateItemFormValues = z.infer<ReturnType<typeof updateItemSchema>>
export type CreateBranchItemFormValues = z.infer<ReturnType<typeof createBranchItemSchema>>
export type UpdateBranchItemPricingFormValues = z.infer<
  ReturnType<typeof updateBranchItemPricingSchema>
>
export type AdjustStockFormValues = z.infer<ReturnType<typeof adjustStockSchema>>
