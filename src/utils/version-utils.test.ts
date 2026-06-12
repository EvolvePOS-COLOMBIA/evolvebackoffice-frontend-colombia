import { describe, expect, it } from "vitest"

import {
  generateSoftwareCode,
  groupChangesByCategory,
  isValidSemVer,
} from "@/utils/version-utils"

describe("isValidSemVer", () => {
  it("accepts the four-part numeric format", () => {
    expect(isValidSemVer("1.0.0.0")).toBe(true)
    expect(isValidSemVer("10.25.3.19")).toBe(true)
  })

  it("rejects incomplete or alphabetic formats", () => {
    expect(isValidSemVer("1.0.0")).toBe(false)
    expect(isValidSemVer("1.0.a.0")).toBe(false)
    expect(isValidSemVer("v1.0.0.0")).toBe(false)
  })
})

describe("generateSoftwareCode", () => {
  it("builds readable codes from the software name", () => {
    expect(generateSoftwareCode("Evolve POS BackOffice", [])).toBe(
      "SW-EVOLVEPOSBACKOFFICE"
    )
  })

  it("avoids collisions by adding an incremental suffix", () => {
    const existing = ["SW-EVOLVEPOSBACKOFFICE", "SW-EVOLVEPOSBACKOFFICE-2"]

    expect(generateSoftwareCode("Evolve POS BackOffice", existing)).toBe(
      "SW-EVOLVEPOSBACKOFFICE-3"
    )
  })
})

describe("groupChangesByCategory", () => {
  it("groups and orders changes according to the enum order", () => {
    const groups = groupChangesByCategory([
      {
        id: "1",
        versionId: "v1",
        category: "Bug Fix",
        description: "Fixes save flow",
      },
      {
        id: "2",
        versionId: "v1",
        category: "Feature",
        description: "Adds sync flow",
      },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.type).toBe("Feature")
    expect(groups[1]?.type).toBe("Bug Fix")
  })
})
