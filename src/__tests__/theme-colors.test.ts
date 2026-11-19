import { describe, expect, it } from "vitest"

/**
 * The theme variables (--border, --muted, --background, …) are defined in oklch/hex, not as
 * bare HSL channels. Wrapping them as `hsl(var(--x))` yields an invalid color, which made
 * chart grid lines and rings render with `stroke: none`.
 */
const sources = import.meta.glob("/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>

const INVALID_WRAPPER = new RegExp("hsl\\(\\s*var\\(--")

describe("theme colors", () => {
  it("never wraps a theme variable in hsl()", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith("theme-colors.test.ts"))
      .filter(([, content]) => INVALID_WRAPPER.test(content))
      .map(([path]) => path)
      .sort()

    expect(offenders).toEqual([])
  })
})
