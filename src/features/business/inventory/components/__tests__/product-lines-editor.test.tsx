/// <reference types="@testing-library/jest-dom/vitest" />
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nextProvider } from "react-i18next"

import i18n from "@/i18n/index"
import { ProductLinesEditor, type ProductLine } from "../product-lines-editor"
import type { QuantityUnitValue } from "../../utils/units"
import { BASE_UNIT, BASE_UNIT_KEY } from "../../utils/units"

vi.mock("@/features/business/items/catalog/hooks/use-items", () => ({
  useItems: () => ({ data: { data: [] }, isLoading: false }),
}))

vi.mock("../../hooks/use-inventory", () => ({
  useStock: () => ({ data: undefined, isLoading: false }),
  useItemPackagings: () => ({ data: PACKAGINGS }),
}))

// El select de Radix no funciona en happy-dom: un select nativo con las mismas opciones.
vi.mock("../quantity-unit-input", () => ({
  QuantityUnitInput: ({ value, onChange }: { value: QuantityUnitValue; onChange: (v: QuantityUnitValue) => void }) => (
    <select aria-label="unidad" value={value.unitKey} onChange={(e) => onChange({ ...value, unitKey: e.target.value })}>
      <option value={BASE_UNIT_KEY}>und</option>
      <option value="caja">Caja</option>
    </select>
  ),
}))

const PACKAGINGS = [{ id: "caja", name: "Caja x12", factor: 12, isDefaultPurchase: false }]

const LINE: ProductLine = {
  itemId: "pan",
  name: "Pan",
  sku: null,
  baseUnit: BASE_UNIT.unit,
  quantity: { amount: "2", unitKey: BASE_UNIT_KEY },
  unitCost: "1000",
  priceBase: { sale: 1000, cost: 600 },
  linePrice: { mode: "sale", percent: "", special: "" },
}

function renderEditor() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(["item-packagings", "pan"], PACKAGINGS)
  let current: ProductLine[] = [LINE]

  function Harness() {
    const [lines, setLines] = useState<ProductLine[]>([LINE])
    current = lines
    return <ProductLinesEditor lines={lines} onChange={setLines} priceMode={{ noBaseLabel: "sin precio" }} />
  }

  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>
    </QueryClientProvider>
  )
  return { lines: () => current }
}

describe("ProductLinesEditor price mode", () => {
  it("recomputes the line price when the bulk percentage is applied", () => {
    const editor = renderEditor()

    fireEvent.change(screen.getByLabelText(i18n.t("price_percent", { ns: "business-inventory" })), {
      target: { value: "10" },
    })
    fireEvent.click(screen.getByRole("button", { name: i18n.t("price_bulk_apply", { ns: "business-inventory" }) }))

    expect(editor.lines()[0].linePrice?.mode).toBe("percent")
    expect(editor.lines()[0].unitCost).toBe("1100")
  })

  it("converts the price to the chosen packaging", () => {
    const editor = renderEditor()

    fireEvent.change(screen.getByLabelText("unidad"), { target: { value: "caja" } })

    expect(editor.lines()[0].unitCost).toBe("12000")
  })
})
