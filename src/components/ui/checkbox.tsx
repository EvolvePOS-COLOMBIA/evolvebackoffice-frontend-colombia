import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Casilla de verificación (primitiva radix, estilo shadcn del proyecto).
 *
 * **Usos posibles:**
 * - Selección múltiple en listas, tablas y tableros (p. ej. el kanban de órdenes
 *   para asignar varios pedidos a un domiciliario).
 * - Casillas de opciones en formularios (términos, permisos, configuraciones).
 * - Filtros multi-valor (seleccionar varios criterios a la vez).
 * - Confirmaciones explícitas antes de acciones (marcar "entregado", "recibido").
 *
 * Estados soportados de radix: `checked`, `unchecked` e `indeterminate`
 * (`checked="indeterminate"` muestra el guion intermedio, útil en "seleccionar
 * todo" cuando solo hay una parte marcada).
 */
function Checkbox({ className, checked, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checked}
      className={cn(
        "peer flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border border-border bg-background shadow-xs transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-primary-foreground"
      >
        {checked === "indeterminate" ? <Minus className="size-3" /> : <Check className="size-3" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
