/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { FIELD_SURFACE_CLASS } from "../field-surface"
import { Input } from "../input"
import { Select, SelectTrigger, SelectValue } from "../select"
import { Textarea } from "../textarea"

const SURFACE_TOKENS = FIELD_SURFACE_CLASS.split(" ")

function classesOf(element: Element | null) {
  return (element?.getAttribute("class") ?? "").split(/\s+/)
}

describe("form field surface", () => {
  it("defines the Input surface as the single source of truth", () => {
    expect(FIELD_SURFACE_CLASS).toBe("bg-white dark:bg-secondary")
  })

  it("applies the shared surface to Input, Textarea and SelectTrigger", () => {
    const { container } = render(
      <div>
        <Input />
        <Textarea />
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      </div>
    )

    const input = container.querySelector("[data-slot=input]")
    const textarea = container.querySelector("[data-slot=textarea]")
    const trigger = container.querySelector("[data-slot=select-trigger]")

    for (const element of [input, textarea, trigger]) {
      const classes = classesOf(element)
      for (const token of SURFACE_TOKENS) expect(classes).toContain(token)
    }
  })

  it("no longer uses the previous per-component backgrounds", () => {
    const { container } = render(
      <div>
        <Textarea />
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      </div>
    )

    expect(classesOf(container.querySelector("[data-slot=textarea]"))).not.toContain("bg-card/70")
    expect(classesOf(container.querySelector("[data-slot=select-trigger]"))).not.toContain("bg-input")
  })
})
