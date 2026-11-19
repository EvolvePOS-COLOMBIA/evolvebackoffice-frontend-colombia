/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { Bike } from "lucide-react"

import { ModuleRequiredState } from "../module-required-state"

function setup(overrides: Partial<React.ComponentProps<typeof ModuleRequiredState>> = {}) {
  const onAction = vi.fn()
  render(
    <ModuleRequiredState
      icon={Bike}
      title="Domicilios no está activo"
      description="Asigna el módulo."
      unlocks={["Base", "Porcentaje", "Anticipo"]}
      actionLabel="Ir a módulos"
      onAction={onAction}
      {...overrides}
    />
  )
  return onAction
}

describe("ModuleRequiredState", () => {
  it("explains what is missing and what the module unlocks", () => {
    setup()
    expect(screen.getByText("Domicilios no está activo")).toBeInTheDocument()
    expect(screen.getByText("Asigna el módulo.")).toBeInTheDocument()
    for (const item of ["Base", "Porcentaje", "Anticipo"]) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
  })

  it("offers a direct way to assign the module", () => {
    const onAction = setup()
    fireEvent.click(screen.getByRole("button", { name: "Ir a módulos" }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("shows the hint only when there is one", () => {
    setup({ hint: "Revisa la licencia." })
    expect(screen.getByText("Revisa la licencia.")).toBeInTheDocument()
  })

  it("omits the chips when nothing is listed", () => {
    setup({ unlocks: [] })
    expect(screen.queryByRole("list")).toBeNull()
  })
})
