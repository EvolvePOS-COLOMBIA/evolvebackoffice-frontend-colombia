import type { TFunction } from "i18next"
import { z } from "zod"

const optionalText = (max: number, message: string) => z.string().trim().max(max, message)

/** Coordenada opcional: vacía o, con contenido, un número finito dentro del rango. */
const coordinateField = (min: number, max: number, invalid: string, range: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || Number.isFinite(Number(value)), { message: invalid })
    .refine(
      (value) => {
        if (value === "") return true
        const coordinate = Number(value)
        return coordinate >= min && coordinate <= max
      },
      { message: range }
    )

export const branchFormSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("name_required"))
      .max(100, t("name_max_length", { max: 100 })),
    identification: optionalText(50, t("identification_max_length", { max: 50 })),
    address: optionalText(250, t("address_max_length", { max: 250 })),
    phone: optionalText(30, t("phone_max_length", { max: 30 })),
    email: z
      .string()
      .trim()
      .max(254, t("email_max_length", { max: 254 }))
      .refine((value) => !value || z.string().email().safeParse(value).success, t("email_invalid")),
    latitude: coordinateField(-90, 90, t("latitude_invalid"), t("latitude_range")),
    longitude: coordinateField(-180, 180, t("longitude_invalid"), t("longitude_range")),
    adminUserId: z.string(),
    isSupplier: z.boolean(),
  })

export type BranchFormSchemaValues = z.infer<ReturnType<typeof branchFormSchema>>
