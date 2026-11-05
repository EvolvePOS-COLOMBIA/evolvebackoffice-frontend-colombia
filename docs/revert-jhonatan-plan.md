# Plan de reversión: eliminar todos los cambios de JHONATAN (FrontendPOS)

> **Estado**: PLAN — pendiente de ejecución.
> **Fecha**: 2026-11-04 · **Rama base**: `main` @ `ac334f8` (= `origin/main`, árbol limpio)
> **Repo**: `github.com/EvolvePOS-COLOMBIA/evolvebackoffice-frontend-colombia`
> **Companion**: `BackendPOS/docs/revert-domicilios-plan.md` (revert del backend).

---

## 1. Objetivo y alcance

**Eliminar TODO el código aportado por JHONATAN STEVEN CARRILLO MEJIA** (18 commits, sin
carve-outs — decisión explícita del equipo), que corresponde esencialmente a la feature de
domicilios, el live tracking y WhatsApp/Evolution del backoffice, **más** partes mezcladas de
UX general de órdenes y de cierres.

### Inventario de sus commits (los 18 están en `main` y se agrupan en 3 PRs)

| PR                                             | Merge     | Fecha  | Commits suyos | Contenido                                                                                                                                                                |
| ---------------------------------------------- | --------- | ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **#9** `feat/orders-delivery`                  | `d67acff` | 16 oct | **8/8 suyos** | Domicilios v1 (courieres, deliveries, pruebas, rutas), reconciliación multipago, kanban selección múltiple, fix ai-chat, pruebas e2e                                     |
| **#12** `feat/orders-closing-delivery-ux`      | `303d23d` | 19 oct | **1/1 suyo**  | UX de cierres carried-over, `resolve-delivered`, retry-sync Cluvi, avisos WhatsApp                                                                                       |
| **#16** `feat/delivery-live-tracking-frontend` | `152048c` | 28 oct | **9/9 suyos** | Live maps/GPS/tracking público, WhatsApp/Evolution exclusivo (83 archivos), setup de domicilios y zonas, kanban lote/filtros, integraciones Cluvi/Woo, defaults de login |

**Huella total**: 171 archivos únicos · **+22.095 / −4.371** (17 commits sin merge).

Los merges auxiliares _dentro_ de esas ramas (`bb2c01a` suyo, `5dd9908`/`4023304`/`4673f3f` de
Carlos) no aportan contenido propio → el revert del merge del PR los cubre todos.

### Features de OTROS autores que se conservan (no entran en el alcance)

| Feature                                                                                              | Autor    | PR             |
| ---------------------------------------------------------------------------------------------------- | -------- | -------------- |
| Cancelaciones con disposición merma/retorno (UI de cancelación granular)                             | fernando | #15            |
| Inventario (existencias, órdenes de compra, proveedores)                                             | Joaquin  | #17, #18       |
| Cierres base F6 (ventana, snapshot, conciliación) · config Cluvi "Setear URL" · activación de tienda | Giovany  | pre-#9         |
| Panel unificado integraciones WooCommerce/Cluvi · config Playwright                                  | Carlos   | #13 / directos |
| Kanban base de órdenes                                                                               | fernando | #15            |

✅ **Sin imports huérfanos**: ningún archivo conservado importa módulos delivery/whatsapp de él
(verificado con grep). `inventory/utils/whatsapp-desktop` solo lo importa su propio test.

---

## 2. Huecos aceptados (consecuencia de elegir el alcance estricto)

El backend conserva cierres, Cluvi y reconcile; al quitar TODO el frontend de JHONATAN, estas
features quedan **temporalmente sin UI** (la API sigue funcionando):

1. **Cierres**: UI de carried-over, botón `resolve-delivered` (`closing-resolve-table`) y
   **retry-sync** (`order-sync-action`, creado por él) → permanece la página F6 base de Giovany.
2. **Reconciliación multipago de pedido**: `reconcile-payments-dialog.tsx` (creado por él en
   PR#9) y `payment-totals-table.tsx` (creado en PR#12) → **se eliminan** (la conciliación del
   cierre F6 de Giovany permanece).
3. **Integraciones Cluvi/Woo "independientes"** (`a023a46`) → quedan el panel de Carlos y el
   wizard base de Giovany.
4. **UX general de órdenes de `cd38f5a`** (83 archivos): order-timeline, saved-views, workspace,
   subnav, centro de notificaciones, lookup de cliente, picker de producto, manual-order mejoras.
5. **Kanban**: selección múltiple/lote/filtros rápidos/asa de arrastre (`dde80e1`, `bad3224`).
6. **Fix de la gráfica pie de ai-chat** (`b121912`) y **defaults del login** (`f511044`).
7. **Las 6 suites e2e** (`tests/*.spec.ts`, todas creadas por él) → `tests/` queda vacío
   (la config `playwright.config.ts` es de Carlos y se conserva; no hay script npm de e2e).
8. **Sidebar**: ítem "Domicilios" eliminado (revert limpio: nadie tocó el sidebar después de él).

> Si más adelante se requiere alguna de estas UIs, se reimplementa como feature nueva
> (o se hace `git revert` de los reverts de este plan).

---

## 3. Conflictos medidos (pruebas de revert en rama temporal, ya limpiada)

Se ejecutaron los 3 reverts por separado sobre `main` @ `ac334f8` y se abortaron:

| Orden     | Revert                             | Conflictos                                                                                                                                                                                                             |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | `git revert -m 1 152048c` (PR #16) | **9 archivos** (i18n/servicios/types de `branches`, `branch-selector` i18n) — 1 bloque c/u · **bajos**                                                                                                                 |
| 2         | `git revert -m 1 303d23d` (PR #12) | **19 archivos, ~30 bloques** — `order-closing-page` ×5, `use-new-order-notifications` ×4, `deliveries-page` ×4, `tests/delivery-phase2` ×4, `order-detail-dialog` ×3, i18n orders ×2                                   |
| 3         | `git revert -m 1 d67acff` (PR #9)  | **43 archivos, ~50 bloques** — **`orders-page` ×14**, `manual-order-dialog` ×7, `orders-kanban` ×4, `order-closing-page` ×5, `app-routes` ×3, `orders.service`/`types` ×2, modify/delete en páginas/servicios delivery |
| **Total** |                                    | **~71 archivos, ~80 bloques**                                                                                                                                                                                          |

**Hotspot**: `orders-page.tsx`, `order-closing-page.tsx`, `orders-kanban.tsx`,
`order-detail-dialog.tsx`, i18n de `orders` — aparecen en 2 o 3 reverts.

> Los números son por revert aislado; en la secuencia real el snapshot de conflicto puede variar
> levemente (la regla de resolución es la misma).

### Quién tocó por última vez cada archivo suyo (riesgo de conflicto)

135 suyos (revert limpio) · 21 Carlos · 10 Joaquin · 1 Giovany · 1 fernando → **~33 archivos**
tendrán conflicto con cambios posteriores de otros autores.

---

## 4. Plan de ejecución

### Paso 0 — Preparación

```bash
cd FrontendPOS
git switch main && git pull
git branch backup/main-pre-revert ac334f8        # red de seguridad
git switch -c revert/jhonatan ac334f8
bun install
bun run check                                    # línea base verde (format+typecheck+lint+test)
```

### Paso 1 — Revert PR #16 (tracking, WhatsApp, setup domicilios, kanban lote)

```bash
git revert -m 1 --no-commit 152048c
```

- Elimina: live maps/GPS/tracking público, **WhatsApp/Evolution completo** (dialog, service,
  drafts, desktop utils, `branch-whatsapp-card`, `whatsapp-setup-assistant`), setup/zonas de
  domicilios, `Domicilios` en sidebar, integraciones Cluvi/Woo independientes, kanban
  lote/filtros, defaults de login, specs `delivery-tracking`/`orders-whatsapp`.
- Conflictos medidos: **9** (i18n y services de `branches`/`catalog`).
  **Regla**: quitar sus claves/líneas (delivery/whatsapp y las generales que agregó),
  conservar las de Joaquin (inventario) y Carlos.
- `bun run check` (o al menos `bunx tsc --noEmit`) → `git add -A` → `git revert --continue`.

### Paso 2 — Revert PR #12 (UX de cierres carried-over + retry + avisos WhatsApp)

```bash
git revert -m 1 --no-commit 303d23d
```

- Conflictos medidos: **19 / ~30 bloques**.
- **Regla**: restaurar la versión de los archivos de cierres **previa a él** (F6 de Giovany)
  más los cambios posteriores de otros; eliminar `order-sync-action.tsx`,
  `payment-totals-table.tsx` y los avisos WhatsApp (`whatsapp-desktop-dialog`).
- Ojo con `use-order-closings`/`order-closings.service`: son la base de Giovany modificada por
  él → conservar la base + cambios de otros, quitar sus hunks (carried-over/resolve/retry).
- `bun run check` → `git add -A` → `git revert --continue`.

### Paso 3 — Revert PR #9 (domicilios v1 + reconcile multipago + kanban selección)

```bash
git revert -m 1 --no-commit d67acff
```

> ⚠️ Revertir **`d67acff`** (el merge del PR), **NO** `200d4cb` (ese merge trae también commits
> de otros autores; revertirlo borraría trabajo ajeno).

- Conflictos medidos: **43 / ~50 bloques** — el más grande.
- Reglas especiales:
  - `app-routes.tsx` (×3): conservar el enrutado de Carlos (`fix(routing): suppliers → people`)
    y las rutas de inventario de Joaquin; eliminar rutas `delivery`/`couriers`/`deliveries`.
  - `orders-page.tsx` (×14): el archivo fue reescrito por él en 3 PRs + tocado por otros →
    objetivo = **estado previo a `d67acff` + cambios posteriores de otros** (fernando #15,
    Joaquin #17/#18, `52abb5e`, `4c3c4c5`…).
  - Modify/delete de archivos que él creó y otros tocaron después: **eliminar** (alcance
    estricto) y **re-aplicar encima** los cambios posteriores de otros autores si los hay.
  - `playwright.config.ts` (creado por Carlos): conservar versión de Carlos sin sus adiciones.
  - `package.json`/`bun.lock`: quitar dependencias que él agregó (maps/E.164), conservar las
    de otros → regenerar lock con `bun install`.
  - Archivos suyos que desaparecen completos: `reconcile-payments-dialog.tsx`,
    `bulk-order-status-dialog.tsx`, `bulk-status.ts`, páginas/servicios `delivery*`/`courier*`,
    `courier-*`, specs `tests/*.spec.ts` (los 6), tests unitarios suyos
    (`delivery-auth`, `whatsapp-desktop`, `couriers.service`, `order-helpers`…).
- `bun run check` → `git add -A` → `git revert --continue`.

### Paso 4 — Verificación de completitud

```bash
# Su historia sigue visible (los reverts son commits nuevos), lo que importa es el CONTENIDO:
grep -rilE 'courier|delivery|whatsapp|evolution' src/ | grep -v i18n   # → debe ser ~0
grep -rilE 'carried|resolve-delivered|retry-sync' src/                 # → huecos aceptados (~0)
# Sus archivos ya no existen (ejemplos):
test -f src/features/business/orders/components/reconcile-payments-dialog.tsx && echo "FALTA REVERTIR"
test -d tests && ls tests/                                             # → vacío
```

### Paso 5 — Validación

```bash
bun install          # refrescar bun.lock si hubo cambios de package.json
bun run check        # format:check + typecheck + lint + test (Vitest)
bun run build        # build de producción (Vite)
```

Smoke manual (con backend ya revertido o mock):

1. Login → dashboard → módulos de negocio.
2. Órdenes: kanban/lista, detalle, cancelación con disposición (UI de fernando) ✅.
3. Cierres: página F6 base carga y concilia (sin carried-over/resolve/retry — **hueco aceptado**) ⚠️.
4. Inventario (Joaquin) y People/branches (Carlos) sin regresiones.
5. Sidebar sin "Domicilios"; rutas viejas de delivery → 404/redirect.

Entrega: MR `revert/jhonatan` → `main` (GitHub Actions/CI del repo).

---

## 5. Esfuerzo y riesgos

| Dimensión       | Valoración                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Esfuerzo        | **~1,5–3 días** (revert #16: 0,25 · #12: 0,5 · #9: 0,75–1,5 · verificación/validación: 0,5)                        |
| Riesgo          | **Medio** — `orders-page.tsx` (×14), el commit mixto `cd38f5a` (83 archivos) y los i18n compartidos                |
| Reversible      | Sí — `backup/main-pre-revert` = `ac334f8`; sin force-push (historia intacta)                                       |
| Riesgo residual | Huecos de UI listados en §2 (aceptados) · cambios posteriores de otros sobre sus archivos (~33) · specs e2e vacíos |

### Puntos de atención

1. **Orden estricto**: PR #16 → PR #12 → PR #9 (del más nuevo al más viejo).
2. `bun run check` **obligatorio** antes de cada `git revert --continue`.
3. Si un archivo suyo fue modificado por otros después: eliminarlo y **re-aplicar los cambios
   de otros** (mini-cirugía), no dejar restos suyos.
4. No revertir `200d4cb` ni los merges de Carlos dentro de las ramas.
5. Coordinar con el revert de backend (`docs/revert-domicilios-plan.md`): el frontend debe
   mergear después de que el backend elimine los endpoints de domicilios (o desplegar juntos).

---

## 6. Registro de ejecución

| Fecha | Paso | Commit | Resultado / conflictos |
| ----- | ---- | ------ | ---------------------- |
| —     | —    | —      | _(pendiente)_          |
