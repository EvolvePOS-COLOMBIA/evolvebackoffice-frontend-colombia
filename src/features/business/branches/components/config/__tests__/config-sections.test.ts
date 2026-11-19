import { describe, expect, it } from "vitest"

import { CONFIG_SECTIONS, parseConfigSection, sectionsForLicense } from "../config-sections"

describe("parseConfigSection", () => {
  it("accepts every registered section", () => {
    for (const section of CONFIG_SECTIONS) {
      expect(parseConfigSection(section.id)).toBe(section.id)
    }
  })

  it("keeps old deep links working", () => {
    expect(parseConfigSection("serials")).toBe("terminals")
  })

  it("falls back to the info section", () => {
    expect(parseConfigSection(null)).toBe("info")
    expect(parseConfigSection("nonsense")).toBe("info")
  })
})

describe("sectionsForLicense", () => {
  it("hides delivery when the tenant has no DOMICILIOS license", () => {
    expect(sectionsForLicense(false).map((s) => s.id)).not.toContain("delivery")
    expect(sectionsForLicense(true).map((s) => s.id)).toContain("delivery")
  })

  it("keeps the sections of each group together and in order", () => {
    const groups = sectionsForLicense(true).map((s) => s.group)
    expect(groups).toEqual(
      [...groups].sort(
        (a, b) =>
          ["general", "operation", "integrations"].indexOf(a) - ["general", "operation", "integrations"].indexOf(b)
      )
    )
  })
})
