# Items Catalog — Pendientes

## 🔴 Bugs abiertos

### 1. Búsqueda server-side
- **Problema**: La búsqueda actual filtra solo los items de la página actual (client-side). Si hay 200 items y solo cargas 20, no encuentras los demás.
- **Solución**: Pasar el parámetro `search` al API `GET /api/Items?search=...` para que el backend filtre.
- **Archivos**: `global-catalog-view.tsx`, `services/items.service.ts`, `hooks/use-items.ts`
- **Esfuerzo**: Medio

### 2. `rounded-lg` perdido en Table
- **Problema**: Quedó un diff sin commitear en `src/components/ui/table.tsx` — tiene un `rounded-lg` extra que no se incluyó en el commit anterior.
- **Solución**: Commitear el cambio o revertirlo.
- **Archivos**: `src/components/ui/table.tsx`
- **Esfuerzo**: Bajo

---

## 🟡 Funcionalidad incompleta

### 3. Reset de paginación al buscar
- **Problema**: Al escribir en el campo de búsqueda, la página no se resetea a 1. Si estás en página 3 y buscas, puedes quedarte en una página vacía.
- **Solución**: Agregar `setPage(1)` en el handler del input de búsqueda.
- **Archivos**: `global-catalog-view.tsx`
- **Esfuerzo**: Bajo

### 4. Empty states diferenciados
- **Problema**: El mensaje "No hay items" es genérico. No distingue entre "el catálogo está vacío" y "no se encontraron resultados para tu búsqueda".
- **Solución**: Mostrar "No hay items en el catálogo" cuando no hay búsqueda activa, y "No se encontraron resultados para '{search}'" cuando hay búsqueda sin resultados.
- **Archivos**: `global-catalog-view.tsx`, `branch-catalog-view.tsx`
- **Esfuerzo**: Bajo

### 5. Loading skeleton
- **Problema**: Al cargar muestra solo texto "Cargando...". No hay indicación visual de la estructura que se va a renderizar.
- **Solución**: Mostrar skeleton rows de la tabla (Skeleton components de shadcn) que imiten la forma de las filas reales.
- **Archivos**: `global-catalog-view.tsx`, `branch-catalog-view.tsx`
- **Esfuerzo**: Medio

### 6. Manejo de errores API
- **Problema**: Si el API falla (red, 500, timeout), no hay feedback al usuario. Solo falla silenciosamente.
- **Solución**: Usar react-query `onError` o componentes de error state inline. Mostrar toast con mensaje de error y opción de reintentar.
- **Archivos**: `hooks/use-items.ts`, `hooks/use-branch-items.ts`, `pages/items-catalog-page.tsx`
- **Esfuerzo**: Medio

---

## 🟢 Mejoras de UX

### 7. Confirmación antes de asignar
- **Problema**: Al asignar items a una sucursal, se hace directamente sin resumen previo. Si el usuario selecciona 20 items por error, no hay vuelta atrás fácil.
- **Solución**: Antes de ejecutar la asignación, mostrar un diálogo de confirmación con resumen: "Vas a asignar {count} productos a {branchNames}".
- **Archivos**: `pages/items-catalog-page.tsx`
- **Esfuerzo**: Bajo

### 8. Toast de éxito
- **Problema**: Después de crear, actualizar o eliminar un item, no hay feedback visual de que la operación fue exitosa.
- **Solución**: Usar el componente Toast de la app para mostrar mensajes como "Item creado correctamente", "Item asignado a {branch}", etc.
- **Archivos**: `hooks/use-items.ts`, `hooks/use-branch-items.ts`, `pages/items-catalog-page.tsx`
- **Esfuerzo**: Bajo

### 9. Validación de duplicados
- **Problema**: Al asignar un item que ya existe en la sucursal, puede fallar silenciosamente o crear un duplicado dependiendo del backend.
- **Solución**: Consultar los items actuales de la sucursal antes de asignar. Si algún item ya existe, mostrar warning: "Los siguientes items ya están asignados: {names}" y permitir omitirlos.
- **Archivos**: `pages/items-catalog-page.tsx`, `services/branch-items.service.ts`
- **Esfuerzo**: Medio

### 10. Filtros avanzados
- **Problema**: Solo hay búsqueda por texto. No se puede filtrar por departamento, tipo de item, estado, o rango de precios.
- **Solución**: Agregar dropdowns/filtros para:
  - Departamento (select)
  - Tipo de item (select)
  - Estado (activo/inactivo toggle)
  - Rango de precios (dual range slider o inputs)
- **Archivos**: `global-catalog-view.tsx`, `services/items.service.ts`
- **Esfuerzo**: Alto

---

## 🔵 Infraestructura

### 11. Tests unitarios
- **Qué cubrir**:
  - Hooks: `useItems`, `useBranchItems`, `useDeleteItem`, `useDeleteBranchItem`
  - Schemas Zod: `createItemSchema`, `updateItemSchema`, `createBranchItemPricingSchema`, `updateBranchItemPricingSchema`
  - Servicios: `items.service.ts`, `branch-items.service.ts` (mock del API)
- **Herramientas**: Vitest + React Testing Library
- **Esfuerzo**: Alto

### 12. Tests de integración
- **Qué cubrir**:
  - Flujo completo: crear item → asignar a sucursal → verificar precio/stock
  - Flujo de búsqueda: escribir → verificar resultados
  - Flujo de paginación: navegar páginas → verificar contenido
  - Flujo de eliminación: eliminar item → verificar que desaparece
- **Herramientas**: Playwright o Cypress
- **Esfuerzo**: Alto

---

## Resumen

| # | Tarea | Prioridad | Esfuerzo | Estado |
|---|-------|-----------|----------|--------|
| 1 | Búsqueda server-side | 🔴 Alta | Medio | Pendiente |
| 2 | Rounded-lg fix | 🔴 Alta | Bajo | Pendiente |
| 3 | Reset paginación al buscar | 🟡 Media | Bajo | Pendiente |
| 4 | Empty states diferenciados | 🟡 Media | Bajo | Pendiente |
| 5 | Loading skeleton | 🟡 Media | Medio | Pendiente |
| 6 | Error handling + toasts | 🔴 Alta | Medio | Pendiente |
| 7 | Confirmación pre-asignación | 🟢 Baja | Bajo | Pendiente |
| 8 | Toast de éxito | 🟡 Media | Bajo | Pendiente |
| 9 | Validación duplicados | 🟡 Media | Medio | Pendiente |
| 10 | Filtros avanzados | 🟢 Baja | Alto | Pendiente |
| 11 | Tests unitarios | 🟡 Media | Alto | Pendiente |
| 12 | Tests de integración | 🟡 Media | Alto | Pendiente |
