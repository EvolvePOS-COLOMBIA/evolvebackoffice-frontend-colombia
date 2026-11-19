/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { Badge } from "../badge"
import { Switch } from "../switch"

describe("Badge live option", () => {
  it("renders exactly as before when live is not set", () => {
    const { container } = render(<Badge tone="success">Activa</Badge>)
    expect(container.querySelector("[data-slot=badge-live]")).toBeNull()
    expect(screen.getByText("Activa").className).not.toContain("gap-1.5")
  })

  it("adds a decorative pulsing dot when live", () => {
    const { container } = render(
      <Badge tone="success" live>
        Activa
      </Badge>
    )
    const dot = container.querySelector("[data-slot=badge-live]")
    expect(dot).not.toBeNull()
    expect(dot).toHaveAttribute("aria-hidden", "true")
    expect(dot!.className).toContain("animate-pulse")
  })
})

describe("Switch glow option", () => {
  it("has no glow by default", () => {
    render(<Switch aria-label="on" defaultChecked />)
    expect(screen.getByRole("switch").className).not.toContain("shadow-[0_0_14px")
  })

  it("glows while checked when asked", () => {
    render(<Switch glow aria-label="on" defaultChecked />)
    expect(screen.getByRole("switch").className).toContain("data-[state=checked]:shadow-[0_0_14px")
  })

  it("still behaves like a switch", () => {
    render(<Switch glow aria-label="on" />)
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false")
  })
})
