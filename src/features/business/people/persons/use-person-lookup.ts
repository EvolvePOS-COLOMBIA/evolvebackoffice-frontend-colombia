import { useCallback, useState } from "react"

import { findPersonByIdentification } from "./persons.service"
import type { PersonResponseDto } from "./types"

/**
 * Precarga de datos desde la tabla Persons compartida (usuarios, clientes y
 * proveedores). Los formularios de creación lo invocan al salir del campo de
 * número de identificación (y con el botón "Buscar persona") para traer los
 * datos ya registrados y evitar volver a digitar toda la información.
 */
export function usePersonLookup() {
  const [isLooking, setIsLooking] = useState(false)

  const lookup = useCallback(
    async (identificationTypeId: number, identificationNumber: string): Promise<PersonResponseDto | null> => {
      const number = identificationNumber?.trim() ?? ""
      if (!number) return null

      setIsLooking(true)
      try {
        return await findPersonByIdentification(identificationTypeId, number)
      } catch {
        // Sin red o con error el formulario sigue siendo usable manualmente.
        return null
      } finally {
        setIsLooking(false)
      }
    },
    []
  )

  return { lookup, isLooking }
}
