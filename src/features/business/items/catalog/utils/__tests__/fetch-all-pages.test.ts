import { describe, expect, it, vi } from "vitest"

import { fetchAllPages } from "../fetch-all-pages"

const makeSource = (total: number, pageSize: number) =>
  vi.fn(async (pageNumber: number) => {
    const start = (pageNumber - 1) * pageSize
    const data = Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, i) => start + i)
    return { data, totalCount: total }
  })

describe("fetchAllPages", () => {
  it("returns a single page when everything fits", async () => {
    const fetchPage = makeSource(30, 100)
    const result = await fetchAllPages(fetchPage)
    expect(result.data).toHaveLength(30)
    expect(result.totalCount).toBe(30)
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it("keeps requesting pages until totalCount is reached", async () => {
    const fetchPage = makeSource(250, 100)
    const result = await fetchAllPages(fetchPage)
    expect(result.data).toHaveLength(250)
    expect(result.data[249]).toBe(249)
    expect(fetchPage).toHaveBeenCalledTimes(3)
    expect(fetchPage).toHaveBeenNthCalledWith(3, 3)
  })

  it("stops on an empty page even if totalCount says there is more", async () => {
    const fetchPage = vi.fn(async (pageNumber: number) => ({
      data: pageNumber === 1 ? [1, 2] : [],
      totalCount: 10,
    }))
    const result = await fetchAllPages(fetchPage)
    expect(result.data).toEqual([1, 2])
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it("never exceeds maxPages", async () => {
    const fetchPage = vi.fn(async () => ({ data: [1], totalCount: 1000 }))
    await fetchAllPages(fetchPage, 5)
    expect(fetchPage).toHaveBeenCalledTimes(5)
  })
})
