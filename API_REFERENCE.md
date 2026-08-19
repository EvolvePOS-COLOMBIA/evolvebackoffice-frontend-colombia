================================================================================
MANUAL DE IMPLEMENTACIÓN — BACKOFFICE WEB (React.js)
BackendPOS — Arquitectura Multi-Tenant
Versión: 1.1 | Fecha: 2026-08-18
================================================================================

Tabla de contenido:

1. ARQUITECTURA GENERAL
2. TECNOLOGÍAS RECOMENDADAS
3. MODELOS DE SEGURIDAD Y AUTENTICACIÓN
   3.1 Bearer JWT + X-Tenant-Id
   3.2 Dos Login Pages: /login/admin y /login/pos
   3.3 Refresh Token Rotation
   3.4 X-Force-Password-Change header
4. ROLES Y POLÍTICAS DE AUTORIZACIÓN
5. ESTRUCTURA DE RUTAS (React Router v7)
6. CATÁLOGO COMPLETO DE ENDPOINTS + EJEMPLOS
7. TIPOS / INTERFACES TYPESCRIPT (client-side)
8. FLUJOS UI CLAVE (con screenshots textuales y mockups)
9. MANEJO DE ERRORES Y CÓDIGOS HTTP
10. STORE GLOBAL (Zustand) CON AUTENTICACIÓN
11. BUENAS PRÁCTICAS Y ACCESIBILIDAD

================================================================================

1. # ARQUITECTURA GENERAL

El Backoffice Web es el panel de administración de los tenants (negocios).
Permite a los dueños/administradores/managers:
· Gestionar usuarios del negocio (administradores, gerentes, cajeros).
· Gestionar la caja (Register / serial codes POS).
· Mantener el catálogo de clientes.
· Mantener el catálogo de productos/servicios (Items) y su stock.
· Ver transacciones, reportes diarios, cancelar facturas.
· Desactivar seriales POS, activar/desactivar usuarios.

Arquitectura cliente:
· React 18+ con StrictMode.
· TypeScript estricto (strictNullChecks, noImplicitAny, noUncheckedIndexedAccess: true).
· API Wrapper sobre fetch o Axios con interceptores (Bearer token, auto-refresh, X-Tenant-Id).
· React Router v7 con rutas protegidas (element: <RequireAuth>).
· Zustand como store global (auth state + UI state).
· TanStack Query v5 (antes React Query) para server state + cache invalidation.
· UI: Ant Design v5 o Shadcn/ui (recomendado) + Tailwind v4.
· Formularios: React Hook Form + Zod schema validation.
· Internacionalización: react-i18next (es-CO primero).
· Gráficos / dashboards: Recharts.

================================================================================ 2. TECNOLOGÍAS RECOMENDADAS
================================================================================

Dependencias mínimas (npm install):
react, react-dom ^18.3 o ^19
react-router-dom ^7
@tanstack/react-query, @tanstack/react-table ^5
zustand ^4
axios ^1.7
react-hook-form, @hookform/resolvers ^3
zod ^3
dayjs ^1
@ant-design/icons, antd ^5 (si escoges AntD) - o alternativamente -
tailwindcss, @tailwindcss/vite, shadcn/ui latest

Dev dependencies:
typescript ^5, vite ^6, @types/react, @types/react-dom
eslint, @typescript-eslint/parser, prettier, husky, lint-staged
vitest, @testing-library/react, @testing-library/user-event, msw

================================================================================ 3. MODELOS DE SEGURIDAD Y AUTENTICACIÓN
================================================================================

## 3.1 DOS HEADERS QUE VIAJAN EN TODOS LOS REQUESTS AUTENTICADOS

1. Authorization: Bearer <JWT>
2. X-Tenant-Id: <slug-del-tenant | Guid-PublicId del tenant>

Estos dos headers son REQUERIDOS en TODO endpoint que no sea anónimo
(los endpoints de plataforma `/api/tenants/*` usan JWT del admin global pero NO
requieren `X-Tenant-Id`, ya que operan sobre la BD maestra).

- X-Tenant-Id se guarda en el sessionStorage/localStorage UNA SOLA VEZ cuando
  el usuario hace login exitoso (viene en el payload JWT claim "ts" = slug del tenant).
- El JWT claim "tid" = TenantPublicId en formato Guid.
- El JWT claim "ts" = slug string del tenant (el que va en el header X-Tenant-Id).
- El JWT claim "role" = Rol del usuario (ADMIN, MANAGER, CASHIER).
- El JWT claim "sub" = UserPublicId Guid (el que se usa para change-password).

NOTA: `X-Tenant-Id` acepta el slug (p. ej. "panaderia-maria-001"). El middleware
resuelve EXCLUSIVAMENTE por header; si el header no viene, se considera request
de plataforma (sin tenant).

## 3.2 PÁGINAS DE LOGIN

Hay TRES modos de autenticación en el backend (AuthController.cs):

| Modo                | Endpoint                      | X-Tenant-Id | Contra qué valida          |
| ------------------- | ----------------------------- | ----------- | -------------------------- |
| Plataforma (global) | POST /api/auth/login/platform | NO          | BD MAESTRA (admin global)  |
| Backoffice tenant   | POST /api/auth/login/admin    | SÍ          | BD del tenant (email+pass) |
| POS (cajero online) | POST /api/auth/login/pos      | SÍ          | BD del tenant (user+PIN)   |

Los logins que operan sobre un tenant (admin y pos) REQUIEREN `X-Tenant-Id`.
El login de plataforma NO (el JWT usa el tenant virtual "posco-system").

BOOTSTRAP (solo primera vez):

- GET /api/auth/has-admin → { hasAdmin: bool } (¿existe admin global?)
- POST /api/auth/bootstrap → crea el PRIMER admin global (si hasAdmin=false).
  Body: BootstrapAdminDto { fullName, email, password, documentNumber? }
  201 → { message, username, tempPin, note } (PIN POS se muestra UNA vez).

ROUTE: /login/admin
· Uso: login BACKOFFICE de un tenant (email + password larga y segura).
· Pantalla típica:
┌────────────────────────────────────────┐
│ INICIAR SESIÓN ADMINISTRACIÓN │
│ │
│ Tenant: [ panaderia-maria-001 ] │
│ Email: [_________@correo.com] │
│ Password: [**********] │
│ │
│ [ Ingresar al Backoffice ] │
│ ¿No recuerdas tu contraseña? │
└────────────────────────────────────────┘

ENDPOINT: POST /api/auth/login/admin
HEADERS: X-Tenant-Id: <slug> (obligatorio)
REQUEST BODY: LoginAdminDto { email, password }
RESPONSE BODY: AuthResponseDto (user + JWT + RefreshToken + ForcePasswordChange)

REGLAS DE VALIDACIÓN CLIENTE (Zod schema): - Email: correo válido (standard). - Password: min 8 chars, al menos 1 mayúsc, 1 minúsc, 1 número, 1 símbolo.

ROUTE: /login/platform
· Uso: login del ADMINISTRADOR GLOBAL de la plataforma (gestiona tenants).
· Pantalla:
┌────────────────────────────────────────┐
│ INICIAR SESIÓN PLATAFORMA │
│ │
│ Email: [ admin@posco.io ] │
│ Password: [**********] │
│ │
│ [ Ingresar a la Plataforma ] │
└────────────────────────────────────────┘

ENDPOINT: POST /api/auth/login/platform
HEADERS: NINGUNO especial (NO requiere X-Tenant-Id)
REQUEST BODY: LoginAdminDto { email, password }
RESPONSE BODY: AuthResponseDto
REDIRECT: /admin/tenants

ROUTE: /login/pos
· Uso: acceso RÁPIDO desde la web con credenciales cortas POS
(Username 4-5 dígitos + PIN 4 dígitos).
· Escenario típico: el cajero NO necesita la UI de administración pero
sí quiere ver sus propias ventas, historial, imprimir reimpresiones...
El administrador también puede entrar aquí si su cuenta tiene ambos
hashes configurados (lo cual es el estándar).
· Pantalla:
┌────────────────────────────────────────┐
│ INGRESAR CON CREDENCIALES POS │
│ │
│ Usuario: [____] (solo numérico) │
│ PIN: [____] (solo numérico) │
│ │
│ [ Entrar ] │
└────────────────────────────────────────┘

ENDPOINT: POST /api/auth/login/pos
HEADERS: X-Tenant-Id: <slug> (obligatorio)
REQUEST BODY: LoginPosDto { username, pin }
RESPONSE BODY: AuthResponseDto

VALIDACIÓN CLIENTE: - Username: regex /^\d{4,16}$/
    - Pin:      regex /^\d{4}$/ (exactamente 4 dígitos).

COMPORTAMIENTO COMÚN POST-LOGIN:
· Si HTTP 200: 1. Parsear AuthResponseDto.user → role = user.Role. 2. Persistir JWT (httpOnly? NO; JWT en RAM Zustand), RefreshToken en
httpOnly? NO en SPA. Guardar RefreshToken en sessionStorage con
AES ligero (opcional) o al menos en un store no serializado.
Nota: SPA no puede usar httpOnly cookie desde dominio cruzado. 3. Guardar user profile + X-Tenant-Id (claim "ts" del JWT, NO "tid"). 4. Si header en la respuesta: X-Force-Password-Change = "true"
(o bien ForcePasswordChange=true en el body) → redirigir
a /change-password OBLIGATORIO (bloquear el resto de rutas). 5. Redirigir según rol:
ADMIN global (login platform) → /admin/tenants
ADMIN tenant / MANAGER → /dashboard
CASHIER → /mi-turno

## 3.3 REFRESH TOKEN ROTATION (silent refresh)

- El JWT caduca a los 120 minutos por defecto (configurable: `Jwt:TokenExpirationMinutes`).
  No hardcodear la expiración en el cliente; leer del claim `exp` del JWT.
- El RefreshToken caduca a los 30 días por defecto (`Jwt:RefreshTokenExpirationMinutes` = 43200 min).
- El cliente DEBE interceptar cualquier 401 en un endpoint autorizado
  (cualquiera) y antes de propagar el error al usuario:
  a) Obtener el RefreshToken (guardado tras login).
  b) Llamar a POST /api/auth/refresh-jwt body: { refreshToken: "<valor>" }
  c) HTTP 200 → recibir NUEVO JWT + NUEVO RefreshToken.
  Actualizar store + guardar nuevo refreshToken (el viejo es revocado automáticamente).
  Reintentar el request original con el JWT nuevo.
  d) HTTP 401 en refresh → token revocado / expiró definitivamente.
  Limpiar store completo, redirigir a /login/admin.

- Tanto refresh como login endpoints usan rate-limit (`TenantLoginLimiter`:
  5 req / 5 min por TenantId+IP). Si recibes 429, el body es
  {"error":"Too many requests","hint":"Intenta nuevamente en 60 segundos"}
  (NO hay header `Retry-After`). Esperar 60 s e intentar 1 vez más; luego forzar logout.

  3.4 FORCE PASSWORD CHANGE (obligatorio)

---

Cualquier respuesta de login/refresh puede traer:
Header: X-Force-Password-Change: "true"
Body: ForcePasswordChange: true (siempre igual al header)

La app NO debe permitir navegar a ninguna otra ruta hasta que el usuario
actualice su contraseña vía:
POST /api/auth/change-password
Body: ChangePasswordDto { currentPassword, newPassword }
Response: 204 No Content (sin body).

Tras cambiar exitosamente → invalidar sesiones antiguas (la API ya revoca
todos los refresh tokens del usuario con motivo "password_changed").
Redirigir a /dashboard con toast "Contraseña actualizada exitosamente.
Todas las demás sesiones fueron cerradas.".

================================================================================ 4. ROLES Y POLÍTICAS DE AUTORIZACIÓN
================================================================================

Hay 3 roles en el sistema (mayúsculas en DB, no distinguen case en la API).

┌───────────────┬──────────────────────────────────────────────────────────────────┐
│ ROL │ ALCANCE + PERMISOS │
├───────────────┼──────────────────────────────────────────────────────────────────┤
│ ADMIN (global)│ Operaciones sobre TODOS los tenants (master DB). │
│ │ Rutas /admin/\* │
│ │ · Crear / listar / editar / activar tenants. │
│ │ · Ver registros de auditoría globales. │
│ │ · Asignar nuevos seriales codes POS a un tenant. │
│ │ IMPORTANTE: Un usuario con rol "ADMIN" NO tiene acceso a un │
│ │ tenant específico POR DEFECTO; debe existir su User en la │
│ │ BD tenant correspondiente para autenticarse con X-Tenant-Id. │
├───────────────┼──────────────────────────────────────────────────────────────────┤
│ MANAGER │ Gestiona UN SOLO tenant (el del claim "tid"). │
│ │ Política "RequireManagerOrAdmin" → puede: │
│ │ · Crear / listar / actualizar / desactivar USUARIOS (tenant). │
│ │ · CRUD de Customers, Items, Registers. │
│ │ · Cancelar facturas (POST /{id}/cancel). │
│ │ · Ajustar stock manual. │
├───────────────┼──────────────────────────────────────────────────────────────────┤
│ CASHIER │ Permisos mínimos dentro de UN tenant. │
│ │ Política "RequireAnyUser" → puede: │
│ │ · Ver su propio perfil (GET /users/{id}). │
│ │ · Ver items, customers, registers (sólo lectura). │
│ │ · Cambiar su propia password web (obligatorio si la era temp). │
│ │ · Ver transacciones. │
│ │ NO PUEDE: crear usuarios, cancelar facturas, ajustar stock, etc. │
└───────────────┴──────────────────────────────────────────────────────────────────┘

POLÍTICAS QUE VA A REVISAR EL CLIENTE EN RUTAS:
(En el componente <ProtectedRoute allowedRoles={['ADMIN','MANAGER']}>)

================================================================================ 5. ESTRUCTURA DE RUTAS (React Router v7)
================================================================================

src/routes.tsx o src/App.tsx (createBrowserRouter):

/
├── /login/admin (Pública) LoginAdminPage
├── /login/pos (Pública) LoginPosPage
│
├── /change-password (Requiere auth, sin restricción de rol)
│ │ ChangePasswordPage
│ │ · SOLO es accesible si el usuario tiene ForcePasswordChange=true
│ │ (si no, redirect /dashboard)
│
├── /admin (RequireAdmin global) Layout AdminPanel
│ ├── /admin/tenants TenantsListPage
│ ├── /admin/tenants/:id TenantDetailsPage
│ └── /admin/tenants/:id/serials TenantSerialsPage
│
├── /dashboard (RequireManagerOrAdmin)
│ DashboardVentasPage (widgets Recharts)
│
├── /users (RequireAnyUser listar, RequireManagerOrAdmin crear/editar)
│ ├── /users/list UsersListPage
│ └── /users/new (Manager/Admin) UserCreatePage
│
├── /registers (RequireManagerOrAdmin / List: AnyUser)
│ ├── /registers/list RegistersListPage
│ └── /registers/new RegisterCreatePage
│
├── /customers
│ ├── /customers/list CustomersListPage
│ ├── /customers/new (Manager/Admin) CustomerCreatePage
│ └── /customers/:id/edit (Manager/Admin) CustomerEditPage
│
├── /items
│ ├── /items/list ItemsListPage (con search + paginación)
│ ├── /items/new (Manager/Admin) ItemCreatePage
│ ├── /items/:id/edit (Manager/Admin) ItemEditPage
│ └── /items/:id/stock (Manager/Admin) ItemAdjustStockPage
│
├── /transactions
│ ├── /transactions/list (AnyUser, ver todo | Cashier, ver las suyas)
│ └── /transactions/:id TransactionDetailPage
│
└── /profile (AnyUser) ProfilePage (datos + cambio password)

================================================================================ 6. CATÁLOGO COMPLETO DE ENDPOINTS + EJEMPLOS
================================================================================

## 6.1 AUTH (api/auth/\*)

PLATAFORMA — VERIFICAR SI EXISTE ADMIN GLOBAL:
GET /api/auth/has-admin
Response 200: { hasAdmin: boolean }
· Sin auth. Úsalo al cargar el frontend: si hasAdmin=false → pantalla bootstrap.

PLATAFORMA — BOOTSTRAP (crear primer admin global):
POST /api/auth/bootstrap
Body: { fullName, email, password, documentNumber? }
Response 201: { message, username, tempPin, note }
· Sin auth. Solo funciona si NO existe ningún admin en la BD maestra (hasAdmin=false).

PLATAFORMA — LOGIN ADMIN GLOBAL:
POST /api/auth/login/platform
Headers: NINGUNO especial (NO requiere X-Tenant-Id)
Body: { email: "admin@posco.io", password: "Admin#2025!" }
Response 200: AuthResponseDto
400: validación (password débil, email inválido)
401: credenciales inválidas / cuenta bloqueada
· El JWT generado usa el claim ts="posco-system" (tenant virtual, sin BD real).

LOGIN BACKOFFICE TENANT (email + password larga):
POST /api/auth/login/admin
Headers: X-Tenant-Id (obligatorio)
Body: { email: "admin@tiendita.com", password: "Admin#2025!" }
Response 200: AuthResponseDto
400: validación (password débil, email inválido)
401: credenciales inválidas / usuario inactivo / bloqueado / sin credenciales web
404: {"error":{"code":"tenant_not_found",...}} si el slug no existe o está inactivo

LOGIN POS (username + pin):
POST /api/auth/login/pos
Headers: X-Tenant-Id (obligatorio)
Body: { username: "6789", pin: "4729" }
Response 200: AuthResponseDto
400: formato no numérico, longitudes inválidas
401: credenciales / usuario sin PIN asignado / bloqueado

REFRESH JWT:
POST /api/auth/refresh-jwt
Body: { refreshToken: "64-hex-chars" }
Response 200: AuthResponseDto (JWT nuevo + RefreshToken nuevo)
400: { message: "El campo RefreshToken es obligatorio." }
401: { error: "invalid_grant", message: "..." } → realizar logout.

CAMBIAR PASSWORD WEB (cualquier usuario logueado):
POST /api/auth/change-password
Headers: Authorization + X-Tenant-Id
Body: { currentPassword: "Admin#2025!", newPassword: "Admin#2026!!" }
Response 204 No Content

## 6.2 USUARIOS (api/auth/users)

NOTA: El backend NO expone un endpoint de LISTADO de usuarios todavía
(NO existe GET /api/auth/users). El backoffice obtiene cada usuario por su
id: GET /api/auth/users/{id}. Si la UI necesita un listado, usar los datos
del sync POS (UserSyncDto) o solicitar al equipo backend un endpoint nuevo.

OBTENER 1 USUARIO (cualquier usuario autenticado del tenant):
GET /api/auth/users/{id:Guid}
→ UserResponseDto (sin PIN claro, sin password temporal)

CREAR USUARIO (Manager/Admin):
POST /api/auth/users
Body CreateUserDto:
{
"fullName": "Carlos Pérez",
"email": "carlos@tiendita.com", // PUEDE SER null para cajero sin web access.
"documentType": 1, // 1=CC, 2=CE
"documentNumber": "1023456789", // Solo letras y números; sin puntos/espacios.
"role": "Cashier" // 'Cashier' | 'Manager' | 'Admin'
}
Response 201 Created:
Header Location: /api/auth/users/{id}
Body: UserResponseDto (TemporaryPin + TemporaryWebPassword vienen en CLARO
aquí y solo aquí. UI DEBE mostrar un modal imprimible con estas
credenciales e IMPEDIR que el usuario siga hasta confirmar que las copió.)

ACTUALIZAR NOMBRE USUARIO (Manager/Admin):
PUT /api/auth/users/{id:Guid}
Body: { fullName: "Carlos Alberto Pérez Gómez" }
Response 200: UserResponseDto actualizado.

## 6.3 TENANTS (api/tenants) — Solo ADMIN global (login platform, NO X-Tenant-Id).

CREAR TENANT:
POST /api/tenants
Body CreateTenantDto:
{
"name": "Tiendita Don Ramón S.A.S.",
"contactEmail": "donramon@empresa.com",
"phone": "3001234567",
"address": "Calle 10 #12-34, Bogotá",
"maxRegisters": 2,
"adminDocumentType": 1, // 1=CC, 2=CE (opcional)
"adminDocumentNumber": "1234567890" // (opcional; si no se envía el sistema
// usa el tenantId como documento seed.)
}
201: TenantResponseDto (con SerialCodes dentro). Operación pesada (3-15 s): muestra spinner.

LISTAR TENANTS:
GET /api/tenants?pageNumber=1&pageSize=20 (pageSize rango [1..100])
200: { data: TenantListResponseDto[], pageNumber, pageSize, totalCount, totalPages }

OBTENER DETALLE TENANT:
GET /api/tenants/{id}
200: TenantResponseDto (incluye Lista<PosSerialCodeResponseDto>)

ACTUALIZAR:
PUT /api/tenants/{id}
Body: { name, contactEmail, phone, address }
200: TenantResponseDto

ACTIVAR / DESACTIVAR TENANT (método POST, NO PUT):
POST /api/tenants/{id}/activate → 204 (activa IsActive=true)
POST /api/tenants/{id}/deactivate → 204 (IsActive=false)

ELIMINAR TENANT (DESTRUCTIVO — borra la BD del tenant):
DELETE /api/tenants/{id} → 204 (DROP DATABASE + fila master).
⚠ USAR SOLO con confirmación explícita del usuario en doble modal.

VALIDAR LÍMITE DE CAJAS (útil antes de mostrar "Agregar caja"):
GET /api/tenants/{id}/can-create-register
200: { tenantId, canCreateRegister: true/false }

LISTAR SERIALES POS DEL TENANT:
GET /api/tenants/{id}/serial-codes
200: PosSerialCodeResponseDto[] (estados: Unassigned | Activated | Decommissioned)

DECOMISIONAR SERIAL POS (libera la máquina; el POS recibe device_decommissioned):
POST /api/tenants/{id}/serial-codes/{serialId}/decommission
Body: { reason?: string } (opcional, para auditoría)
200: PosSerialCodeResponseDto con status=Decommissioned

## 6.4 CAJAS / REGISTERS (api/registers)

GET /api/registers?pageNumber=1&pageSize=20 → { data: RegisterResponseDto[], totalCount }
GET /api/registers/{id} → RegisterResponseDto
POST /api/registers → Crear caja (Manager/Admin)
{ name: "CAJA PRINCIPAL", code: "REG-AB12-0800", deviceIdentifier: null, serialCode: null }
201: RegisterResponseDto + Location
PUT /api/registers/{id} → Actualizar (name, deviceIdentifier, serialCode)
POST /api/registers/{id}/status → Cambiar estado (Manager/Admin)
Body: "Active" | "Inactive" | "Maintenance" | "Locked" (JSON string literal, con comillas)
→ 204 No Content. NO es un toggle: envía el estado NUEVO explícito.

## 6.5 CLIENTES (api/customers)

GET /api/customers?pageNumber=1&pageSize=20 → { data: CustomerResponseDto[], totalCount }
GET /api/customers/{id} → CustomerResponseDto
POST /api/customers
Body: { name, documentNumber?, email?, phone?, address?, city?, department? }
201: CustomerResponseDto + Location
PUT /api/customers/{id} → Actualizar (200)
DELETE /api/customers/{id} → 204 (borrado lógico en el backend; IsActive=false)

## 6.6 ITEMS / PRODUCTOS (api/items)

GET /api/items?pageNumber=1&pageSize=20 → { data: ItemResponseDto[], totalCount }
GET /api/items/{id} → ItemResponseDto
POST /api/items
Body: { name, sku?, description?, salePrice, costPrice, stock, minStockLevel, category? }
201: ItemResponseDto + Location
PUT /api/items/{id} → Actualizar datos (no stock) (200)
POST /api/items/{id}/stock → Ajuste manual de stock (Manager/Admin)
Body: 45 (JSON int: cantidad ENTERA de variación; >0 = entrada, <0 = salida)
→ 204 No Content. NO es un {newStock, reason}: es un delta entero firmado.

## 6.7 TRANSACCIONES / FACTURAS (api/transactions)

GET /api/transactions?pageNumber=1&pageSize=20
→ { data: TransactionResponseDto[], totalCount }
(Ordenadas por fecha desc. Sin filtros por rango de fechas todavía;
el listado es de las transacciones RECIENTES del tenant.)
GET /api/transactions/{id} → Detalle + HasEntries (false si no hay lineas)
POST /api/transactions
Body CreateTransactionDto: { registerId, userId, customerId, paymentMethod, entries }
→ 201 Created TransactionResponseDto (número fiscal asignado)
customerId: Guid.Empty (00000000-0000-0000-0000-000000000000) = cliente ocasional.
POST /api/transactions/{id}/cancel (Manager/Admin)
→ 204 No Content (marca Status='Cancelled'; libera stock si aplica)

================================================================================ 7. TIPOS / INTERFACES TYPESCRIPT (CLIENT-SIDE)
================================================================================

/\*

- Archivo sugerido: src/types/api.ts
-
- Estas interfaces son 1:1 con los DTOs C# del backend definidos en TenantDtos.cs.
- Puedes también importar este archivo a través de Orval (npm i orval) junto al
- OpenApi.json descargado de /swagger/v1/swagger.json del backend para mantenerlo
- automáticamente sincronizado.
  \*/

// ------- ENUMS -------
export enum DocumentType {
CedulaCiudadania = 1,
CedulaExtranjeria = 2,
}

export type DocumentTypeLabel = Record<DocumentType, string>;
export const DOCUMENT_TYPE_LABELS: DocumentTypeLabel = {
[DocumentType.CedulaCiudadania]: 'Cédula de Ciudadanía (CC)',
[DocumentType.CedulaExtranjeria]: 'Cédula de Extranjería (CE)',
};

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

// ------- AUTH -------
export interface LoginAdminDto {
email: string; // Email válido.
password: string; // 8+ chars, mayúsc, minúsc, número, símbolo.
}

export interface LoginPosDto {
username: string; // 4-16 dígitos.
pin: string; // Exactamente 4 dígitos.
}

export interface ChangePasswordDto {
currentPassword: string;
newPassword: string; // 8+ chars, política fuerte.
}

export interface RefreshTokenRequestDto {
refreshToken: string; // 64 hex chars.
}

export interface UserResponseDto {
id: string; // Guid (UUID v4).
fullName: string;
email: string | null;
documentType: DocumentType | null;
documentNumber: string | null;
username: string; // 4-5 dígitos (username POS).
role: Role | string;
forcePasswordChange: boolean;
isActive: boolean;
lastLoginAt: string | null; // ISO8601 UTC.
createdAt: string; // ISO8601 UTC.

// Solo se devuelve EN LA RESPUESTA 201 DE CREAR USUARIO:
temporaryPin: string | null; // "4729" (4 dígitos).
temporaryWebPassword: string | null; // "Kg8$pQ29xT!vm3" (password larga temporal).
}

export interface AuthResponseDto {
user: UserResponseDto;
token: string; // JWT.
refreshToken: string | null;
refreshTokenExpiresAtUtc: string;
forcePasswordChange: boolean;
}

export interface CreateUserDto {
fullName: string;
email: string | null; // null = cajero sin acceso web.
documentType: DocumentType; // 1 | 2 (enum).
documentNumber: string; // 1-50 letras/dígitos.
role?: Role | string; // default 'Cashier'.
}

export interface UpdateUserDto {
fullName: string;
}

// ------- TENANTS (ADMIN GLOBAL) -------
export interface CreateTenantDto {
name: string;
contactEmail: string;
phone: string | null;
address: string | null;
maxRegisters: number | null;
adminDocumentType?: DocumentType | null;
adminDocumentNumber?: string | null;
}

export interface UpdateTenantDto {
name: string;
contactEmail: string;
phone: string | null;
address: string | null;
}

export interface PosSerialCodeResponseDto {
id: string; // Guid.
serialCode: string; // "XXXX-XXXX-XXXX-XXXX"
status: 'Unassigned' | 'Activated' | 'Decommissioned' | string;
machineIdentifier: string | null;
deviceName: string | null;
activatedAt: string | null;
lastSeenAt: string | null;
createdAt: string;
}

export interface DecommissionSerialDto {
reason?: string | null;
}

export interface TenantResponseDto {
id: string; // Guid (PublicId).
name: string;
tenantId: string; // Slug único.
contactEmail: string;
phone: string | null;
address: string | null;
isActive: boolean;
maxRegisters: number;
currentRegisterCount:number;
serialCodes: PosSerialCodeResponseDto[] | null;
createdAt: string;
}

export interface TenantListResponseDto {
id: string;
name: string;
tenantId: string;
contactEmail: string;
isActive: boolean;
maxRegisters: number;
createdAt: string;
}

export interface PagedTenantsResponse {
data: TenantListResponseDto[];
pageNumber: number;
pageSize: number;
totalCount: number;
totalPages: number;
}

// ------- REGISTERS / CAJAS -------
export interface CreateRegisterDto {
name: string;
code: string;
deviceIdentifier: string | null;
serialCode: string | null;
}
export interface UpdateRegisterDto {
name: string;
deviceIdentifier: string | null;
serialCode: string | null;
}
export interface RegisterResponseDto {
id: string;
name: string;
code: string;
status: 'Active' | 'Inactive' | 'Maintenance' | 'Locked' | string;
deviceIdentifier: string | null;
serialCode: string | null;
lastActivityAt: string | null;
createdAt: string;
}

// ------- CLIENTES -------
export interface CreateCustomerDto {
name: string;
documentNumber: string | null;
email: string | null;
phone: string | null;
address: string | null;
city: string | null;
department: string | null;
}
export interface UpdateCustomerDto extends Partial<Omit<CreateCustomerDto, 'name'>> {
name: string;
}
export interface CustomerResponseDto {
id: string;
name: string;
documentNumber: string | null;
email: string | null;
phone: string | null;
address: string | null;
city: string | null;
department: string | null;
isActive: boolean;
createdAt: string;
}

// ------- PRODUCTOS / ITEMS -------
export interface CreateItemDto {
name: string;
sku?: string | null;
description?: string | null;
salePrice: number; // decimal.
costPrice: number;
stock: number; // int.
minStockLevel: number;
category?: string | null;
}
export interface UpdateItemDto {
name: string;
sku?: string | null;
description?: string | null;
salePrice?: number | null;
costPrice?: number | null;
category?: string | null;
}
export interface ItemResponseDto {
id: string;
name: string;
sku: string | null;
description: string | null;
salePrice: number;
costPrice: number;
stock: number;
minStockLevel: number;
category: string | null;
isActive: boolean;
trackInventory: boolean;
createdAt: string;
}
// Nota: el ajuste de stock del backend recibe un INT delta en el body (JSON number),
// NO un objeto. quantity > 0 = entrada; quantity < 0 = salida. Respuesta 204.
export type AdjustStockBody = number; // ej. 45 (entrada) o -3 (salida)

// ------- TRANSACCIONES / FACTURAS -------
export interface TransactionEntryDto {
itemId: string; // Guid del Item.
quantity: number; // int.
unitPrice: number;
lineDiscount: number; // default 0.
}
export interface CreateTransactionDto {
registerId: string;
userId: string;
customerId?: string | null; // Guid.Empty = cliente ocasional.
paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Mixed' | string;
entries: TransactionEntryDto[];
}
export interface TransactionEntryResponseDto {
id: string;
transactionId: string;
itemId: string;
itemName: string;
itemSku: string | null;
quantity: number;
unitPrice: number;
lineDiscount: number;
lineTotal: number;
}
export interface TransactionResponseDto {
id: string;
transactionNumber:string;
registerId: string;
userId: string;
customerId: string;
subtotal: number;
taxAmount: number;
discountAmount: number;
totalAmount: number;
paymentMethod: string;
status: 'Open' | 'Completed' | 'Cancelled' | 'Refunded' | string;
notes: string | null;
hasEntries: boolean; // true = hay lineas; usar GET /transactions/{id}/entries (future) o expandir.
}

================================================================================ 8. FLUJOS UI CLAVE (mockups lógicos)
================================================================================

---

## 8.1 PÁGINA: CREAR NUEVO USUARIO (Manager/Admin)

Paso 1: Formulario CreateUserDto (React Hook Form + Zod):

- Nombre completo \* (max 100 chars)
- Email (opcional, tipo email)
- Tipo de documento \* (Select: [1] CC, [2] CE)
- Número de documento \* (solo letras/números, max 50)
- Rol \* (Radio/Select: Cashier / Manager / Admin. Default Cashier)

Paso 2: POST /api/auth/users → si HTTP 201:

- MOSTRAR MODAL IMPOSIBLE DE CERRAR HASTA HABER CONFIRMADO 2 VECES:
  ┌──────────────────────────────────────────────────────────────────────┐
  │ ✅ Usuario creado exitosamente. │
  │ │
  │ ┌────────────────── DATOS DE ACCESO (SE ENTREGAN AL COLABORADOR) ──┐│
  │ │ Nombre: CARLOS PÉREZ GÓMEZ ││
  │ │ Tipo Documento: Cédula CC ││
  │ │ Documento: 1.023.456.789 (opcional, UI formatea con .) ││
  │ │ Username (POS): 6789 ││
  │ │ PIN (Caja POS): 4729 ← resaltar en ROJO ││
  │ │ Password Web: Kg8$pQ29xT!vm3 ← resaltar en AZUL ││
  │ └──────────────────────────────────────────────────────────────────┘│
  │ │
  │ ⚠️ Estas credenciales NUNCA VOLVERÁN A MOSTRARSE desde el │
  │ sistema. Asegúrese de escribirlas / imprimirlas y entregarlas │
  │ físicamente a Carlos Pérez. │
  │ │
  │ [ ] He entregado las credenciales a Carlos Pérez. │
  │ │
  │ [ IR A LA LISTA DE USUARIOS ] │
  └──────────────────────────────────────────────────────────────────────┘
- El botón confirmar se HABILITA SÓLO cuando el checkbox está marcado.

---

## 8.2 PÁGINA: LISTA DE ITEMS

- Buscador top (nombre / SKU / categoría) debounce 300 ms, TanStack Query filter.
- Tabla con: Nombre, SKU, Categoría, Precio Venta, Stock (badge ROJO si stock < minStockLevel),
  Activo, Acciones (editar / ajustar stock).
- Botón "Nuevo producto" (Manager/Admin).
- Alerta stock bajo: Widget contador arriba de la tabla "12 productos con stock mínimo".

---

## 8.3 PÁGINA: CAMBIO DE CONTRASEÑA OBLIGATORIO

- Bloquear navegación (Outlet wrapper: si forcePasswordChange ir a change-password).
- Formulario: contraseña actual, contraseña nueva, confirmar nueva.
- Validadores:
  · newPassword == confirmNewPassword
  · política fuerte password (regex 8+ mayúsc/minúsc/núm/símbolo)
  · newPassword !== currentPassword
- Enviar POST /change-password → si 204: toast "Contraseña actualizada"
  - setForcePasswordChange(false) + redirect dashboard.

---

## 8.4 PÁGINA: DETALLE DE TRANSACCIÓN (Manager/Admin puede cancelar)

- Tarjeta resumen: Número, fecha, caja, cajero, cliente, subtotal, impuestos,
  descuentos, total, método de pago, Estado (Completada en verde / Cancelada en rojo).
- Tabla líneas: Item, Cant, Precio Unit, Desc, Subtotal línea.
- Botón ROJO: Cancelar factura (SOLO si Status='Completed' y rol Manager/Admin).
  Al hacer clic → modal confirmación con:
  "¿Seguro que desea cancelar la factura FAC-000001? Esta acción: 1. Revertirá el stock de los productos (si trackInventory=true). 2. Marcará la factura como Cancelada PERMANENTEMENTE (no se puede deshacer). 3. Requiere ingresar un motivo (10-200 chars)."
  [ Cancelar ] [ CONFIRMAR CANCELACIÓN ]

================================================================================ 9. MANEJO DE ERRORES Y CÓDIGOS HTTP
================================================================================

Patrón: Interceptor global de Axios (o fetch wrapper) que:
· Si HTTP 401 y request NO es /login/\* ni /refresh-jwt:
→ silent refresh + retry.
· Si HTTP 401 y request ES refresh-jwt o después de refresh sigue siendo 401:
→ limpiar store y redirigir /login.
· Si HTTP 403: toast red "No tienes permiso para realizar esta acción."
· Si HTTP 400 con body.errors (FluentValidation ModelState):
→ popular los errores en el formulario (React Hook Form setError).
· Si HTTP 404: toast amarillo "El recurso solicitado no existe o fue eliminado."
· Si HTTP 409/422: mostrar response.message en snackbar naranja.
· Si HTTP 429: toast "Servidor saturado, intentando en X segundos..." + retry.
· Si HTTP 5xx: toast rojo "Error del servidor. Si el problema persiste, contacte soporte." + mostrar al usuario un componente <FallbackUi onRetry={refetch}/>

================================================================================ 10. STORE GLOBAL (Zustand) CON AUTENTICACIÓN
================================================================================

Sugerencia archivo src/store/auth.ts:

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthResponseDto, Role, UserResponseDto } from '../types/api';

interface AuthState {
user: UserResponseDto | null;
jwt: string | null;
refreshToken: string | null;
tenantId: string | null; // valor para header X-Tenant-Id.

    setAuth:   (r: AuthResponseDto) => void;
    updateUser:(u: Partial<UserResponseDto>) => void;
    logout:    () => void;

}

export const useAuth = create<AuthState>()(
persist(
(set) => ({
user: null, jwt: null, refreshToken: null, tenantId: null,

        setAuth: (r) => set({
          user: r.user,
          jwt:  r.token,
          refreshToken: r.refreshToken,
          // El tenantId (slug) lo parseamos de un claim del JWT.
          tenantId: parseJwtClaim<string>(r.token, 'ts') ?? null,
        }),
        updateUser: (u) => set((s) => ({ user: s.user ? { ...s.user, ...u } : s.user })),
        logout: () => set({ user: null, jwt: null, refreshToken: null, tenantId: null }),
      }),
      {
        name: 'pos.auth.v1',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (s) => ({ /* NO persistir el JWT si quieres máxima seguridad;
                                 persistir solo user sin datos sensibles. */ }),
      }
    )

);

Helper para parsear claims del JWT (sin librería):
function parseJwtClaim<T>(token: string, claim: string): T | null {
try {
const base64Url = token.split('.')[1];
const base64 = base64Url.replace(/-/g, '+').replace(/\_/g, '/');
const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
const p = JSON.parse(jsonPayload);
return (p[claim] ?? null) as T | null;
} catch { return null; }
}

================================================================================ 11. BUENAS PRÁCTICAS Y ACCESIBILIDAD
================================================================================

· ARIA Labels en botones sin texto (iconos).
· Formularios: atributo htmlFor, focus en primer input invalid,
error messages asociados con aria-describedby.
· Manejo de loading: <Button loading /> en submit Mientras la request vuela.
· Toast notifications: un system global (sonner o antd App.message) limitado a máximo 3 visibles.
· Fechas: usar dayjs.locale('es-co') + formato human-friendly.
· Monedas: Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).
· Skeleton loaders en listas (no spinners gigantes).
· Imágenes placeholder (no existe en POS items aún pero si en un futuro).
· Rutas protegidas con <RequireAuth role="..."/> y redirect con returnUrl para deep-link después de login.
· Testing: Vitest + Testing Library para flujos login/change-password/crear-usuario mínimo.
· CORS: asegurar que el backend acepta tu dominio (solo reportar al backend team si falla preflight).
· Environment variables (Vite):
VITE_API_BASE_URL=https://pos-api.miempresa.com/api
VITE_APP_ENV=staging|production
VITE_HMAC_SECRET_POS=... (solo si el cliente web también consume endpoints POS; normalmente no).

================================================================================
FIN DEL DOCUMENTO.
================================================================================
