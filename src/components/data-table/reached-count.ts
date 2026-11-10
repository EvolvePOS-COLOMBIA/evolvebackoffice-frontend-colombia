/**
 * Registros alcanzados hasta la página actual (la última fila visible).
 * Devuelve null cuando no hay datos que mostrar. La última página se detecta
 * con totalPages, nunca con page * shown: en una última página parcial shown
 * es menor que el tamaño de página y esa fórmula daría un resultado incorrecto.
 */
export function computeReachedCount(page: number, shown: number, total: number, totalPages: number): number | null {
  if (total <= 0 || shown <= 0 || totalPages <= 0 || page < 1) return null
  if (page >= totalPages) return total
  return Math.min(page * shown, total)
}
