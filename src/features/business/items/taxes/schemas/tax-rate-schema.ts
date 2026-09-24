import { z } from "zod"
import type { TFunction } from "i18next"

/**
 * Esquema del formulario de tasas de impuesto.
 * La UI trabaja en porcentaje (`ratePercent`, 0..100) y la conversión a la tasa
 * del backend (`rate`, 0..1) se hace en el dialog con `percentToRate`.
 */
export const taxRateSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(1, t("name_required"))
      .max(150, t("name_max", { max: 150 })),
    countryCode: z
      .string()
      .min(1, t("country_required"))
      .max(5, t("country_max", { max: 5 })),
    taxType: z.coerce.number().int().min(0, t("tax_type_invalid")).max(99, t("tax_type_invalid")),
    ratePercent: z.coerce.number().min(0, t("rate_min")).max(100, t("rate_max")),
    regionCode: z
      .string()
      .max(20, t("region_max", { max: 20 }))
      .optional()
      .default(""),
    description: z
      .string()
      .max(500, t("description_max", { max: 500 }))
      .optional()
      .default(""),
    isDefault: z.boolean().default(false),
  })

export type TaxRateFormValues = z.infer<ReturnType<typeof taxRateSchema>>
