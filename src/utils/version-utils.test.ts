import { describe, expect, it } from "vitest"

import {
  buildVersionPackageFileName,
  getNextVersionNumber,
  isValidSemVer,
  serializeVersionChanges,
  sortVersionsByPublishedAt,
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

describe("sortVersionsByPublishedAt", () => {
  it("sorts by publishedAtUtc descending", () => {
    const sorted = sortVersionsByPublishedAt([
      { id: "1", publishedAtUtc: "2026-06-01T10:00:00.000Z" },
      { id: "2", publishedAtUtc: "2026-06-11T10:00:00.000Z" },
      { id: "3", publishedAtUtc: "2026-01-01T00:00:00.000Z" },
    ])

    expect(sorted.map((item) => item.id)).toEqual(["2", "1", "3"])
  })
})

describe("buildVersionPackageFileName", () => {
  it("builds a zip file name from software name and version", () => {
    expect(buildVersionPackageFileName("Evolve POS BackOffice", "1.0.0")).toBe("Evolve-POS-BackOffice-1.0.0.zip")
  })

  it("falls back to a generic software name when it is missing", () => {
    expect(buildVersionPackageFileName(null, "2.5.1")).toBe("software-2.5.1.zip")
  })
})

describe("getNextVersionNumber", () => {
  it("returns the default initial version when there are no valid versions", () => {
    expect(getNextVersionNumber([])).toBe("1.0.0.0")
    expect(getNextVersionNumber([null, undefined, "invalid"])).toBe("1.0.0.0")
  })

  it("increments the latest valid four-part semantic version", () => {
    expect(getNextVersionNumber(["1.0.0.0", "1.0.0.9", "1.0.0.2"])).toBe("1.0.0.10")
    expect(getNextVersionNumber(["1.2.4.8", "1.10.0.3", "1.9.9.9"])).toBe("1.10.0.4")
  })
})

describe("serializeVersionChanges", () => {
  it("serializes changes with trimmed descriptions", () => {
    expect(
      serializeVersionChanges([
        {
          id: "change-1",
          type: "Feature",
          description: "  Added the new reporting module.  ",
        },
      ])
    ).toBe('[{"id":"change-1","type":"Feature","description":"Added the new reporting module."}]')
  })
})
