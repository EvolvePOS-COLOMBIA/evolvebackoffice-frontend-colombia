import { z } from "zod"
import type { TFunction } from "i18next"

import { MODIFIER_TYPE_CODES } from "../types"

/** Esquema de creación/edición de un grupo de modificadores. */
export const modifierGroupSchema = (t: TFunction) =>
  z
    .object({
      name: z
        .string()
        .min(1, t("name_required"))
        .max(200, t("name_max", { max: 200 })),
      description: z
        .string()
        .max(1000, t("description_max", { max: 1000 }))
        .optional()
        .default(""),
      minSelection: z.coerce.number().int().min(0, t("min_selection_min")),
      maxSelection: z.coerce.number().int().min(0, t("max_selection_min")),
      sortOrder: z.coerce.number().int().min(0, t("sort_order_min")),
      isActive: z.boolean().default(true),
    })
    .superRefine((values, ctx) => {
      if (values.maxSelection < values.minSelection) {
        ctx.addIssue({ code: "custom", path: ["maxSelection"], message: t("max_selection_invalid") })
      }
    })

export type ModifierGroupFormValues = z.infer<ReturnType<typeof modifierGroupSchema>>

/** Esquema de creación/edición de un modificador de un producto. */
export const itemModifierSchema = (t: TFunction) =>
  z
    .object({
      parentItemId: z.string().min(1, t("parent_item_required")),
      childItemId: z.string().min(1, t("child_item_required")),
      // "" = sin grupo
      modifierGroupId: z.string().optional().default(""),
      modifierTypeCode: z.enum(MODIFIER_TYPE_CODES, t("modifier_type_required")),
      minQuantity: z.coerce.number().int().min(0, t("min_quantity_min")),
      maxQuantity: z.coerce.number().int().min(0, t("max_quantity_min")),
      extraPrice: z.coerce.number().min(0, t("extra_price_min")),
      sortOrder: z.coerce.number().int().min(0, t("sort_order_min")),
      isActive: z.boolean().default(true),
    })
    .superRefine((values, ctx) => {
      if (values.childItemId && values.childItemId === values.parentItemId) {
        ctx.addIssue({ code: "custom", path: ["childItemId"], message: t("child_item_different") })
      }
      if (values.maxQuantity < values.minQuantity) {
        ctx.addIssue({ code: "custom", path: ["maxQuantity"], message: t("max_quantity_invalid") })
      }
    })

export type ItemModifierFormValues = z.infer<ReturnType<typeof itemModifierSchema>>
