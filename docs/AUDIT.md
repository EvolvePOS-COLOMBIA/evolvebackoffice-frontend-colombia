# Auditoría del proyecto — EvolvePOS BackOffice (frontend)

- **Fecha:** 2026-11-17
- **Rama / commit base:** `fix/orders-backlog-ec-1-4` sobre `main` @ `be5e7e7`
- **Alcance:** todo `src/` (≈420 archivos TS/TSX), tooling, CI, y recorrido manual en el navegador de las 26 vistas de negocio y las 8 de plataforma.
- **Método:** (1) `format:check`, `typecheck`, `lint` y `test` locales; (2) cuatro auditorías de código por área, en modo solo lectura; (3) app levantada con `bun run dev`, sesión iniciada con las credenciales por defecto del formulario y recorrido de cada ruta con captura de pantalla y consola; (4) verificación propia de los hallazgos más importantes.
- **Leyenda de confianza:** **[V]** verificado por mí en código o en la app · **[A]** reportado por la auditoría de código, con `archivo:línea`, sin reproducir en la app.

> No se modificó ningún archivo de `src/`. Este documento es el único cambio, junto con `CLAUDE.md` y `.claude/launch.json`.

---

## 1. Resumen ejecutivo

**Salud base: buena.** Sobre `main` actual:

| Check                 | Resultado                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `prettier --check`    | OK                                                                                          |
| `tsc -b` (typecheck)  | OK                                                                                          |
| `eslint .`            | 0 errores, 1 warning (`step-branch.tsx:79`, `form.watch()` incompatible con React Compiler) |
| `vitest run`          | 23 archivos, 135 tests, todos pasan                                                         |
| Consola del navegador | Sin errores en ninguna de las vistas recorridas                                             |
| i18n es/en            | Paridad de claves completa en los 31 pares de JSON                                          |

**Lo que más importa** (detalle en las secciones siguientes):

1. **Seguridad:** credenciales reales hardcodeadas como valores por defecto del login y enviadas en el bundle; sesión (con `accessToken` y `refreshToken`) persistida en `localStorage`; guards de rutas solo en cliente y sin granularidad entre los roles de plataforma.
2. **Backlog Jira EC-1…EC-4:** causa raíz identificada para los cuatro (sección 3). EC-2 y parte de EC-4 reproducidos en la app.
3. **Bugs funcionales nuevos, no estaban en Jira:** el tablero de órdenes sale vacío con "Todas las sucursales" aunque el contador dice 10; el cierre de órdenes cuenta mal "pendientes"; edición de sucursal puede borrar fechas de venta; el formulario de producto descarta ediciones al refetch.
4. **Robustez:** no hay error boundary ni `errorElement`, ni lazy loading de rutas; la mayoría de las páginas no maneja `isError`.
5. **Cobertura de tests baja:** 23 archivos de test para ≈420 de código; auth, axios, guards, store, DataTable y casi todos los servicios sin tests. Los specs E2E de Playwright **no están versionados** (`tests/*` está en `.gitignore`).
6. **Consistencia:** dos implementaciones de `formatCurrency`, mezcla de `toast`/`notify`, invalidación de caché de React Query incompleta, patrones de listado distintos entre catálogo e inventario.

---

## 2. Hallazgos críticos y altos

### 2.1 Seguridad

| #   | Hallazgo                                                                                                                                                                                                                                                                                                                                                                  | Evidencia                                                                                        | Conf. |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| S1  | **Credenciales hardcodeadas** como `defaultValues` del login (tenant, correo y contraseña de negocio y de plataforma). Viajan en el bundle de producción. Rotar las contraseñas y quitar los defaults (o condicionarlos a `import.meta.env.DEV`).                                                                                                                         | `src/features/auth/components/login-form.tsx:36-48`                                              | V     |
| S2  | La sesión completa se persiste en `localStorage` (`pos-manager-storage`), incluido `accessToken` y `refreshToken`. Cualquier XSS la exfiltra. El `refreshToken` no se usa en ningún lado: no hay flujo de refresh.                                                                                                                                                        | `src/store/app-store.ts:113`, `src/config/axios-client.ts:41-54`                                 | V/A   |
| S3  | `logout` solo limpia estado local; no llama al backend, el refresh token no se revoca.                                                                                                                                                                                                                                                                                    | `src/features/auth/hooks/use-auth.ts:316-320`                                                    | A     |
| S4  | Todas las rutas `/platform/*` aceptan los tres roles de plataforma; no hay `allowedRoles` por ruta. `PlatformSubAdmin` y `PlatformSupervisor` llegan a usuarios, email, IA, logs y auditoría. El sidebar solo reconoce `isPlatformAdmin` (los otros dos ven el menú de negocio y terminan en `/unauthorized`). Los guards son solo UX: el backend debe aplicar los roles. | `src/routes/app-routes.tsx:74-87`, `src/components/layout/sidebar.tsx:105-119`                   | A     |
| S5  | El cliente confía en el JWT sin verificar para expiración y rol. `isPlatformRole` acepta `"admin"`. El login de negocio no valida que el rol devuelto sea de negocio.                                                                                                                                                                                                     | `src/features/auth/services/auth.service.ts:82-91,122,139-150,186`                               | A     |
| S6  | Contraseñas temporales de admin mostradas en un toast que se autodescarta (sin botón de copiar; se filtran en screen shares). `tenant-create-page` ya tiene un componente `CreatedField` correcto; reutilizarlo.                                                                                                                                                          | `tenants-page.tsx:125-126`, `tenant-detail-page.tsx:82`, `platform-user-form-dialog.tsx:106-107` | A     |
| S7  | `onboarding.service.saveBusinessProfile` fija `maxBranches:1, maxUsers:5, identificationTypeId:1` con un cast: puede sobrescribir los límites de licencia del tenant.                                                                                                                                                                                                     | `src/features/business/onboarding/services/onboarding.service.ts:48-58`                          | A     |
| S8  | `src/config/env.ts` cae a `http://localhost:5000` si falta la variable en un build de producción. `.env-example` define `VITE_API_URL` pero el código también lee `VITE_API_BASE_URL`.                                                                                                                                                                                    | `src/config/env.ts:1,6`                                                                          | A     |
| S9  | `vercel.json` solo tiene el rewrite SPA: sin CSP ni `X-Frame-Options`.                                                                                                                                                                                                                                                                                                    | `vercel.json`                                                                                    | A     |
| S10 | Los borradores del onboarding (documento, teléfono, correo) se persisten en `localStorage` y solo se limpian en `finish()`.                                                                                                                                                                                                                                               | `src/store/app-store.ts:113-121`                                                                 | A     |
| S11 | `tests/seed/fixtures.ts` contiene credenciales de admin en claro. Hoy está sin versionar por el `.gitignore`, pero quitar esa regla las commitearía.                                                                                                                                                                                                                      | `tests/seed/fixtures.ts:15-18`                                                                   | A     |

### 2.2 Bugs funcionales

| #   | Hallazgo                                                                                                                                                                                                                                              | Evidencia                                                                           | Conf. |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----- |
| B1  | **Tablero de órdenes vacío con "Todas las sucursales"**: el chip "Todas" muestra 10 pero todas las columnas dicen "Sin órdenes en la ventana" y `$ 0`. Con "Sede Bogotá" sí aparecen órdenes.                                                         | Pantalla `/business/orders`                                                         | V     |
| B2  | **Cierre de órdenes:** "pending_orders" y "total_orders" usan el mismo valor (`preview.ordersCount`); uno de los dos es incorrecto.                                                                                                                   | `orders/pages/order-closing-page.tsx:137,139`                                       | A     |
| B3  | **Editar ítem por sucursal borra fechas de venta**: el `useEffect` de `form.reset` omite `saleStartDate`/`saleEndDate`; tras un refetch quedan `undefined` y el submit envía `null`.                                                                  | `items/catalog/components/branch-item-edit-dialog.tsx:100-125`                      | A     |
| B4  | **Formulario de producto descarta ediciones sin guardar** cuando cambia la referencia de `item` (refetch o foco de ventana). Además resetea `extendedDescription` y `subDescription1-3` a `null` y se envían en el update.                            | `items/catalog/pages/item-form-page.tsx:119-143`                                    | A     |
| B5  | **Asignar ítems a sucursales** dispara N×M `mutate()` sin esperar; muestra éxito y cierra el diálogo aunque fallen. Además solo asigna los de la página actual, aunque la selección persiste entre páginas.                                           | `items-catalog-page.tsx:94-123`, `global-catalog-view.tsx:93`                       | A     |
| B6  | **Selección de DataTable por índice de fila** (`String(i)`), no por id. Se corrompe al cambiar de página, refetch u ordenar. Falta prop `getRowId`.                                                                                                   | `src/components/data-table/data-table.tsx:52,128,134,137`                           | A     |
| B7  | **Idioma:** i18n arranca en `es`; el `locale` persistido no se sincroniza con `i18n.language` al iniciar. Un usuario en inglés recarga con textos en español y formato en-US/USD. `<html lang>` fijo en `en`.                                         | `src/i18n/index.ts:161`, `src/store/app-store.ts:75`, `index.html:2`                | A     |
| B8  | **Posible loop de onboarding:** `forcePasswordChange` tiene prioridad sobre `localCompleted`, pero el wizard no tiene paso de contraseña.                                                                                                             | `onboarding/hooks/use-onboarding-status.ts:43-47`                                   | A     |
| B9  | Esquemas con `min(0)` que nunca validan: `tenantPublicId` (header `X-Tenant-Id` puede ir vacío), `departmentId`, `itemType`. `z.coerce.number()` convierte `""` en `0`.                                                                               | `auth/schemas/login-schema.ts:12`, `items/catalog/schemas/item-schema.ts:6-8`       | A     |
| B10 | Estadísticas de ventas/producción paginan **todo el historial en el cliente** (hasta 500 páginas × 100) en cada carga y tras cada mutación. Tormenta de requests; debe agregarse en el backend.                                                       | `inventory/services/sales.service.ts:67-88`, `production.service.ts:42-65`          | A     |
| B11 | Dashboard de tenants de plataforma y listas de clientes/proveedores truncan silenciosamente a 100 filas; las tarjetas de total/activos/inactivos quedan mal con más de 100 tenants.                                                                   | `platform-dashboard-page.tsx:9`, `use-customers.ts:15`, `use-suppliers.ts:15`       | A     |
| B12 | `produce-dialog` permite enviar con el preview de una cantidad anterior (`keepPreviousData`) → faltantes y costos desactualizados.                                                                                                                    | `inventory/production/components/produce-dialog.tsx:84-92,141`                      | A     |
| B13 | Recepción de órdenes de compra: sin validar sobre-recepción respecto a lo pendiente; el despacho envía líneas con cantidad 0.                                                                                                                         | `purchase-orders/components/order-detail-dialog.tsx:116-170`                        | A     |
| B14 | `cancel-order-dialog`: la `key` del formulario incluye `items.length`; al llegar el detalle tarde se remonta y se pierde lo escrito.                                                                                                                  | `orders/components/cancel-order-dialog.tsx:404`                                     | A     |
| B15 | Gráficas con colores `hsl(var(--muted))` / `hsl(var(--border))` mientras las variables CSS son `oklch`: color inválido. Todas las series del chat de IA se formatean como moneda, incluso conteos.                                                    | `active-orders-card.tsx:54`, `ai-chat/components/chat-chart-block.tsx:26,27,88-140` | A     |
| B16 | Años `2025/2026` hardcodeados en el comparativo año contra año: se rompe en 2027.                                                                                                                                                                     | `dashboard/components/year-on-year-chart.tsx:20-21`                                 | A     |
| B17 | El sidebar **parpadea**: al cargar una ruta aparecen primero solo Dashboard, Artículos, Inventario, Personas, Reportes y Configuración; Órdenes, Domicilios y Asistente IA aparecen segundos después (layout shift mientras cargan módulos/licencia). | Observado al abrir `/business/items/catalog/new`                                    | V     |

### 2.3 Robustez y arquitectura

| #   | Hallazgo                                                                                                                                                                                                                                                                                                                                                                                                          | Conf. |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| R1  | **Sin error boundary ni `errorElement`** en todo `src/` (0 coincidencias). Un error de render deja la app en blanco.                                                                                                                                                                                                                                                                                              | V     |
| R2  | **Sin lazy loading de rutas** (0 usos de `lazy`): bundle único con shiki, recharts y react-markdown.                                                                                                                                                                                                                                                                                                              | V     |
| R3  | **Falta manejo de `isError`** en la mayoría de listados y paneles: clientes, proveedores, usuarios, métodos de pago, tenants, logs, auditoría, email, IA, dashboard de plataforma, stock, ventas, órdenes de compra, transferencias, producción, catálogos. Un fallo se ve como lista vacía.                                                                                                                      | A     |
| R4  | **Invalidación de caché incompleta:** `INVENTORY_KEYS` omite `inventory-margins`, `production-products`, `production-stats`, `branch-items`; compras, producción y ventas no invalidan márgenes ni `branch-items`; `use-items`, departamentos y tasas de impuesto no invalidan `branch-items`; `useSaveRecipe` no invalida `production-products`/`item-recipe`. Resultado: pantallas con datos viejos tras mutar. | A     |
| R5  | Ítem de errores de mutación: ~15 handlers usan `error instanceof Error ? error.message : …`; los errores de axios son `Error`, así que el usuario ve "Request failed with status code 400". `getApiErrorMessage` existe y casi no se usa.                                                                                                                                                                         | A     |
| R6  | Sin timeout en axios, sin manejo de 403 ni de error de red; `retry: 1` global reintenta también 4xx; sin `staleTime` ni defaults de mutaciones.                                                                                                                                                                                                                                                                   | A     |
| R7  | CI (`.github/workflows/ci.yml`) no corre Playwright, ni cobertura ni `bun audit`. El hook de pre-commit solo ejecuta prettier (no lint ni typecheck).                                                                                                                                                                                                                                                             | A     |
| R8  | Las órdenes se piden en una sola página de 500 sin aviso de truncamiento; sucursales limitadas a 50/100; 200/500 filas fijas en selectores de ítems, departamentos e impuestos.                                                                                                                                                                                                                                   | A     |

---

## 3. Backlog de Jira (proyecto EC) — causa raíz

### EC-1 · No se visualiza el estado de la orden

- `order-card.tsx` no pinta insignia ni texto de estado; solo se infiere por la columna del kanban. **[V]** visualmente en `/business/orders`.
- Los estados fuera de `KANBAN_COLUMNS` son invisibles: `ManualOrderDialog` ofrece `NeedsReview` como estado inicial, pero `ORDER_STATUS_CONFIG` no tiene `NeedsReview` ni `Refunded` y `ordersByStatus` solo agrupa columnas conocidas. Esas órdenes desaparecen del tablero. En la pantalla de cierre se ven estados `NEEDSREVIEW`/`READY`/`DELIVERED` en crudo. **[A]** + **[V]**
- Canceladas ocultas por defecto (`showCancelled=false`); solo se activan desde el modal de filtros.
- `order-detail-dialog.tsx:137` muestra `order.statusName` (valor viejo del listado) en vez de `current.statusName`.
- Etiquetas de estado hardcodeadas en español (`orders/types/index.ts:19-27`), sin i18n.
- Relacionado con B1: con "Todas las sucursales" el tablero ni siquiera lista las órdenes.

### EC-2 · La rueda del ratón no hace scroll al listar productos en "Crear Orden"

- **Reproducido [V]:** con el selector de productos abierto, `scroll` sobre la lista no la mueve.
- Causa: la lista (`manual-order-dialog.tsx:241`, `max-h-64 overflow-y-auto`) vive dentro de un `PopoverContent` que se renderiza por portal en `document.body` (`ui/popover.tsx:25`), fuera del `DialogContent`. `react-remove-scroll` del Dialog bloquea los eventos de rueda fuera de su contenido.
- Opciones de arreglo: `<Popover modal>`, pasar `container` al `PopoverPortal` apuntando al diálogo, o `onWheel={e => e.stopPropagation()}` en la lista.
- Colateral: solo se cargan 100 ítems (`:65-68`) y la búsqueda es local; catálogos grandes se truncan.

### EC-3 · Formato de peso con separadores en vivo en inputs monetarios

- No existe un `MoneyInput` compartido; `ui/input.tsx` es un `<input>` pelado y todos los campos de dinero son `type="number"`, que no puede mostrar separadores.
- Campos de dinero detectados (todos deben migrar a un componente común):
  - Órdenes: `manual-order-dialog.tsx:354` (precio unitario) y `:482` (envío); `edit-order-dialog.tsx:153`
  - Domicilios: `deliver-order-dialog.tsx:260,315`; `activate-domiciliario-dialog.tsx:89`; `shift-movement-dialog.tsx:87`
  - `branches/components/branch-delivery-settings.tsx:216`
  - `people/credit/components/credit-dialog.tsx:158`
  - Inventario: `inventory/components/line-price-input.tsx:62`; `product-lines-editor.tsx:233`
  - `items/catalog/components/branch-item-edit-dialog.tsx:157`
  - `items/modifiers/components/item-modifier-form-dialog.tsx:272`
- `utils/format.ts` y `use-locale-format.ts` solo sirven para mostrar, no para entrada.

### EC-4 · No se visualizan los productos de una orden

- **Reproducido [V] (parcial):** en las tarjetas del kanban el resumen de líneas muestra `3 productos · 1 × undefined, 2 × undefined…`. El nombre sale de `item.nameSnapshot` (`order-card.tsx:86,238`); los tests lo simulan con ese campo, pero la API real parece devolver otra propiedad. **Pendiente de confirmar contra la respuesta real de `/api/orders/:id`.**
- `order-detail-dialog.tsx` pide el detalle (`:29`) pero **nunca renderiza `detail.items`** (el docstring promete productos; no hay sección de ítems en `:98-162`).
- `OrderListItem` no trae ítems; el detalle se pide perezosamente solo si la tarjeta es prioritaria (índice < 8), está en hover o expandida. Si falla el fetch no se muestra nada. Hasta ~48 requests de detalle al cargar (8 por columna × 6).

---

## 4. Hallazgos medios

**Accesibilidad**

- Botones de selección de DataTable sin `type`, `aria-label` ni `aria-pressed`; `key={rowIndex}` (`data-table.tsx:72,125,133`).
- `ItemCard` (hubs de Configuración, Reportes y Personas) es un `Card` clicable sin `role`, `tabIndex` ni teclado: no es accesible por teclado (`business/components/item-card.tsx:23-28`).
- Botones solo-icono sin nombre accesible: `credentials-dialog.tsx:95`, `integration-panel.tsx:641`, miniaturas y "seleccionar todo" del catálogo, tarjetas de `branch-selector` y `recipe-lines-editor`, inputs numéricos de `ProductLinesEditor`.
- `Label` sin `htmlFor` en `deliver-order-dialog.tsx`; sin `DialogDescription` en varios diálogos; estados que dependen solo del color; sin `aria-live` en el chat.
- 30 usos de `text-[8–11px]`: legibilidad baja en badges.

**i18n / textos**

- Fallbacks hardcodeados en inglés en DataTable, paginación, `dialog`/`sheet` ("Close") y `aria-label` del navbar.
- Cadenas en español fijas fuera de i18n: `orders-page.tsx:530-558`, `order-detail-dialog.tsx:131,146-154`, `item-form-page.tsx:204` (`eyebrow="Item"`), etiquetas de gráficas en inglés, `auth.service.ts` (errores en inglés mostrados en toasts).
- Claves usadas pero ausentes en el JSON del catálogo: `suggest_applied_images`, `suggest_desc_images`. Unas 66 claves de catálogo y 58 de inventario sin uso literal.
- Hay un mapeo `featureNs.replace(/-/g, "/")` en `i18n/index.ts:219` que rompería cualquier feature nueva con guion y carga perezosa.
- `Namespace` incluye `"platform-clients"` sin recursos.
- Placeholders con marca vieja ("PosCo Platform", `noreply@posco.com`) en email-settings.

**Formato de dinero y unidades**

- Dos implementaciones de `formatCurrency` en desacuerdo: `utils/format.ts` (siempre 2 decimales) y `useLocaleFormat` (Intl por defecto); ambas incorrectas para COP. `active-orders-card.tsx:117` usa `$` y `toFixed(2)`.
- `inventory/utils/units.ts` lee el store de forma imperativa (no re-renderiza al cambiar el idioma) y oculta centavos.
- Semántica de `unitPrice` distinta según endpoint (por unidad base vs por empaque); solo hay un comentario como protección.

**Búsqueda y datos**

- Búsqueda sin debounce en stock, ventas y editor de líneas (una request por tecla); debounce artesanal sin limpieza en los catálogos.
- Búsqueda de órdenes de compra, transferencias y producción filtra solo la página cargada (10 filas) y oculta la paginación al buscar.
- Catálogo sin `keepPreviousData`: parpadea el skeleton en cada cambio de página.
- Dos rutas distintas para cambiar stock (`adjustBranchItemStock` crudo vs auditado en `stock-dialogs`).
- "Stock bajo" cuenta como bajo un ítem con punto de reorden 0 y cantidad 0; el stat "productos" cambia con la búsqueda.

**Consistencia de código**

- `react-hot-toast` importado directo en 6 archivos en vez del wrapper `notify`.
- 7 archivos llaman `useQuery` directo en componentes/páginas en lugar de un hook en `hooks/`.
- Varias vistas usan tabla cruda en vez de `DataTable` (branch-config, terminales, domicilios, varios diálogos).
- `resolver as never` / `as unknown as Resolver` en ≥10 sitios (esconde desajustes de tipos de `z.coerce`); `vite.config.ts` usa un cast global porque importa `defineConfig` de `vite` y no de `vitest/config`.
- Cast de errores `{response?...}` repetido; `apiErrorMessage` duplicado en `manual-order-dialog` y `edit-order-dialog`.
- `window.confirm` en lugar de `AlertDialog` en cierre de órdenes, chat, tenants y métodos de pago.
- `useBranches(1, 50)`/`(1, 100)` y otros topes silenciosos.

**Componentes y pantallas**

- Botón "Menú" muerto en `OrdersPage` (`:590-597`), con `aria-label` duplicado.
- Botones de impresión, guardar, ajustes del dashboard y "ver todas" solo muestran "not_implemented".
- `OrderClosingPage` solo es accesible por URL (su botón está comentado).
- `OrdersPage` (751 líneas) con mucho código comentado; `ordersByStatus` sin memoizar, `ALL_BRANCHES` redefinido por render, lectura de `localStorage` sin try/catch.
- El chat de IA no muestra el mensaje del usuario hasta que responde el servidor (sin optimistic update); Enter ignora composición IME.
- El tema: atajo `d` activa el tema incluso con Ctrl/Cmd/Alt y dentro de inputs; el modo "system" no reacciona a cambios del SO.
- `shiki` sin `catch` para lenguaje desconocido y con tema claro por defecto.

---

## 5. Hallazgos bajos

- **Código muerto:** `create-local-order-dialog.tsx` (con el único TODO del proyecto), `addOrderProduct`/`removeOrderProduct`, tipos `CluviMenu*`, `dashboard/mock/dashboard-data.ts` (421 líneas importadas solo por tipos), `step-modules.tsx`, `business-module-placeholder.tsx`, `updateItemSchema`, `createBranchItemSchema`, `getBranchItemById`, `useCreateBranchItem`, `useDeleteItem`, `useTaxRateDefaults`, `pendingPassword` del store.
- **Duplicación:** `normalize()`/`matches()` copiados tres veces en `search.ts`; normalizadores de paginación copiados en impuestos, departamentos y modificadores; `getSalesStats` ≡ `getProductionStats`; lógica de activar/desactivar/reset repetida en tres páginas de tenants; selección de módulos duplicada entre `tenant-form-dialog` y `tenant-create-page`.
- **Archivos grandes:** `tenant-form-dialog` (797), `orders-page` (751), `integration-panel` (742), `registers-page` (693), `tenant-create-page` (676), `item-form-page` (608), `tenant-detail-page` (565), `produce-dialog` (525), `manual-order-dialog` (524), `branch-config-page` (497), `tenants-page` (492), `delivery-page` (486).
- **Acoplamiento circular:** inventario importa de `items/catalog` y `items/catalog` importa hooks de inventario.
- **Errores tragados:** `use-person-lookup.ts:23` (catch vacío), `console.error` en `branch-terminals.service.ts:53`.
- **Otros:** regex de bebidas con la palabra "te" y typo "quatro" (`order-helpers.ts:28`); variable `t` sombreada en el dashboard; `Spinner` sin `role="status"` y con prop `IsButton` en PascalCase; `whatsapp-desktop.ts` asume números colombianos; `window.open` sin `noopener` en `share-dialog.tsx:46`; sin `returnTo` tras login o expiración; `expireSession()` usa `notify.info` en vez de error.

---

## 6. Tooling, dependencias y repositorio

| #   | Hallazgo                                                                                                                                                                                                                                                                       | Conf. |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| T1  | **Lockfiles duplicados versionados:** `package-lock.json` y `bun.lock`, con `packageManager: bun@1.2.4` y CI con `bun install --frozen-lockfile`. Borrar el de npm.                                                                                                            | V     |
| T2  | **`tests/*` está en `.gitignore`**; 0 archivos de `tests/` versionados. Los specs Playwright y el seed viven solo en una máquina.                                                                                                                                              | V     |
| T3  | `.atl/` (registro de skills) está versionado: ruido de herramienta.                                                                                                                                                                                                            | V     |
| T4  | Dependencia `cn` (paquete npm) usada en 5 archivos, mientras ~51 usan `@/lib/utils`. Unificar y quitar `cn` (y revisar `clsx`/`tailwind-merge`).                                                                                                                               | A     |
| T5  | Se mezclan el paquete `radix-ui` y los `@radix-ui/react-*` individuales; `lucide-react` (159 archivos) convive con `@phosphor-icons/react` (1 archivo); `shadcn` (CLI) está como dependencia de runtime; `recharts` fijado exacto (`3.8.0`).                                   | A     |
| T6  | Versiones inusuales: `typescript ~6`, `eslint ^10`, `vite ^8`; `tailwindcss` y `@tailwindcss/vite` con `^4` desnudo.                                                                                                                                                           | A     |
| T7  | ESLint solo con `tseslint.recommended` (sin type-check), sin `jsx-a11y`; `tsconfig.app.json` sin `noUncheckedIndexedAccess`; `tsconfig.json` raíz con `paths` suelto junto a `files: []`.                                                                                      | A     |
| T8  | `README.md` tiene 24 bytes. `API_REFERENCE.md` (40 KB, 2026-08-18) está en español, menciona `/login/admin` y `/login/pos` que ya no existen como páginas; probable desactualización, debería vivir en `docs/`. `TODO-CATALOG.md` es una lista de bugs abiertos sin verificar. | V/A   |
| T9  | `dist/`, `test-results/`, `.playwright-mcp/`, `.env`, `.codegraph/` existen localmente pero **no** están versionados. Sin fuga.                                                                                                                                                | V     |

---

## 7. Cobertura de tests

- **Existe (23 archivos / 135 tests):** utilidades de búsqueda de compras, transferencias y producción; `lines`, `units`, `pricing`; `order-card`, `cancel-order`, `chat-panel`; `session-expiry`; servicios de sucursales y de usuarios de plataforma; `tenant-detail-page`.
- **No existe cobertura para:** `useAuth`, `auth.service` (parseo de JWT y mapeo de roles), interceptores de axios, `ProtectedRoute`, `OnboardingGate`, persistencia del store, `api-error.ts`, `format.ts`, `use-locale-format`, `DataTable`, `OrdersPage`/kanban/mapeo de estados, `manual-order-dialog`, `order-detail-dialog`, todo el módulo de domicilios (incluida la validación de efectivo/pagos), dashboard, onboarding, personas (usuarios, clientes, proveedores, crédito), registers, métodos de pago, email/IA/logs/auditoría, y todo `items/` (departamentos, impuestos, modificadores, esquemas, `prepare-image`, conversiones de tasas).
- **E2E:** hay `tests/item-form-rail.spec.ts` y `tests/seed/*`, sin versionar y sin ejecutarse en CI.

---

## 8. Qué falta

- Componente `MoneyInput` (y `QuantityInput`) compartido.
- Error boundary global y por ruta; `React.lazy` + `Suspense`.
- Estado de error estándar (`isError` → `ErrorState`) reutilizable en listados.
- Fábrica de query keys única para todas las features, e invalidación centralizada.
- Capa de errores unificada (`getApiErrorMessage` en todos los handlers, interceptor de 403/red/timeout).
- Estados visibles de orden (insignia) incluyendo `NeedsReview`, `Refunded` y canceladas.
- Verificación de roles por ruta en plataforma y revisión del flujo de refresh/logout con el backend.
- README con instrucciones de arranque, variables de entorno y convenciones; mover `API_REFERENCE.md` a `docs/`.
- Paginación y búsqueda en servidor para clientes, proveedores, departamentos, impuestos y selectores de ítems.
- Endpoints de agregación en backend para las estadísticas de ventas y producción.
- Módulos aún "próximamente": Reportes (todas las tarjetas deshabilitadas), inventario físico, varias tarjetas de Configuración.

---

## 9. Recorrido manual de vistas

Entorno: `bun run dev` en `localhost:5175`, sesión de negocio y luego de plataforma con las credenciales por defecto del formulario. Consola sin errores en todas las rutas.

| Ruta                                                            | Estado         | Notas                                                                                                 |
| --------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `/business/dashboard`                                           | OK             | Tarjetas con datos; botones sin implementar.                                                          |
| `/business/orders`                                              | **Con fallos** | B1 (vacío en "Todas las sucursales"), EC-1, EC-4 (`undefined`), órdenes "hace 10 días" en Confirmado. |
| `/business/orders` → Crear Orden                                | **Con fallos** | EC-2 reproducido; EC-3 por código.                                                                    |
| `/business/orders/closing`                                      | OK con reparos | Estados en crudo; B2.                                                                                 |
| `/business/delivery`                                            | OK             | Sin domiciliarios ni turnos en los datos de prueba.                                                   |
| `/business/items/catalog` (+ `/new`)                            | OK             | El formulario de creación carga bien.                                                                 |
| `/business/items/departments` · `taxes`                         | OK             |                                                                                                       |
| `/business/items/modifiers`                                     | OK             | Vacío (estado vacío correcto).                                                                        |
| `/business/inventory/stock`                                     | OK             |                                                                                                       |
| `/business/inventory/purchase-orders`                           | OK             |                                                                                                       |
| `/business/inventory/transfers` · `production`                  | OK             | Skeleton visible 3 s; cargan después.                                                                 |
| `/business/inventory/sales`                                     | OK             | Muestra un frame en blanco antes del estado vacío.                                                    |
| `/business/people/users` · `suppliers` · `customers`            | OK             |                                                                                                       |
| `/business/reports`                                             | Parcial        | Todo "próximamente".                                                                                  |
| `/business/ai-chat`                                             | OK             | No se envió ninguna consulta.                                                                         |
| `/business/settings/branches` · `registers` · `payment-methods` | OK             |                                                                                                       |
| `/platform/dashboard` · `tenants` · `tenants/create` · `users`  | OK             |                                                                                                       |
| `/platform/email-settings` · `ai-settings`                      | OK             | SMTP "No configurado"; IA "Configurada".                                                              |
| `/platform/logs` · `audit`                                      | OK             | Logs con 367 advertencias y 3252 avisos en la ventana.                                                |

**No recorridas:** `/business/onboarding`, `/business/branches/:id/config`, `/business/branches/:id/settings/terminals`, `/platform/tenants/:id`, `/forgot-password`, `/reset-password`, página de marketing. No se ejecutó ninguna acción que modifique datos (no se creó, editó ni borró nada).

---

## 10. Plan sugerido

**Primero (rápido, alto valor)**

1. Quitar credenciales por defecto del login y rotarlas (S1).
2. Resolver EC-1…EC-4 en este orden: EC-4 (confirmar el campo real del ítem y renderizar `detail.items`) → EC-1 (insignia de estado + estados faltantes) → EC-2 (`Popover modal`) → EC-3 (`MoneyInput` común).
3. Corregir B1 (tablero vacío con todas las sucursales) y B2 (cierre).
4. Error boundary global y `React.lazy` de rutas.
5. Borrar `package-lock.json`; versionar `tests/` sin credenciales.

**Después** 6. Estado `isError` estándar y `getApiErrorMessage` en todos los handlers. 7. Fábrica de query keys + invalidación completa. 8. Selección por id en `DataTable` (`getRowId`). 9. Roles por ruta en plataforma y sidebar con `isPlatformUser`. 10. Sincronizar idioma persistido con i18n y `<html lang>`.

**Backend / acordar con el equipo**

- Refresh token y revocación en logout; agregaciones de estadísticas; búsqueda y paginación en servidor; límites de licencia en onboarding.

**Deuda**

- Unificar `formatCurrency`; tests de auth, axios, guards y store; E2E en CI; limpiar código muerto y dependencias duplicadas; documentación.
