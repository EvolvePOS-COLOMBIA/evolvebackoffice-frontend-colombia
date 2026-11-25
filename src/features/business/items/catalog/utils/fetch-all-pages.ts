export type PageResult<T> = { data: T[]; totalCount: number }

/**
 * Pide páginas consecutivas hasta tener `totalCount` elementos (o recibir una página vacía).
 * `maxPages` evita un bucle infinito si el backend reporta un total inconsistente.
 */
export async function fetchAllPages<T>(
  fetchPage: (pageNumber: number) => Promise<PageResult<T>>,
  maxPages = 50
): Promise<PageResult<T>> {
  const data: T[] = []
  let totalCount = 0

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const page = await fetchPage(pageNumber)
    totalCount = page.totalCount
    data.push(...page.data)
    if (page.data.length === 0 || data.length >= totalCount) break
  }

  return { data, totalCount }
}
