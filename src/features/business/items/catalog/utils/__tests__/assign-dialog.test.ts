import { describe, expect, it } from "vitest"

import type { ItemResponseDto } from "../../types"
import { buildAssignPayload, filterItems, getSelectableIds, splitAndSortItems, toggleSelectAll } from "../assign-dialog"

const makeItem = (id: string, name: string, sku: string | null = null): ItemResponseDto =>
  ({ id, name, sku }) as unknown as ItemResponseDto

const a = makeItem("a", "Hamburguesa", "HAM-1")
const b = makeItem("b", "Gaseosa", "GAS-1")
const c = makeItem("c", "Papas", null)
const d = makeItem("d", "Ensalada", "ENS-9")

describe("splitAndSortItems", () => {
  it("pone los disponibles primero y los asignados despues, con orden estable", () => {
    const result = splitAndSortItems([a, b, c, d], new Set(["a", "c"]))
    expect(result.map((i) => i.id)).toEqual(["b", "d", "a", "c"])
  })

  it("sin asignados conserva el orden", () => {
    expect(splitAndSortItems([a, b], new Set()).map((i) => i.id)).toEqual(["a", "b"])
  })
})

describe("filterItems", () => {
  it("filtra por nombre sin distinguir mayusculas", () => {
    expect(filterItems([a, b], "GASE").map((i) => i.id)).toEqual(["b"])
  })

  it("filtra por sku", () => {
    expect(filterItems([a, b, c], "ham-1").map((i) => i.id)).toEqual(["a"])
  })

  it("query vacio devuelve todo y tolera sku nulo", () => {
    expect(filterItems([a, c], "")).toHaveLength(2)
    expect(filterItems([c], "zzz")).toHaveLength(0)
  })
})

describe("getSelectableIds", () => {
  it("excluye los ya asignados", () => {
    expect(getSelectableIds([a, b, c], new Set(["b"]))).toEqual(["a", "c"])
  })
})

describe("toggleSelectAll", () => {
  it("selecciona todos si no estan todos seleccionados, conservando otros", () => {
    const result = toggleSelectAll(new Set(["a", "x"]), ["a", "b"])
    expect([...result].sort()).toEqual(["a", "b", "x"])
  })

  it("limpia solo esos ids si ya estan todos seleccionados", () => {
    const result = toggleSelectAll(new Set(["a", "b", "x"]), ["a", "b"])
    expect([...result]).toEqual(["x"])
  })

  it("sin ids seleccionables no cambia nada", () => {
    expect([...toggleSelectAll(new Set(["x"]), [])]).toEqual(["x"])
  })
})

describe("buildAssignPayload", () => {
  it("select-items asigna SOLO a la sucursal destino (regresion BC-26)", () => {
    const payload = buildAssignPayload("select-items", {
      selectedItemIds: new Set(["a", "b"]),
      items: [a, b, c],
      targetBranchId: "branch-1",
      selectedBranchIds: new Set(["other-1", "other-2"]),
      assignedItemIds: new Set(),
    })
    expect(payload?.branchIds).toEqual(["branch-1"])
    expect(payload?.items.map((i) => i.id)).toEqual(["a", "b"])
  })

  it("select-items nunca incluye articulos ya asignados", () => {
    const payload = buildAssignPayload("select-items", {
      selectedItemIds: new Set(["a", "b"]),
      items: [a, b],
      targetBranchId: "branch-1",
      selectedBranchIds: new Set(),
      assignedItemIds: new Set(["b"]),
    })
    expect(payload?.items.map((i) => i.id)).toEqual(["a"])
  })

  it("select-items sin sucursal destino o sin seleccion devuelve null", () => {
    const base = { items: [a], selectedBranchIds: new Set<string>(), assignedItemIds: new Set<string>() }
    expect(
      buildAssignPayload("select-items", { ...base, selectedItemIds: new Set(["a"]), targetBranchId: null })
    ).toBeNull()
    expect(buildAssignPayload("select-items", { ...base, selectedItemIds: new Set(), targetBranchId: "b1" })).toBeNull()
  })

  it("select-branch usa los articulos recibidos y las sucursales elegidas", () => {
    const payload = buildAssignPayload("select-branch", {
      selectedItemIds: new Set(),
      items: [a, b],
      targetBranchId: null,
      selectedBranchIds: new Set(["x", "y"]),
      assignedItemIds: new Set(),
    })
    expect(payload?.branchIds).toEqual(["x", "y"])
    expect(payload?.items).toHaveLength(2)
  })

  it("select-branch sin sucursales elegidas devuelve null", () => {
    expect(
      buildAssignPayload("select-branch", {
        selectedItemIds: new Set(),
        items: [a],
        targetBranchId: null,
        selectedBranchIds: new Set(),
        assignedItemIds: new Set(),
      })
    ).toBeNull()
  })
})
