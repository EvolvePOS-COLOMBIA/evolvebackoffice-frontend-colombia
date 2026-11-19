# Tareas propuestas para Jira (proyecto EC)

Derivadas de `docs/AUDIT.md` (2026-11-17). Los IDs entre paréntesis remiten a esa auditoría.
Tipo: **Bug** / **Seguridad** / **Arquitectura** / **Mejora** / **Deuda**. Prioridad: Alta / Media / Baja.
Las tareas EC-1…EC-4 ya existen en Jira y no se repiten aquí.

## Épica: Seguridad y sesión

| #   | Tipo      | Prio  | Título                                                                                                               | Origen  |
| --- | --------- | ----- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Seguridad | Alta  | Quitar credenciales por defecto del login y rotar las contraseñas expuestas                                          | S1      |
| 2   | Seguridad | Alta  | Definir y aplicar roles por ruta en `/platform/*`; sidebar con los tres roles de plataforma                          | S4      |
| 3   | Seguridad | Alta  | Sesión: no persistir `refreshToken` en `localStorage`; implementar refresh y revocación en logout (requiere backend) | S2, S3  |
| 4   | Seguridad | Media | Validar expiración y rol del JWT en cliente; rechazar roles no esperados en cada login                               | S5      |
| 5   | Seguridad | Media | Mostrar contraseñas temporales con un componente persistente con botón de copiar (reutilizar `CreatedField`)         | S6      |
| 6   | Seguridad | Media | Onboarding: no sobrescribir `maxBranches`/`maxUsers`/`identificationTypeId` con valores fijos                        | S7      |
| 7   | Seguridad | Media | Falla explícita si falta `VITE_API_URL` en producción; unificar con `VITE_API_BASE_URL`                              | S8      |
| 8   | Seguridad | Media | Cabeceras de seguridad en `vercel.json` (CSP, `X-Frame-Options`, etc.)                                               | S9      |
| 9   | Seguridad | Baja  | Limpiar borradores de onboarding persistidos al abandonar el flujo o cerrar sesión                                   | S10     |
| 10  | Seguridad | Baja  | Versionar `tests/` sin credenciales en claro (variables de entorno)                                                  | S11, T2 |

## Épica: Bugs funcionales

| #   | Tipo | Prio  | Título                                                                                                    | Origen  |
| --- | ---- | ----- | --------------------------------------------------------------------------------------------------------- | ------- |
| 11  | Bug  | Alta  | Tablero de órdenes vacío con "Todas las sucursales"                                                       | B1      |
| 12  | Bug  | Alta  | Formulario de producto descarta ediciones y resetea descripciones al refetch                              | B4      |
| 13  | Bug  | Alta  | Editar ítem por sucursal borra `saleStartDate`/`saleEndDate`                                              | B3      |
| 14  | Bug  | Alta  | Asignar ítems a sucursales: esperar resultados, reportar fallos y soportar selección entre páginas        | B5      |
| 15  | Bug  | Media | Cierre de órdenes: `pending_orders` y `total_orders` usan el mismo valor                                  | B2      |
| 16  | Bug  | Media | `DataTable`: selección por id de fila (`getRowId`) en lugar de por índice                                 | B6      |
| 17  | Bug  | Media | Idioma persistido no se sincroniza con i18n ni con `<html lang>` al recargar                              | B7      |
| 18  | Bug  | Media | Posible bucle de onboarding con `forcePasswordChange`                                                     | B8      |
| 19  | Bug  | Media | Esquemas zod que nunca validan (`tenantPublicId`, `departmentId`, `itemType`, `z.coerce`)                 | B9      |
| 20  | Bug  | Media | `produce-dialog` envía con el preview de una cantidad anterior                                            | B12     |
| 21  | Bug  | Media | Recepción de órdenes de compra: validar sobre-recepción y líneas con cantidad 0                           | B13     |
| 22  | Bug  | Baja  | `cancel-order-dialog` pierde lo escrito al llegar tarde el detalle                                        | B14     |
| 23  | Bug  | Baja  | Gráficas con colores inválidos (`hsl(var(--…))` con variables `oklch`) y series de IA siempre como moneda | B15     |
| 24  | Bug  | Baja  | Años 2025/2026 fijos en el comparativo año contra año                                                     | B16     |
| 25  | Bug  | Baja  | Sidebar parpadea mientras carga la licencia de módulos                                                    | B17     |
| 26  | Bug  | Baja  | Datos truncados en silencio a 50/100/500 filas (tenants, clientes, proveedores, órdenes, selectores)      | B11, R8 |

## Épica: Rendimiento y datos

| #   | Tipo         | Prio  | Título                                                                                            | Origen |
| --- | ------------ | ----- | ------------------------------------------------------------------------------------------------- | ------ |
| 27  | Arquitectura | Alta  | Estadísticas de ventas y producción: agregar en backend en vez de paginar el historial en cliente | B10    |
| 28  | Mejora       | Media | Búsqueda en servidor con debounce (stock, ventas, compras, transferencias, producción, catálogos) | Sec. 4 |
| 29  | Mejora       | Media | `keepPreviousData` en catálogo y paginaciones                                                     | Sec. 4 |
| 30  | Mejora       | Media | Detalle de órdenes del tablero: evitar hasta ~48 requests al cargar                               | EC-4   |

## Épica: Robustez y arquitectura

| #   | Tipo         | Prio  | Título                                                                       | Origen |
| --- | ------------ | ----- | ---------------------------------------------------------------------------- | ------ |
| 31  | Arquitectura | Alta  | Error boundary global y por ruta (`errorElement`)                            | R1     |
| 32  | Arquitectura | Media | `React.lazy` + `Suspense` en rutas                                           | R2     |
| 33  | Arquitectura | Alta  | Estado `isError` estándar (`ErrorState`) en todos los listados               | R3     |
| 34  | Arquitectura | Media | Fábrica única de query keys e invalidación completa de caché                 | R4     |
| 35  | Arquitectura | Media | Usar `getApiErrorMessage` en todos los handlers de mutación                  | R5     |
| 36  | Arquitectura | Media | Axios: timeout, manejo de 403 y error de red; no reintentar 4xx; `staleTime` | R6     |
| 37  | Deuda        | Baja  | Mover `useQuery` directo de componentes/páginas a hooks                      | Sec. 4 |
| 38  | Deuda        | Baja  | Romper el acoplamiento circular entre inventario e `items/catalog`           | Sec. 5 |

## Épica: Componentes compartidos

| #   | Tipo   | Prio  | Título                                                                             | Origen |
| --- | ------ | ----- | ---------------------------------------------------------------------------------- | ------ |
| 39  | Mejora | Alta  | `MoneyInput`/`QuantityInput` compartidos y migración de los 12 campos (cubre EC-3) | EC-3   |
| 40  | Deuda  | Media | Unificar `formatCurrency` (COP sin decimales) y `useLocaleFormat`                  | Sec. 4 |
| 41  | Deuda  | Baja  | Reemplazar `window.confirm` por `AlertDialog`                                      | Sec. 4 |
| 42  | Deuda  | Baja  | Usar `notify` en lugar de `react-hot-toast` directo                                | Sec. 4 |

## Épica: Accesibilidad e i18n

| #   | Tipo   | Prio  | Título                                                                                                                           | Origen |
| --- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 43  | Mejora | Media | Accesibilidad de teclado: `ItemCard`, selección de `DataTable`, botones solo-icono sin `aria-label`, labels sin `htmlFor`        | Sec. 4 |
| 44  | Mejora | Media | Textos fuera de i18n (estados de orden, órdenes, fallbacks en inglés, errores de `auth.service`) y claves faltantes del catálogo | Sec. 4 |
| 45  | Mejora | Baja  | Atajo `d` del tema: ignorar modificadores e inputs; modo "system" reactivo                                                       | Sec. 4 |

## Épica: Tooling, tests y documentación

| #   | Tipo   | Prio  | Título                                                                              | Origen |
| --- | ------ | ----- | ----------------------------------------------------------------------------------- | ------ |
| 46  | Deuda  | Media | Eliminar `package-lock.json` y `.atl/` del repositorio                              | T1, T3 |
| 47  | Mejora | Alta  | Tests de auth, interceptores de axios, guards, store y `DataTable`                  | Sec. 7 |
| 48  | Mejora | Media | Playwright en CI y `bun audit`                                                      | R7, T2 |
| 49  | Deuda  | Baja  | Pre-commit con lint y typecheck; reglas `jsx-a11y` y `noUncheckedIndexedAccess`     | T7     |
| 50  | Deuda  | Baja  | Depurar dependencias duplicadas (`cn`, `radix-ui`, `phosphor`, `shadcn` en runtime) | T4, T5 |
| 51  | Deuda  | Baja  | README real y mover `API_REFERENCE.md` a `docs/`                                    | T8     |
| 52  | Deuda  | Baja  | Limpiar código muerto y archivos grandes (listados en la auditoría, sec. 5)         | Sec. 5 |
