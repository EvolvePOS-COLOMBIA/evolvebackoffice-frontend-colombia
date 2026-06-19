# Evolve Versions

Frontend administrativo para gestionar productos de software, releases, usuarios internos y métricas operativas de distribución. La aplicación consume un backend HTTP real y centraliza la experiencia de autenticación, catálogo, historial de versiones, detalle técnico de releases, dashboard y administración de usuarios en una SPA construida con React.

## Que Es Este Proyecto

`Evolve Versions` resuelve un flujo típico de gestión de software interno:

- autenticación con sesión persistida;
- dashboard con resumen ejecutivo del sistema;
- catálogo de productos de software;
- creación de nuevas versiones con archivo `.zip`;
- historial global de releases;
- edición parcial de versiones existentes;
- descarga de paquetes publicados;
- administración de usuarios de la plataforma;
- soporte responsive y tema claro/oscuro.

El proyecto está pensado como un frontend de operación diaria para equipos técnicos o de soporte que necesitan publicar, consultar y controlar releases de múltiples productos desde una sola interfaz.

## Estado Actual

La aplicación ya no trabaja con mocks locales como fuente principal de datos.

Hoy el frontend:

- consume endpoints reales mediante `Axios`;
- usa `TanStack Query` para queries, mutaciones, caché e invalidación;
- persiste únicamente estado de sesión y preferencia de tema con `Zustand`;
- modela contratos del backend en `src/types/domain.ts`;
- aplica formularios tipados con `React Hook Form + Zod`;
- usa una librería de UI basada en `shadcn/ui` + `Radix UI`;
- centraliza notificaciones con `react-hot-toast`.

## Stack Tecnologico

### Base

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`

### Estado y datos

- `TanStack Query`
- `Axios`
- `Zustand` con `persist`

### Formularios y validación

- `React Hook Form`
- `Zod`
- `@hookform/resolvers`

### UI y estilos

- `Tailwind CSS v4`
- `shadcn/ui`
- `Radix UI`
- `lucide-react`
- `react-hot-toast`
- `date-fns`

### Calidad y tooling

- `Vitest`
- `ESLint`
- `Prettier`

## Scripts Disponibles

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run check
npm run format
```

## Variables De Entorno

La configuración principal vive en `src/config/env.ts` y `src/config/axios-client.ts`.

Variable soportada actualmente:

- `VITE_API_URL`: URL base del backend.

Ejemplo:

```env
VITE_API_URL=http://localhost:5000
```

Notas:

- `Axios` utiliza `VITE_API_URL` como `baseURL`.
- Si no se define, `appConfig.apiBaseUrl` cae a `http://localhost:5000`.

## Arranque Rapido

1. Instala dependencias:

```bash
npm install
```

2. Configura el `.env`:

```env
VITE_API_URL=http://localhost:5000
```

3. Ejecuta el entorno local:

```bash
npm run dev
```

4. Abre la URL que imprime Vite en consola.

5. Inicia sesión con un usuario válido del backend.

## Arquitectura General

La aplicación sigue una arquitectura modular por features, con separación explícita entre presentación, acceso a datos, estado global liviano y contratos de dominio.

Capas principales:

- `src/components/ui`: componentes visuales reutilizables y estilizados.
- `src/components/layout`: shell autenticada compartida.
- `src/features`: módulos por dominio funcional.
- `src/config`: configuración de infraestructura (`axios`, `react-query`, `env`).
- `src/routes`: composición y protección de rutas.
- `src/store`: estado global persistido mínimo.
- `src/types`: contratos compartidos con el backend.
- `src/hooks`: hooks transversales reutilizables.
- `src/utils`: helpers puros y testeables.

### Principios De Diseño

- arquitectura por features para escalar sin mezclar dominios;
- componentes UI desacoplados de reglas de negocio;
- lógica HTTP encapsulada en `services`;
- consumo de datos en `hooks` basados en `TanStack Query`;
- páginas enfocadas en orquestación de vista y composición;
- estado global reducido a sesión y tema;
- contratos alineados al backend para minimizar drift entre frontend y API.

## Flujo De Datos

El flujo estándar de una operación sigue este patrón:

1. una `page` renderiza el caso de uso;
2. la página o componente consume un `hook` de la feature;
3. el `hook` usa `TanStack Query` (`useQuery` o `useMutation`);
4. el `hook` llama a un `service` HTTP;
5. el `service` usa `Axios` sobre `src/config/axios-client.ts`;
6. la respuesta se tipa con contratos de `src/types/domain.ts`;
7. al mutar, el hook invalida queries relevantes y dispara toasts si corresponde.

Este enfoque permite cambiar endpoints o payloads sin reescribir las páginas.

## Infraestructura Tecnica

### `src/main.tsx`

Responsabilidades:

- monta React en el DOM;
- registra estilos globales;
- envuelve la app con `QueryClientProvider`;
- monta el `AppToaster`.

### `src/App.tsx`

Responsabilidades:

- inicializa el manejador global del tema (`useThemeManager`);
- delega la navegación a `AppRoutes`.

### `src/config/axios-client.ts`

Responsabilidades:

- crea la instancia `api` de `Axios`;
- define `baseURL` desde `VITE_API_URL`;
- inyecta automáticamente el `Bearer token` desde `Zustand` en cada request.

### `src/config/react-query.ts`

Responsabilidades:

- expone un `QueryClient` global;
- define defaults de retry y `refetchOnWindowFocus`.

### `src/store/app-store.ts`

Responsabilidades:

- persistir la sesión autenticada;
- persistir la preferencia de tema (`light`, `dark`, `system`);
- exponer acciones de `setSession`, `setTheme` y `logout`.

Importante:

- el store ya no contiene catálogo, releases ni datos mock;
- los datos de negocio viven en el backend y se consumen con React Query.

## Rutas Y Navegacion

La definición principal está en `src/routes/app-routes.tsx`.

### Rutas Publicas

- `/login`
  - pantalla de acceso;
  - solo disponible si no hay sesión activa.

### Rutas Protegidas

- `/`
  - redirige a `/dashboard`.
- `/dashboard`
  - vista ejecutiva del sistema.
- `/softwares`
  - catálogo de productos de software.
- `/users`
  - administración de usuarios.
- `/versions`
  - historial global de versiones.
- `/versions/new`
  - formulario de creación de versiones.
- `/versions/:versionId`
  - detalle de una versión específica.

### Guardas De Ruta

- `ProtectedRoute`
  - exige sesión activa para entrar al shell autenticado.
- `PublicRoute`
  - evita volver a `/login` si el usuario ya está autenticado.

### Expiracion De Sesion

`AppRoutesContent` valida `expiresAtUtc` en un `useEffect`; si la sesión ya expiró:

- muestra una notificación informativa;
- ejecuta `logout()`;
- redirige al usuario a `/login`.

## Layout Global

La shell autenticada está definida en `src/components/layout`.

### `AppLayout`

Responsabilidades:

- renderiza `Sidebar` fijo en desktop;
- renderiza `Navbar` fija arriba;
- deja el scroll solo dentro del contenido;
- aplica fondos decorativos globales para la estética del producto.

### `Navbar`

Responsabilidades:

- muestra el título contextual de la ruta actual;
- muestra indicadores rápidos de productos, versiones y usuarios;
- permite alternar el tema;
- expone el menú mobile mediante `Sheet`.

### `Sidebar`

Responsabilidades:

- concentra la navegación principal;
- muestra la sesión activa;
- expone acceso a dashboard, versiones, softwares, creación de release y usuarios;
- permite cerrar sesión.

### Responsive Del Layout

- `desktop`: sidebar fija;
- `mobile`: sidebar oculta dentro de un `Sheet`;
- el contenido principal mantiene scroll interno;
- las vistas densas cambian de tabla a cards en resoluciones intermedias.

## Sistema De UI

Los componentes base viven en `src/components/ui`.

Objetivos de esta capa:

- mantener consistencia visual;
- reducir estilos repetidos por feature;
- encapsular primitives de `Radix UI`;
- permitir formularios y diálogos uniformes.

Componentes importantes:

- `button.tsx`
- `card.tsx`
- `badge.tsx`
- `dialog.tsx`
- `sheet.tsx`
- `form.tsx`
- `input.tsx`
- `textarea.tsx`
- `select.tsx`
- `switch.tsx`
- `table.tsx`
- `date-picker.tsx`
- `error-state.tsx`
- `skeleton.tsx`
- `app-toaster.tsx`

## Tema Y Notificaciones

### Tema

El tema se controla con:

- `src/store/app-store.ts`
- `src/hooks/use-theme-manager.ts`

Capacidades:

- persistencia del tema seleccionado;
- resolución de `system` a `light` o `dark`;
- aplicación de la clase al `documentElement`;
- atajo de teclado con la tecla `d`.

### Toasts

Las notificaciones globales se construyen sobre `react-hot-toast`.

Piezas involucradas:

- `src/components/ui/app-toaster.tsx`
- `src/hooks/use-notify.ts`

Capacidades:

- tema integrado a la UI de la aplicación;
- `notify.success`, `notify.error`, `notify.info`, `notify.promise`, etc.;
- feedback uniforme para operaciones de creación, edición, borrado y descargas.

## Tipos De Dominio

Los contratos compartidos viven en `src/types/domain.ts`.

Modelos principales:

- `LoginResponse`
- `UserResponse`
- `SoftwareResponse`
- `SoftwareVersionResponse`
- `DashboardSummaryResponse`
- `VersionChange`

DTOs relevantes:

- `CreateSoftwareRequest`
- `CreateUserRequest`
- `UpdateUserRequest`
- `CreateSoftwareVersionRequest`
- `UpdateSoftwareVersionRequest`

Enums y tipos auxiliares:

- `ReleaseType`
- `UserRole`
- `ChangeType`

Estos tipos son la fuente de verdad del frontend para alinear la UI con el contrato del backend.

## Organizacion Del Codigo

Estructura base actual:

```text
src/
  components/
    layout/
    ui/
    Spinner.tsx
    alert-delete-dialog.tsx
  config/
    axios-client.ts
    env.ts
    react-query.ts
  features/
    auth/
    dashboard/
    softwares/
    users/
    versions/
  hooks/
    use-notify.ts
    use-theme-manager.ts
  lib/
    utils.ts
  routes/
    app-routes.tsx
    protected-route.tsx
    public-route.tsx
  store/
    app-store.ts
  types/
    domain.ts
  utils/
    format.ts
    version-utils.ts
    version-utils.test.ts
  App.tsx
  main.tsx
  index.css
```

## Features

### `features/auth`

Responsabilidad: autenticación y ciclo de sesión.

Piezas clave:

- `services/auth.service.ts`
  - login;
  - CRUD de usuarios.
- `hooks/use-auth.ts`
  - fachada de autenticación;
  - persistencia de sesión;
  - logout;
  - coordinación entre callbacks locales y sesión global.
- `components/login-form.tsx`
  - formulario de acceso con RHF + Zod.

### `features/dashboard`

Responsabilidad: vista ejecutiva inicial del sistema.

Piezas clave:

- `services/dashboard.service.ts`
  - consume `GET /api/dashboard/summary`.
- `hooks/use-dashboard.ts`
  - query del resumen del dashboard.
- `pages/dashboard-page.tsx`
  - KPIs;
  - releases recientes;
  - ranking de software más descargado.

### `features/softwares`

Responsabilidad: catálogo de productos.

Piezas clave:

- `services/software.service.ts`
  - `get/create/update/delete`.
- `hooks/use-softwares.ts`
  - queries y mutaciones con invalidación.
- `pages/software-catalog-page.tsx`
  - listado principal con experiencia responsive.
- `components/software-form-dialog.tsx`
  - modal de alta y edición.

### `features/users`

Responsabilidad: administración de usuarios.

Piezas clave:

- `hooks/use-users.ts`
  - consulta y mutaciones del módulo.
- `pages/user-manager-page.tsx`
  - vista principal de usuarios.
- `components/user-form-dialog.tsx`
  - creación y edición;
  - soporte de cambio de contraseña.
- `components/user-delete-dialog.tsx`
  - confirmación de borrado.

### `features/versions`

Responsabilidad: ciclo completo de releases.

Piezas clave:

- `services/version.service.ts`
  - listado por software;
  - listado global;
  - creación con `multipart/form-data`;
  - actualización parcial;
  - borrado;
  - descarga de paquetes.
- `hooks/use-versions.ts`
  - queries, mutaciones, invalidaciones y helper reutilizable de descarga.
- `pages/versions-history-page.tsx`
  - historial global con filtros;
  - tabla en desktop y cards en resoluciones menores.
- `pages/version-form-page.tsx`
  - contenedor del builder.
- `components/version-builder-form.tsx`
  - formulario completo de creación con `useFieldArray`.
- `pages/version-detail-page.tsx`
  - detalle técnico;
  - changelog agrupado;
  - descarga de zip;
  - acceso a edición parcial.
- `components/version-edit-dialog.tsx`
  - modal de edición de versión limitado a campos permitidos por la API.

## Formularios Y Validacion

El proyecto estandariza formularios con:

- `React Hook Form` para performance y control;
- `Zod` para validación declarativa;
- wrappers en `src/components/ui/form.tsx` para mantener consistencia visual.

Patrones usados:

- `useForm` con `zodResolver`;
- `useFieldArray` para listas dinámicas como changelog;
- schemas por feature (`schemas/*`);
- tipos inferidos en `types/*`.

Beneficios:

- payloads tipados;
- menor duplicación de validaciones;
- mensajes de error consistentes;
- integración simple con dialogs y componentes UI propios.

## Capa HTTP Y React Query

La comunicación con el backend está organizada por feature.

Patrón recomendado y actual:

- `services`: llamadas HTTP puras;
- `hooks`: composición con React Query, invalidaciones y side effects;
- `pages/components`: consumo del hook sin conocer detalles de infraestructura.

Ejemplos:

- `useSoftwares()` consulta `/api/software`;
- `useGetUsers()` consulta `/api/auth/users`;
- `useAllVersions()` consulta `/api/software/versions`;
- `useDashboardSummary()` consulta `/api/dashboard/summary`.

Invalidaciones frecuentes:

- `["softwares"]`
- `["users"]`
- `["versions", "all"]`
- `["versions", softwareId]`
- `["dashboard", "summary"]`

## Integracion Con El Backend

Endpoints ya integrados en el frontend:

### Auth

- `POST /api/auth/login`
- `GET /api/auth/users`
- `POST /api/auth/users`
- `PUT /api/auth/users/:id`
- `DELETE /api/auth/users/:id`

### Dashboard

- `GET /api/dashboard/summary`

### Software

- `GET /api/software`
- `POST /api/software`
- `PUT /api/software/:id`
- `DELETE /api/software/:id`

### Versions

- `GET /api/software/:softwareId/versions`
- `GET /api/software/versions`
- `POST /api/software/:softwareId/versions`
- `PUT /api/software/versions/:versionId`
- `DELETE /api/software/versions/:versionId`
- `GET /api/software/versions/:versionId/download`

## Flujo Funcional Principal

### 1. Login

- el usuario completa credenciales;
- `auth.service.ts` ejecuta el login;
- `useAuth()` persiste la sesión;
- `PublicRoute` y `ProtectedRoute` controlan el acceso;
- la app redirige al dashboard.

### 2. Dashboard

- se consulta el resumen general del sistema;
- se renderizan KPIs y paneles de actividad;
- sirve como landing principal al entrar autenticado.

### 3. Gestión De Softwares

- la página lista productos desde el backend;
- create/update se hacen mediante modal;
- delete invalida software y versiones globales relacionadas.

### 4. Gestión De Usuarios

- listado de usuarios del backend;
- alta, edición y borrado desde UI;
- cambio opcional de contraseña en edición.

### 5. Gestión De Versiones

- creación con metadata + changelog + archivo zip;
- historial global filtrable;
- detalle por release;
- descarga real del paquete;
- edición parcial en modal de campos permitidos por la API.

## Utilidades

### `src/utils/format.ts`

Helpers de formato para:

- fechas;
- fecha y hora;
- tamaños de archivo.

### `src/utils/version-utils.ts`

Helpers de dominio para:

- validar semver de cuatro segmentos;
- construir nombre de archivo del paquete;
- agrupar cambios por tipo;
- resolver labels e iconos del changelog;
- serializar `changesJson` para updates parciales.

### Tests

Actualmente existe cobertura focalizada en:

- `src/utils/version-utils.test.ts`

Se recomienda seguir ampliando pruebas sobre helpers y flujos con mayor riesgo de regresión.

## Responsive

Decisiones responsive actuales:

- sidebar móvil con `Sheet`;
- layout fijo con scroll solo en el contenido;
- tablas convertidas a cards en tablet/mobile;
- formularios y paneles apilados en pantallas estrechas;
- modales con altura controlada y scroll interno cuando el contenido es denso.

## Convenciones Del Proyecto

### Idioma

- el código fuente está en inglés;
- la documentación puede estar en español;
- los nombres de tipos, variables y componentes deben mantenerse en inglés.

### Alias

Se usa `@/` para importar desde `src`.

Ejemplo:

```tsx
import { Button } from "@/components/ui/button"
```

### Responsabilidades

- `components/ui`: sin reglas de negocio;
- `components/layout`: shell compartida;
- `features/*/services`: capa HTTP;
- `features/*/hooks`: datos, mutaciones y side effects;
- `features/*/pages`: entry points de rutas;
- `features/*/components`: piezas visuales específicas del dominio;
- `store`: sesión y tema;
- `utils`: helpers puros.

## Guia Para Extender El Proyecto

### Agregar Una Nueva Feature

Recomendación:

1. crear `src/features/nueva-feature`;
2. separar `components`, `pages`, `hooks`, `services`, `schemas`, `types`;
3. agregar contratos compartidos a `src/types/domain.ts` solo si son realmente globales;
4. crear servicios HTTP primero;
5. envolverlos con hooks basados en React Query;
6. registrar la ruta en `src/routes/app-routes.tsx`;
7. reutilizar `components/ui` antes de introducir nuevos patrones visuales.

### Agregar Un Nuevo Endpoint

Patrón recomendado:

1. definir o actualizar el contrato en `src/types/domain.ts`;
2. crear la llamada en `services`;
3. encapsularla en un hook;
4. invalidar queries afectadas;
5. conectar la UI;
6. validar con `npm run typecheck`.

### Agregar Un Nuevo Componente UI

Antes de crearlo:

- revisar si ya existe una primitive equivalente;
- revisar si puede componerse con `Card`, `Dialog`, `Sheet`, `Form`, `Badge`, etc.;
- mantener la estética definida en `index.css`.

## Checklist Para Nuevos Colaboradores

Antes de modificar el proyecto:

1. leer este README;
2. revisar `src/routes/app-routes.tsx`;
3. revisar `src/types/domain.ts`;
4. identificar la feature afectada;
5. seguir el patrón `service -> hook -> page/component`;
6. reutilizar UI existente;
7. ejecutar `npm run check` antes de cerrar cambios.

## Recomendaciones Futuras

- ampliar cobertura de tests para hooks y flujos críticos;
- documentar ejemplos de payloads reales del backend;
- agregar gráficos al dashboard cuando el backend exponga series temporales;
- considerar code-splitting por rutas si el bundle crece;
- mantener el README sincronizado cada vez que cambien rutas, contratos o providers globales.
