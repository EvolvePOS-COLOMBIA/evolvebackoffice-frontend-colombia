# Branch Management — Estado de la rama `codex/branch-management`

## Intención de la rama

Implementar el módulo completo de **Gestión de Sucursales (Branches)** en el backoffice:

- **CRUD** de sucursales (crear, editar, lista paginada, buscar por nombre, activar/desactivar lógicamente).
- **Integración en Settings**: Punto de entrada a la gestión desde la página de Configuración del negocio.
- **Refactor de páginas existentes**: Simplificar `BranchTerminalSettingsPage` y `BranchConfigPage` alineadas con el nuevo patrón.
- **Base para onboarding**: Compartir `schemas` y `i18n` con el paso de sucursal en `step-branch.tsx` del onboarding.

---

## ✅ Lo que está commiteado y hecho (9 commits)

| #   | Commit    | Descripción                                                                         | Archivos afectados                                                                                                                                                                                                                                                                                                 |
| --- | --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `5972a69` | `feat(i18n): registrar namespaces de branches en core i18n`                         | [index.ts](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/i18n/index.ts), [use-i18n.ts](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/i18n/use-i18n.ts)                                                                                                                         |
| 2   | `1e616f5` | `feat(branches): añadir schema de validación + i18n del módulo`                     | [branch-schema.ts](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/schemas/branch-schema.ts), `i18n/en.json`, `i18n/es.json` (branches + config + terminals)                                                                                                            |
| 3   | `03836e4` | `feat(branches-service): añadir list options + activate/deactivate + tests`         | [branches.service.ts](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/services/branches.service.ts), [branches.service.test.ts](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/services/__tests__/branches.service.test.ts) |
| 4   | `dc1e6c7` | `feat(branches-hooks): extender hooks con filtros y mutaciones activate/deactivate` | [use-branches.ts](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/hooks/use-branches.ts)                                                                                                                                                                                |
| 5   | `e4d9c22` | `feat(branches-ui): añadir diálogo de formulario y página principal`                | [branch-form-dialog.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/components/branch-form-dialog.tsx), [branches-page.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/pages/branches-page.tsx)                    |
| 6   | `d29ebb6` | `feat(branches-config): refactorizar página de configuración`                       | [branch-config-page.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/config/pages/branch-config-page.tsx)                                                                                                                                                           |
| 7   | `9ba6cf8` | `refactor(branches-terminals): simplificar página de terminales`                    | [branch-terminal-settings-page.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/branches/terminals/pages/branch-terminal-settings-page.tsx)                                                                                                                                  |
| 8   | `90f28c8` | `feat(settings): integrar navegación a gestión de sucursales`                       | [settings-page.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/business/settings/pages/settings-page.tsx), [app-routes.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/routes/app-routes.tsx), settings i18n                                                    |
| 9   | `113e190` | `fix(auth): ajuste menor en login form`                                             | [login-form.tsx](file:///C:/Users/DELL/Documents/Development/backcoffice-col/src/features/auth/components/login-form.tsx)                                                                                                                                                                                          |

### Características funcionales ya entregadas

- 📋 **Lista paginada** de sucursales con `pageSize=10`.
- 🔍 **Búsqueda server-side** por nombre de sucursal (`searchField=name`, `searchValue=...`).
- ➕ **Crear** sucursal vía diálogo modal con validación Zod.
- ✏️ **Editar** sucursal reutilizando el mismo diálogo.
- 🟢🔴 **Activar / Desactivar** (baja lógica) con confirmación vía `AlertDialog`.
- 🔗 **Navegación**: Botón de acción por fila → Configuración de terminales y Configuración general.
- 🌐 **i18n** completo (ES / EN) para los namespaces `business-branches`, `business-branches-terminals`, `business-branches-config`.
- ⚛️ **Hooks** react-query con invalidación de caché centralizada.
- ✅ **Tests unitarios** del service.

---

## 🧪 Lo que falta por hacer / Pendiente

### Backend / Integración

- [ ] **Validar endpoints reales del API**: Confirmar con backend que `POST /api/Branches/{id}/activate` existe y firma del `searchField`/`searchValue`.
- [ ] **Ajustar mapping Branch ↔ DTO** si el backend cambia campos (ej. `identification` vs `taxId`).

### UI / UX

- [ ] **Paginación visible**: Añadir control de paginación (Botones Anterior / Siguiente o Pager) en `BranchesPage` (actualmente solo cambia de página al buscar).
- [ ] **Skeleton / Loading states** más pulidos en la tabla (hay `Skeleton` importado pero ver si se usa en todos los escenarios).
- [ ] **Empty state diferenciado**: "No hay sucursales" vs "No se encontraron resultados para X" (ver patrón en `TODO-CATALOG.md` items 4 y 7).
- [ ] **Error boundaries / Manejo de errores API**: Usar `notify` toast + retry para fallos en mutaciones y queries.
- [ ] **Badge de estado**: Hacer más evidente el badge "Activo / Inactivo" con colores.

### Onboarding (step-branch)

- [ ] **Reutilizar `branch-schema.ts`** centralizado desde `step-branch.tsx` (actualmente usa `../schemas/onboarding-schemas` — puede duplicar lógica).
- [ ] **Compartir `branchSchema` y `BranchFormValues`** entre onboarding y branches management.

### Tests

- [ ] Tests de hooks (`use-branches.test.ts`).
- [ ] Tests de componentes (`branches-page`, `branch-form-dialog`).
- [ ] Tests E2E del flujo completo (crear → listar → editar → desactivar).

### Otros

- [ ] **Permisos / Roles**: Bloquear acceso a rutas `/business/settings/branches` y acciones (crear/editar/activar) según perfil de usuario.
- [ ] **Auditoría**: Registrar quién activa/desactiva una sucursal.
- [ ] **Revisión del fix(auth)**: Confirmar que el ajuste menor en `login-form.tsx` es intencional y no causa regresión.

---

## 📂 Estructura nueva creada en esta rama

```
src/features/business/branches/
├── components/
│   └── branch-form-dialog.tsx      (nuevo)
├── i18n/
│   ├── en.json                     (nuevo)
│   └── es.json                     (nuevo)
├── pages/
│   └── branches-page.tsx           (nuevo)
├── schemas/
│   └── branch-schema.ts            (nuevo)
├── services/
│   ├── __tests__/
│   │   └── branches.service.test.ts (nuevo)
```

---

## 🚀 Siguientes pasos sugeridos

1. **Probar en runtime** la rama completa end-to-end con un backend corriendo.
2. **Abrir PR** contra `main` / `develop` con estos 9 commits (lista revisable).
3. **Mergear en orden** y resolver pendientes en tickets separados (cada uno con su propio branch).
4. **Rastrear el paso 9** `fix(auth)` — si es ajeno al feature, moverlo a su propio branch antes de mergear.
