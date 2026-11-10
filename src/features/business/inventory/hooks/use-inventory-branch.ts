import { useEffect, useMemo, useState } from "react"

import { useBranches } from "@/features/business/branches/hooks/use-branches"
import type { Branch } from "@/features/business/branches/types"

const STORAGE_KEY = "inventory-branch-id"

function readStoredBranch(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Sucursal con la que se trabaja en Inventario. Se recuerda durante la sesión
 * para que la portada y las pantallas internas muestren la misma sucursal.
 */
export function useInventoryBranch() {
  const { data, isLoading } = useBranches(1, 100)
  const branches = useMemo<Branch[]>(() => (data?.data ?? []).filter((b) => b.isActive), [data?.data])
  const [selectedId, setSelectedId] = useState<string | null>(readStoredBranch)

  const branch = branches.find((b) => b.id === selectedId) ?? branches[0] ?? null

  useEffect(() => {
    if (!branch) return
    try {
      sessionStorage.setItem(STORAGE_KEY, branch.id)
    } catch {
      // Sin sessionStorage (modo privado): se usa solo el estado en memoria.
    }
  }, [branch])

  return { branches, branch, branchId: branch?.id ?? null, selectBranch: setSelectedId, isLoading }
}
