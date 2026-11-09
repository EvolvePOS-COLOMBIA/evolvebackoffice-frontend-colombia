# Módulo de Domicilios — Diseño de frontend

Diseño de la UI del módulo de domicilios sobre la implementación del backend
(`BackendPOS/openspec/specs/domicilios/{configuracion,pedidos,turnos}` y endpoints
B8b/B14 de `AGENTS.md`). Este documento registra las decisiones, la estructura de la
feature, los componentes nuevos (con sus usos posibles) y las vistas existentes que se
tocan. Es la referencia de mantenimiento del módulo.

## 1. Contexto y alcance

El backend ya implementa:

- **Configuración por sucursal** (`GET/PUT /api/branches/{branchId}/delivery-settings`):
  base de dinero, % de valor de domicilio (default 100 %) y modelo de anticipo
  (`advanceMode`: 0 = con anticipo, 1 = sin anticipo).
- **Ubicación de la sucursal** (`Branch.Latitude/Longitude`): obligatoria para
  asignar/conservar el módulo `DOMICILIOS` a la sucursal.
- **Domiciliarios**: usuarios rol `DELIVERY` con teléfono obligatorio; activación =
  abrir turno con base editable (`POST /api/delivery/domiciliarios/{userId}/activate`).
- **Turnos y libro de efectivo** (`/api/delivery/shifts*`): movimientos
  (`BaseAssigned`, `ExtraBase`, `PartialPickup`, `OrderAdvance`, `DeliveryCollection`,
  `AdvanceRefund`), dinero esperado en mano y cuadre de cierre.
- **Pedidos**: asignación obligatoria de domiciliario al pasar a `Shipped`
  (`PUT /api/orders/{id}/status` con `deliveryUserId`), asignación múltiple
  (`PUT /api/orders/status/bulk`) y registro de entrega con pago mixto y decisión de
  devolución del anticipo (`POST /api/orders/{id}/deliver`).

### Alcance acordado

| #   | Decisión                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Opción **«Domicilios»** en el sidebar (menú business) → gestión completa B14: domiciliarios, turnos, libro de efectivo, cuadre y registro de entrega de pedidos.                                                                             |
| 2   | Configuración del módulo en la sucursal: **pestaña nueva «Domicilios»** en la configuración de la sucursal (junto a Info/Módulos/Seriales/WooCommerce/Cluvi), visible cuando el tenant tiene el módulo `DOMICILIOS` habilitado.              |
| 3   | Reutilizar componentes existentes; solo se crean componentes cuando no existen equivalentes.                                                                                                                                                 |
| 4   | Todo componente nuevo es reutilizable y documenta sus usos posibles (JSDoc en el archivo).                                                                                                                                                   |
| 5   | La vista de órdenes solo se toca para la **asignación múltiple de pedidos a un domiciliario** (checkboxes en «Listo» + barra de acciones) y el **arrastre individual a «En camino»** (pide domiciliario cuando la sucursal tiene el módulo). |
| 6   | i18n completo **es/en** en todos los textos nuevos (namespaces por feature).                                                                                                                                                                 |
| 7   | El **rol Domiciliario (`Delivery`) se agrega al formulario de usuarios** existente (Personas → Usuarios), con teléfono obligatorio.                                                                                                          |

### Fuera de alcance

- Autogestión del domiciliario (rol `DELIVERY` con su propia vista): desarrollo futuro del backend.
- Tracking en vivo, mapas, notificaciones WhatsApp (feature revertido, ver `docs/revert-jhonatan-plan.md`).
- Propinas (`Order.TipAmount`): no participa en ningún cálculo del módulo.
- Edición de la ubicación desde el formulario de creación de sucursales: queda en la pestaña «Domicilios» (decisión acordada).

## 2. Estructura de la feature

```
src/features/business/delivery/          namespace i18n: business-delivery
  types/index.ts                         DTOs del contrato B14 + delivery-settings
  services/delivery.service.ts           axios: /api/delivery/*, /api/orders/{id}/deliver
  hooks/use-delivery.ts                  TanStack Query (queryKeys + hooks)
  pages/delivery-page.tsx                /business/delivery
  components/
    assign-delivery-user-dialog.tsx      elegir domiciliario activo (1 opción)
    activate-domiciliario-dialog.tsx     activar = abrir turno con base editable
    shift-detail-dialog.tsx              turno: resumen + libro de efectivo + acciones
    shift-movement-dialog.tsx            registrar más base / recogida parcial
    close-shift-dialog.tsx               confirmar cierre + resultado del cuadre
    shift-orders-dialog.tsx              pedidos en camino → «Registrar entrega»
    deliver-order-dialog.tsx             cobro al entregar (pago mixto + anticipo)
  i18n/es.json / i18n/en.json
```

Ruta: `/business/delivery` (dentro de `ProtectedRoute BusinessAdmin → OnboardingGate →
AppLayout`, import directo como el resto — el proyecto no usa lazy loading).

### Página `/business/delivery` (Gestión de domicilios)

- **Selector de sucursal** (`BranchSelector` existente) restringido a sucursales con el
  módulo `DOMICILIOS` asignado (mismo patrón de `orders-page` con `useQueries` sobre
  `branchModulesKeys.list`). Sin sucursales con el módulo → `EmptyState` con enlace a la
  configuración de sucursales.
- **Resumen** (`StatTile`): domiciliarios activos, turnos abiertos, dinero esperado en
  mano (suma de turnos abiertos), pedidos en camino.
- **Domiciliarios**: tarjetas con filtro Todos / Activos / Inactivos. Inactivo →
  _Activar_ (abre turno con base editable). Activo → _Ver turno_, _Más base_, _Recogida_,
  _Entregar pedidos_, _Cerrar turno_.
- **Turnos**: tabla con filtro Abiertos / Cerrados; fila → detalle con movimientos y
  cuadre (`expectedCash`, `deliveryShareTotal`, `deliveryToCompany`).

### Pedidos del turno (limitación de API conocida)

El backend **no expone** `deliveryUserId`/`deliveryShiftId` en `OrderListItemDto` ni un
filtro de órdenes por turno: la única trazabilidad pedido↔turno disponible son los
`orderId` de los movimientos del turno. En consecuencia, el diálogo _Entregar pedidos_
lista los pedidos `Shipped` de la sucursal (con DOMICILIOS habilitado todo pedido
«En camino» tiene domiciliario asignado, por regla del backend) y marca los que están
vinculados al turno consultado vía movimientos. Mejora futura sugerida al backend:
`GET /api/delivery/shifts/{id}/orders` o filtro `deliveryShiftId` en `GET /api/orders`.

## 3. Contratos API consumidos

JSON camelCase; errores de negocio `400 { message }`; errores de validación `400`
mapeando propiedad → mensajes (se parsean defensivamente con `utils/api-error`).

| Llamada                                                                                                                     | Uso en la UI                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /api/delivery/domiciliarios?branchId=&status=active\|inactive`                                                         | Listado de domiciliarios (`{data, totalCount}`, no paginado)             |
| `POST /api/delivery/domiciliarios/{userId}/activate` `{branchId, baseAmount?}`                                              | Activar domiciliario (abre turno)                                        |
| `GET /api/delivery/shifts?branchId=&status=open\|closed`                                                                    | Listado de turnos                                                        |
| `GET /api/delivery/shifts/{id}` → `{shift, movements[]}`                                                                    | Detalle + libro de efectivo                                              |
| `POST /api/delivery/shifts/{id}/extra-base` \| `/pickups` `{amount, notes?}`                                                | Más base / recogida                                                      |
| `POST /api/delivery/shifts/{id}/close` (sin body)                                                                           | Cuadre de cierre                                                         |
| `GET/PUT /api/branches/{branchId}/delivery-settings` `{baseAmount?, deliveryValuePercentage?, advanceMode?}`                | Config de la sucursal (`advanceMode`: 0 con / 1 sin anticipo)            |
| `PUT /api/branches/{id}` `{name, latitude?, longitude?}`                                                                    | Ubicación de la sucursal (obligatoria con DOMICILIOS)                    |
| `PUT /api/orders/{id}/status` `{status, deliveryUserId?}`                                                                   | Asignación individual (arrastre a `Shipped`)                             |
| `PUT /api/orders/status/bulk` `{ids[] (≤50), status, deliveryUserId?}` → `{results[]}`                                      | Asignación múltiple (resultado por pedido)                               |
| `POST /api/orders/{id}/deliver` `{payments[{paymentMethodCode, amount, reference?}], returnAdvance?, advanceRefundAmount?}` | Registrar entrega (pagos suman exactamente el total)                     |
| `GET /api/payment-methods`                                                                                                  | Medios de pago para el cobro mixto (reutiliza `payment-methods.service`) |
| `GET /api/users` (rol `Delivery`) / `POST /api/users`                                                                       | Alta de domiciliarios (rol en formulario de usuarios)                    |

Estados de turno en wire: `"Open" | "Closed"` (PascalCase); estado de domiciliario:
`"active" | "inactive"` (minúsculas); tipos de movimiento: strings PascalCase.

## 4. Componentes nuevos reutilizables

Solo se crean tres piezas genéricas (el resto de la feature compone las existentes:
`Dialog`, `Card`, `Badge`, `Table`, `StatTile`, `EmptyState`, `ConfirmActionDialog`,
`BranchSelector`, `Form`, `Select`, `Input`, `notify`, etc.):

### `src/components/ui/checkbox.tsx` — `Checkbox`

Primitiva de casilla (radix) que faltaba en `components/ui`.
**Usos posibles:** selección múltiple en listas/tablas/kanban (órdenes), casillas en
formularios (términos, opciones), filtros multi-valor, aprobaciones.

### `src/components/share/selection-action-bar.tsx` — `SelectionActionBar`

Barra flotante inferior para modos de selección múltiple: contador, acción principal,
acciones secundarias y «limpiar selección».
**Usos posibles:** barra «Asignar domiciliario (N)» del kanban de órdenes, acciones
por lote en catálogo de artículos (el multi-select manual de `global-catalog-view` puede
migrarse a esta barra), existencias/inventario (dar de baja seleccionados), personas,
o cualquier lista con operaciones bulk futuras.

### `src/components/share/option-picker-dialog.tsx` — `OptionPickerDialog`

Diálogo genérico para elegir **una** opción de un catálogo: búsqueda, lista con
icono/badge/descripción por opción, estados de carga/vacío y confirmación.
**Usos posibles:** asignar un domiciliario a pedidos (`assign-delivery-user-dialog`),
elegir responsable/supervisor en workflows de aprobación, seleccionar motivo de un
catálogo (bajas, anulaciones), elegir proveedor o sucursal destino en operaciones
rápidas, elegir plantilla/modelo al crear registros.

Los diálogos de la feature (`activate-domiciliario-dialog`, `shift-movement-dialog`,
`close-shift-dialog`, `deliver-order-dialog`, `shift-orders-dialog`) son específicos del
dominio y viven en la feature, no en `components/`.

## 5. Vistas existentes modificadas

| Vista                                                                         | Cambio                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/layout/sidebar.tsx`                                               | Ítem «Domicilios» (icono `Bike`) tras «Órdenes», oculto sin el módulo `DOMICILIOS` habilitado (mismo patrón de gating que `orders`/`ai_chat`).                                                                                                                                                                                                                                          |
| `routes/app-routes.tsx`                                                       | Ruta `/business/delivery` → `DeliveryPage`.                                                                                                                                                                                                                                                                                                                                             |
| `features/business/branches/pages/branch-config-page.tsx`                     | Pestaña «Domicilios» (deep-link `?tab=delivery`), visible con el módulo `DOMICILIOS` habilitado en el tenant. Contenido en `components/branch-delivery-settings.tsx`: **ubicación** (lat/lng, siempre editable — requisito previo para asignar el módulo) + **configuración** (base, % valor de domicilio, modelo de anticipo; habilitada cuando la sucursal tiene el módulo asignado). |
| `features/business/orders/pages/orders-page.tsx`                              | Selección múltiple en la columna «Listo» (checkbox por tarjeta) + `SelectionActionBar` «Asignar domiciliario (N)» → `assign-delivery-user-dialog` → `PUT /api/orders/status/bulk` (una sucursal por operación). Arrastre individual a «En camino»: si la sucursal del pedido tiene `DOMICILIOS`, abre el diálogo de domiciliario; si no, comportamiento actual.                         |
| `features/business/orders/components/orders-kanban.tsx`                       | Checkboxes opcionales por tarjeta (columnas seleccionables), sin romper el DnD (`stopPropagation` en mousedown del checkbox).                                                                                                                                                                                                                                                           |
| `features/business/orders/services/orders.service.ts` + `hooks/use-orders.ts` | `updateOrderStatus(id, status, deliveryUserId?)` y `bulkUpdateOrderStatus({ids, status, deliveryUserId})` + hook de mutación.                                                                                                                                                                                                                                                           |
| `features/business/people/users/*`                                            | Opción de rol «Domiciliario» (`Delivery`) en el formulario, teléfono obligatorio para ese rol (validación zod + hint), tipo `Role` ampliado.                                                                                                                                                                                                                                            |
| `i18n/index.ts` + `i18n/use-i18n.ts`                                          | Namespace `business-delivery` registrado (estático + lazy fallback).                                                                                                                                                                                                                                                                                                                    |

## 6. i18n

- Namespace nuevo **`business-delivery`** (`features/business/delivery/i18n/{es,en}.json`).
- `common.json`: clave `delivery` (sidebar).
- `business-orders`: claves de selección, barra de acciones y diálogo de domiciliario.
- `business-users-catalog`: `role_delivery` y mensaje de teléfono obligatorio.
- `business-branches`: `tab_delivery` y textos de la pestaña «Domicilios».
- Todos los textos visibles van por i18n (es + en); los mensajes que vienen del backend
  (errores `{message}`) se muestran tal cual (son del dominio y ya vienen localizados al
  español del negocio, igual que el resto del backoffice).

## 7. Validaciones y reglas de UI

- **Activar domiciliario**: base precargada desde la configuración de la sucursal;
  editable; obligatoria si la sucursal no tiene base configurada (coincide con el 400
  del backend); ≥ 0.
- **Más base / Recogida**: monto > 0, notas opcionales (≤ 500).
- **Cerrar turno**: confirmación (`ConfirmActionDialog`) mostrando el dinero esperado
  actual; tras el cierre se muestra el cuadre devuelto (`expectedCash`,
  `deliveryShareTotal`, `deliveryToCompany`).
- **Entrega de pedido**: los pagos deben sumar **exactamente** el total del pedido
  (validación en cliente antes de enviar; el backend también la hace); fila de pago
  requiere monto > 0 y referencia si el medio la exige (`requiresReference`);
  `returnAdvance` solo con modelo con anticipo (checkbox + monto opcional, default
  `total − efectivo`).
- **Asignación múltiple**: selección solo en «Listo»; pedidos de una sola sucursal por
  operación (el endpoint acepta un `deliveryUserId`); máximo 50 ids por llamada (se
  fragmenta automáticamente); el resultado por pedido (`results[]`) se resume en un toast
  y los fallos individuales se listan.
- **Ubicación**: lat −90..90, lng −180..180; ambos campos obligatorios (el backend
  mantiene las coordenadas cuando el campo viaja `null`, así que la ubicación no se
  puede vaciar desde el formulario); guardar exige `name` (se envía el actual).

## 8. Notas de implementación

- Los hooks siguen la convención del repo: `queryKeys` tipados, mutaciones que solo
  invalidan; los toasts los dispara el componente que llama (`notify`).
- Paginación de órdenes en la feature: `pageSize = 100` (clamp del backend), igual que
  otros catálogos grandes.
- El checkbox de las tarjetas del kanban corta `mousedown` para no iniciar el arrastre.
- `advanceMode` viaja como **int** (0/1), no como string.
- `PUT /api/orders/status/bulk` usa el campo `ids` (no `orderIds`) y `status: "Shipped"`.
