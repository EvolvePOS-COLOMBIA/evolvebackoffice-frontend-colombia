/** Cómo se fija el precio de una línea al vender (a un cliente o a otra sucursal). */
export type PriceMode = "sale" | "percent" | "cost" | "special"

export type LinePrice = {
  mode: PriceMode
  /** % sobre el precio de venta (o sobre el costo si no tiene precio de venta) (modo "percent"). */
  percent: string
  /** Precio escrito a mano (modo "special"). */
  special: string
}

/** Precio de venta y costo de quien vende, en la unidad mostrada (null = no tiene). */
export type PriceBase = { sale: number | null; cost: number | null }

/** Normaliza: un precio o costo en 0 o negativo cuenta como "no tiene". */
export function priceBase(sale: number | null | undefined, cost: number | null | undefined): PriceBase {
  return { sale: sale != null && sale > 0 ? sale : null, cost: cost != null && cost > 0 ? cost : null }
}

/** La misma base en otra unidad (ej. de unidad base a paquete × 40). */
export function scaleBase(base: PriceBase, factor: number): PriceBase {
  return { sale: base.sale != null ? base.sale * factor : null, cost: base.cost != null ? base.cost * factor : null }
}

/** Arranca en el precio de venta; si el producto no tiene, en el costo. */
export function defaultLinePrice(base: PriceBase): LinePrice {
  return { mode: base.sale == null && base.cost != null ? "cost" : "sale", percent: "", special: "" }
}

export const DEFAULT_LINE_PRICE: LinePrice = { mode: "sale", percent: "", special: "" }

/** Sobre qué se sube el %: el precio de venta o, si no tiene, el costo. */
export function percentBase(base: PriceBase): number | null {
  return base.sale ?? base.cost
}

/** Precio resultante por la unidad mostrada. Devuelve null si no se puede calcular. */
export function resolvePrice(base: PriceBase, price: LinePrice): number | null {
  switch (price.mode) {
    case "special": {
      if (price.special.trim() === "") return null
      const special = Number(price.special)
      return Number.isFinite(special) && special >= 0 ? special : null
    }
    case "sale":
      return base.sale
    case "cost":
      return base.cost
    case "percent": {
      const over = percentBase(base)
      if (over === null) return null
      const percent = Number(price.percent || 0)
      if (!Number.isFinite(percent)) return null
      const result = Math.round(over * (1 + percent / 100) * 100) / 100
      return result >= 0 ? result : null
    }
  }
}
