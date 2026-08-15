# BackendPOS — Referencia Completa de API

> **Versión**: ASP.NET Core 10 · PostgreSQL · Arquitectura Clean Architecture + Multi-tenant (DB aislada por tenant)
> **Destinatarios**:
> 1. Equipo **React + TypeScript** (Frontend administrativo)
> 2. Equipo **C# + WPF** (Software de caja / Terminal POS)
>
> **URL base local**: `https://localhost:70xx` o `http://localhost:5xxx` (según launchSettings)

---

## 📋 Tabla de Contenido

- [Convenciones Generales](#-convenciones-generales)
  - [🔑 IDs externos: Sistema Doble Identificador (Caso A)](#-ids-externos-sistema-doble-identificador-caso-a)
  - [Multi-Tenant: Header obligatorio `X-Tenant-Id`](#multi-tenant-header-obligatorio-x-tenant-id)
  - [Autenticación JWT (pendiente conectar)](#autenticación-jwt-pendiente-conectar)
  - [Rate Limiting](#rate-limiting)
  - [Errores y Formatos](#errores-y-formatos)
  - [Firma HMAC (opcional)](#firma-hmac-opcional-x-pos-signature)
- **GRUPO A — ADMINISTRADORES DE LA PLATAFORMA (SUPER ADMIN)**
  - [TENANTS — CRUD y gestión del ciclo de vida](#a1-tenants--crud-y-gestión-del-ciclo-de-vida)
  - [TENANTS — Gestión de Seriales POS](#a2-tenants--gestión-de-seriales-pos)
- **GRUPO B — ADMINISTRADORES DE NEGOCIO (TENANT ADMIN)**
  - [AUTH — Login, Usuarios, Cambio de contraseña](#b1-auth--login-usuarios-cambio-de-contraseña)
  - [CUSTOMERS — Clientes](#b2-customers--clientes)
  - [ITEMS — Productos / Servicios](#b3-items--productos--servicios)
  - [REGISTERS — Cajas Registradoras](#b4-registers--cajas-registradoras)
  - [TRANSACTIONS — Ventas / Facturas](#b5-transactions--ventas--facturas)
- **GRUPO C — TERMINALES POS (Software WPF)**
  - [POS-TERMINAL · Autenticación de caja](#c1-pos-terminal-autenticación-de-caja)
  - [POS-TERMINAL · Sincronización Full / Delta](#c2-pos-terminal-sincronización-full--delta)
  - [POS-TERMINAL · Envío de facturas en bloque](#c3-pos-terminal-envío-de-facturas-en-bloque)
- [APÉNDICE A — TODOS los DTOs](#apéndice-a--todos-los-dtos)
- [APÉNDICE B — Valores por defecto `appsettings.json`](#apéndice-b--configuración-recomendada-appsettingsjson)

---

## 🧭 Convenciones Generales

### 🔑 IDs externos: Sistema Doble Identificador (Caso A)

> **⚠️ Cambio CRÍTICO para los equipos React/WPF**:
>
> Toda entidad expuesta por la **API** usa un **`Id` de tipo `Guid` (UUID v4)**. Internamente el motor de BD usa un `int Id` como clave clustered (para rendimiento de joins e inserts), pero el cliente **nunca ve el `int Id`** — solo el `PublicId` (mapeado transparente como `Id` en los DTOs).

**Formato esperado de ID externo**: `11111111-1111-1111-1111-111111111111` (36 caracteres, 4 guiones, UUID v4).

| Dónde | Tipo ID | Ejemplo |
|---|---|---|
| **URLs de rutas** (`{id}`) | `:guid` (no `:int`) | `GET /api/tenants/22222222-2222-2222-2222-222222222222` |
| **Body JSON (request)** — campos `*Id` | Guid string JSON | `"registerId": "33333333-3333-3333-3333-333333333333"` |
| **Body JSON (response)** — `id`, `userId`, `customerId`, `itemId`, `registerId`, `transactionId` | Guid string JSON | `"id": "44444444-4444-4444-4444-444444444444"` |
| **Diccionarios / Lookups en cliente** | Guid como key | `Dictionary<Guid, ItemDto> ItemsById` |

> **Consejo para el equipo React/TS**: Definir `type UUID = string;` y wrapar todos los campos Id para evitar mezcla accidental con números.  
> **Consejo para WPF/C#**: Usar `Guid.Empty` para "ninguno" (ej. `CustomerId = Guid.Empty` en una venta sin cliente) — **no usar `0`**.

Valores placeholder de ejemplo que usaremos en esta guía:

| Entidad | Guid ejemplo |
|---|---|
| Tenant Demo (Panadería María) | `22222222-2222-2222-2222-222222222222` |
| Usuario Admin | `11111111-1111-1111-1111-111111111111` |
| Usuario Cajero 1 | `55555555-5555-5555-5555-555555555555` |
| Register (Caja Principal) | `33333333-3333-3333-3333-333333333333` |
| Item "Pan de Queso" | `77777777-7777-7777-7777-777777777777` |
| Serial POS AB12-… | `88888888-8888-8888-8888-888888888888` |

---

### Multi-Tenant: Header obligatorio `X-Tenant-Id`

Todos los endpoints del **Grupo B** (tenant) y **la mayoría del Grupo C** (sync y batches) requieren el header `X-Tenant-Id`.

| Caso | ¿Requiere `X-Tenant-Id`? |
|---|---|
| Grupo A (Tenants) | ❌ No. Resuelven contra BD MAESTRA directamente. |
| **`POST /api/pos-terminal/authenticate`** | ❌ No. El tenant se resuelve desde el serial. |
| Grupo B (Auth, Customers, Items, Registers, Transactions) | ✅ **SÍ** |
| `POST /api/pos-terminal/sync/full`, `/sync/delta`, `/invoices/batch` | ✅ **SÍ** |

El valor de `X-Tenant-Id` es el campo `TenantId` (string) del tenant — **no** el Guid Público ni el Id numérico. Ejemplo: `tenant-panaderia-maria`.

### Autenticación JWT (pendiente conectar)

> ⚠️ **Importante para el equipo React**: El backend ya tiene toda la estructura de JWT (`ITokenService`, `AuthResponseDto.Token`). En este build **los endpoints no validan el JWT en el pipeline todavía** (placeholder). El plan es que el login devuelva el token, y los endpoints del grupo B lo requieran vía `[Authorize]`. El `UserId` actual en `ChangePassword` está hardcodeado a Guid `11111111-1111-1111-1111-111111111111` temporalmente. Mencionado explícitamente por si React empieza a guardar tokens antes de la merge final.

### Rate Limiting

| Política | Alcance | Límites |
|---|---|---|
| `PosAuthLimiter` | Solo `/api/pos-terminal/authenticate` por IP | **5 requests por minuto** · Ventana 1 minuto |
| `PosActionLimiter` | Todos los endpoints de `PosTerminalController` por serial/IP | **120 requests por minuto** |

Status code al exceder: **`429 Too Many Requests`** con body:
```json
{"error":"Too many requests","hint":"Intenta nuevamente en 60 segundos"}
```

### Errores y Formatos

Casi todos los errores **400 BadRequest** devuelven:

```json
{ "message": "Descripción humana del problema." }
```

Errores de validación FluentValidation devuelven el **`ModelStateDictionary`** estándar de ASP.NET:

```json
{
  "Email": ["El email es obligatorio.", "Formato de email inválido."],
  "Password": ["Mínimo 6 caracteres."]
}
```

### Firma HMAC (opcional) `X-POS-Signature`

Si el backend tiene configurado `PosIntegration:GlobalSharedSecret` en `appsettings.json`, **todos** los endpoints de `PosTerminalController` validan una firma SHA256 con HMAC. El equipo **WPF** debe implementar:

```
signature = Base64( HMACSHA256( utf8(secret), utf8(raw_json_body) ) )
Header:    X-POS-Signature: <signature>
```

Si `GlobalSharedSecret` es `null` (default), el middleware SKIPea la validación (feature-flag). Para entornos QA/producción se recomienda activarlo.

---

# 🛡️ GRUPO A — ADMINISTRADORES DE LA PLATAFORMA

Usar estos endpoints desde el **Panel Super Administrador** (la empresa que vende/alquila el POS). Toda la data aquí va a la **Base de Datos Maestra** (no a la BD del tenant).

---

## A.1. TENANTS · CRUD y gestión del ciclo de vida

**Ruta base**: `api/tenants`

### A.1.1. Crear un Tenant nuevo + su BD

```
POST /api/tenants
Body: CreateTenantDto
```

**Descripción**: Orquesta TODO: crear registro en Master DB → generar N códigos seriales (`MaxRegisters`) → crear BD PostgreSQL del tenant → ejecutar migraciones → crear usuario admin inicial con password temporal.

**Body ejemplo**:
```json
{
  "name": "Panadería María S.A.S.",
  "contactEmail": "admin@panaderiamaria.com",
  "phone": "+573111111111",
  "address": "Carrera 10 # 20-30, Bogotá",
  "maxRegisters": 3
}
```

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `name` | string (100) | ✅ | Nombre del negocio (se usa en la UI del POS) |
| `contactEmail` | string (200) | ✅ | Único global; se convierte en email del admin del tenant |
| `phone` | string (20) | ❔ | Contacto |
| `address` | string (500) | ❔ | |
| `maxRegisters` | int? | ❔ | Número de cajas registradoras (default 3, **determina cuántos seriales se crean**). |

**Respuesta 201 Created — `TenantResponseDto`** (⚠️ `id` y `serialCodes[].id` son **Guid**):
```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "name": "PANADERÍA MARÍA S.A.S.",
  "tenantId": "PANADERIAMARIA-00002",
  "contactEmail": "admin@panaderiamaria.com",
  "phone": "+573111111111",
  "address": "CARRERA 10 # 20-30, BOGOTÁ",
  "isActive": true,
  "maxRegisters": 3,
  "currentRegisterCount": 0,
  "serialCodes": [
    {
      "id": "88888888-8888-8888-8888-888888888888",
      "serialCode": "AB12-CD34-EF56-GH78",
      "status": "Unassigned",
      "machineIdentifier": null,
      "deviceName": null,
      "activatedAt": null,
      "lastSeenAt": null,
      "createdAt": "2026-08-07T12:00:00Z"
    }
  ],
  "createdAt": "2026-08-07T12:00:00Z"
}
```

> 🔑 **Importante**: La contraseña temporal del admin se genera aleatoriamente y se **loguea en consola** (`LogInformation`). En un despliegue real, este valor se envía por email al cliente. El usuario tendrá `ForcePasswordChange=true` en el login.

**Respuestas de error**:
- `400` Si ya existe tenant con ese `ContactEmail`.
- `500` Si falla la creación de la BD física en PostgreSQL (usuario sin privilegios `CREATEDB`, etc.)

---

### A.1.2. Obtener un Tenant por ID (Guid)

```
GET /api/tenants/{id:guid}
```

Parámetro URL: `id` es el **Guid Público** del tenant (no el `TenantId` string ni el int interno).  
Retorna `TenantResponseDto` (igual que la respuesta de crear) o **404**.

---

### A.1.3. Listar Tenants paginado

```
GET /api/tenants?pageNumber=1&pageSize=20
```

| Query param | Default |
|---|---|
| `pageNumber` | `1` (menor a 1 → 1) |
| `pageSize` | `20` (rango permitido 1..100) |

**Respuesta**:
```json
{
  "data": [ /* TenantListResponseDto[] */
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "SISTEMA PRINCIPAL",
      "tenantId": "posco-system",
      "contactEmail": "admin@posco.com",
      "isActive": true,
      "maxRegisters": 999,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pageNumber": 1, "pageSize": 20,
  "totalCount": 1, "totalPages": 1
}
```

---

### A.1.4. Actualizar datos de un Tenant

```
PUT /api/tenants/{id:guid}
Body: UpdateTenantDto
```

Body:
```json
{ "name": "...", "contactEmail": "...", "phone": "...", "address": "..." }
```

**Importante**: No se actualiza `MaxRegisters` por este endpoint. Si se hace en el futuro, requeriría regenerar seriales adicionales.

---

### A.1.5. Activar / Desactivar Tenant

```
POST /api/tenants/{id:guid}/activate   → 204 NoContent
POST /api/tenants/{id:guid}/deactivate → 204 NoContent
```

Un tenant desactivado:
- No puede autenticar nuevas terminales POS.
- Si el software POS intenta login de usuario, el middleware rechazará la resolución.

---

### A.1.6. Eliminar Tenant (acción destructiva)

```
DELETE /api/tenants/{id:guid} → 204 NoContent
```

Acciones que ejecuta:
1. Intenta `DROP DATABASE` de la BD física del tenant.
2. Elimina el registro de `Tenants` en la Master DB.
3. Elimina en cascada todos los `PosSerialCodes` del tenant.

> Si falla la eliminación física de la BD, se elimina igualmente el registro (con warning en logs). Para entornos cloud con restricciones fuertes, habría que desacoplarlo en un proceso background.

---

### A.1.7. Verificar cupo disponible de cajas

```
GET /api/tenants/{id:guid}/can-create-register
```

Respuesta:
```json
{
  "tenantId": "22222222-2222-2222-2222-222222222222",
  "canCreateRegister": true
}
```

Nota: `tenantId` aquí es el **Guid Público** (no el int ni el slug) para mantener consistencia de contrato.

---

## A.2. TENANTS · Gestión de Seriales POS

### A.2.1. Listar los seriales de un tenant

```
GET /api/tenants/{id:guid}/serial-codes
```

Retorna `List<PosSerialCodeResponseDto>` (misma estructura del campo `serialCodes` del TenantResponse). Campos `status` posibles:

| Status | Significado |
|---|---|
| `Unassigned` | Creado, sin activar. Disponible para que el cliente lo ingrese en el POS. |
| `Activated` | Vinculado a una máquina (`MachineIdentifier` rellenado). |
| `Decommissioned` | Liberado manualmente; puede volver a usarse. |

### A.2.2. Liberar (Decommission) un serial

```
POST /api/tenants/{id:guid}/serial-codes/{serialId:guid}/decommission
Body: { "reason": "PC dañado; se reemplazó la máquina." }
```

Tanto `id` (tenant) como `serialId` son **Guid Públicos**.

Qué hace:
1. Cambia estado en Master DB a `Decommissioned`, limpia `MachineIdentifier`, `DeviceName`, `ActivatedAt`.
2. Va a la BD del tenant y busca el `Register` con ese `SerialCode`:
   - Le quita `SerialCode` y `DeviceIdentifier`.
   - Pone el `Register` en estado `Inactive`.
3. **Medida 4 (Compensación)**: Si el paso 2 falla, se revierte el paso 1 para no quedar inconsistentes. Si incluso la compensación falla → `500` y **LogCritical** (requiere intervención manual).

---

# 🏪 GRUPO B — ADMINISTRADORES DE NEGOCIO (TENANT)

Este grupo lo consume el **Frontend React del cliente** (panadería, tienda, etc.).

⚠️ **Todos requieren header `X-Tenant-Id: <tenant-string-id>`** y **JWT (cuando se active la auth)**.

---

## B.1. AUTH · Login, Usuarios, Cambio de contraseña

**Ruta base**: `api/auth`

### B.1.1. Login del usuario del tenant

```
POST /api/auth/login
Body: LoginDto
```

```json
{ "email": "admin@panaderiamaria.com", "password": "temporal123" }
```

**Respuesta `AuthResponseDto`** — `user.id` es **Guid**:
```json
{
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "fullName": "PANADERÍA MARÍA ADMINISTRADOR",
    "email": "admin@panaderiamaria.com",
    "role": "Admin",
    "forcePasswordChange": true,
    "isActive": true,
    "lastLoginAt": null,
    "createdAt": "2026-08-07T12:00:00Z"
  },
  "token": "jwt-mock-tenant-PANADERIAMARIA-00002-user-11111111111111111111111111111111",
  "forcePasswordChange": true
}
```

Además, si `forcePasswordChange=true` se envía **header extra**: `X-Force-Password-Change: true` (por si el frontend prefiere detectarlo por header).

**Errores**:
- `401 Unauthorized` → credenciales inválidas.
- `400` → usuario inactivo, tenant inactivo, etc.

---

### B.1.2. Crear un usuario

```
POST /api/auth/users
Body: CreateUserDto → { "fullName": "Cajero 1", "email": "cajero1@panaderia.com", "password": "Abc123*" }
```

Roles permitidos: `Admin`, `Manager`, `Cashier` (actualmente se crea con `Cashier` por defecto en el servicio).  
Devuelve `UserResponseDto` 201 Created. El campo `id` de la respuesta es Guid; úsalo en `Location` header.

### B.1.3. Obtener / Actualizar usuario

```
GET  /api/auth/users/{id:guid}   → UserResponseDto | 404
PUT  /api/auth/users/{id:guid}   → Body: UpdateUserDto { "fullName": "..." }
```

### B.1.4. Cambiar contraseña usuario actual

```
POST /api/auth/change-password
Body: { "currentPassword": "...", "newPassword": "..." } → 204 NoContent
```

> ⚠️ TODO técnico: Actualmente `userPublicId` hardcodeado a `11111111-1111-1111-1111-111111111111` (Guid admin demo). El equipo WPF/React debe tener en cuenta que este endpoint leerá el `UserId` desde claims del JWT cuando se active `[Authorize]`.

---

## B.2. CUSTOMERS · Clientes

**Ruta**: `api/customers` · **Todos los endpoints requieren `X-Tenant-Id`**

| Endpoint | Uso |
|---|---|
| `GET /api/customers?pageNumber=1&pageSize=20` | `{ data: CustomerResponseDto[], totalCount: N }` |
| `GET /api/customers/{id:guid}` | Detalle · `id` es Guid |
| `POST /api/customers` | Crear: `{ name, documentNumber?, email?, phone?, address?, city?, department? }` |
| `PUT /api/customers/{id:guid}` | Actualizar (mismo body, todo opcional excepto `name`) |
| `DELETE /api/customers/{id:guid}` | **Soft-delete**: No elimina; marca `IsActive = false`. → `204` |

Unicity: `DocumentNumber` es único por tenant.

---

## B.3. ITEMS · Productos / Servicios

**Ruta**: `api/items` · `X-Tenant-Id` obligatorio

| Endpoint | Uso |
|---|---|
| `GET /api/items?pageNumber=1&pageSize=20` | Listado paginado |
| `GET /api/items/{id:guid}` | Detalle |
| `POST /api/items` | Crear producto |
| `PUT /api/items/{id:guid}` | Actualizar |
| `POST /api/items/{id:guid}/stock` | Ajuste manual de stock |

### B.3.1. Crear producto

```json
{
  "name": "Pan de queso",
  "sku": "PAN-QUESO-001",
  "description": "100g · 6 unidades",
  "salePrice": 3500.0,
  "costPrice": 1800.0,
  "stock": 200,
  "minStockLevel": 10,
  "category": "Panadería"
}
```

- `sku` debe ser **único por tenant**.
- Por defecto `TrackInventory = true`, `IsActive = true`.
- `minStockLevel` solo tiene efecto informativo (panel de alertas). El backend sí **bloquea ventas sin stock** por defecto (ver configuración `Business:AllowNegativeStock`).

### B.3.2. Ajuste manual stock

```
POST /api/items/{id:guid}/stock
Body (raw int): 50  → suma 50; Body: -10 → resta 10
```

`400` si intentas restar más stock que el disponible (a menos que se active AllowNegativeStock).

---

## B.4. REGISTERS · Cajas Registradoras

**Ruta**: `api/registers` · `X-Tenant-Id` obligatorio

| Endpoint | Uso |
|---|---|
| `GET /api/registers` | Listar cajas del tenant |
| `GET /api/registers/{id:guid}` | Detalle · `id` Guid |
| `POST /api/registers` | Crear caja manual |
| `PUT /api/registers/{id:guid}` | Actualizar |
| `POST /api/registers/{id:guid}/status` | Body: `"Active"` / `"Inactive"` |

### B.4.1. Crear caja manual

```json
{
  "name": "Caja Principal",
  "code": "CAJA-1",
  "deviceIdentifier": "PC-CAJA-01-HWID",
  "serialCode": "AB12-CD34-EF56-GH78"
}
```

> **Recomendación al equipo React**: Generalmente **NO se crean cajas manualmente** — se crean automáticamente cuando la terminal POS se autentica (ver C.1). Este endpoint existe para mantenimiento o si el negocio quiere registrar previamente el nombre.

Si se alcanza `Tenant.MaxRegisters` → **400**.

---

## B.5. TRANSACTIONS · Ventas / Facturas

**Ruta**: `api/transactions` · `X-Tenant-Id` obligatorio

> 💡 **Nota para ambos equipos**: Este endpoint es para **ventas en línea** (realizadas desde la web, o si el POS está online y quiere enviar de una). Las **ventas offline** generadas en el WPF van por el **Endpoint C.3 (batch de facturas)** — no por este.

| Endpoint | Uso |
|---|---|
| `GET /api/transactions?pageNumber=1&pageSize=20` | Listado reciente |
| `GET /api/transactions/{id:guid}` | Detalle (incluye `HasEntries: true/false`; el detalle completo de líneas lo resuelve el servicio si se requiere) |
| `POST /api/transactions` | Crear una venta online |
| `POST /api/transactions/{id:guid}/cancel` | Cancelar (no reembolsar) |

### B.5.1. Crear transacción online

**⚠️ Todos los campos `*Id` son Guid. Para "sin cliente" usar `Guid.Empty` (no `0`).**

```json
{
  "registerId": "33333333-3333-3333-3333-333333333333",
  "userId": "55555555-5555-5555-5555-555555555555",
  "customerId": "00000000-0000-0000-0000-000000000000",
  "paymentMethod": "Cash",
  "entries": [
    {
      "itemId": "77777777-7777-7777-7777-777777777777",
      "quantity": 2,
      "unitPrice": 3500.0,
      "lineDiscount": 0
    }
  ]
}
```

- `paymentMethod`: whitelist `Cash|Card|Transfer|Mixed` (configurable en `appsettings`).
- Las líneas validan: stock disponible (bloqueo default), cantidad > 0, precio ≥ 0.
- Campos `Subtotal`, `TaxAmount`, `DiscountAmount`, `TotalAmount` los calcula el backend (no se confía en el cliente).

---

# 🖥️ GRUPO C — TERMINALES POS (Software WPF)

**Ruta base**: `api/pos-terminal`

Este bloque es para el **equipo WPF**. El flujo del cliente se resume en:

```
① → Authenticate con serial
        ↓ (se recibe InitialSyncPayload; RegisterId es Guid)
② → Almacenar localmente: TenantId, RegisterId (GUID!), Users, Items, Customers, StoreInfo
③ → Polling cada X min: DeltaSync (con SinceUtc + RegisterId Guid)
④ → Encolar facturas offline: SubmitInvoices en lotes de máx. 10
⑤ → Repetir ③ y ④ indefinidamente
```

---

## C.1. POS-TERMINAL · Autenticación de caja

```
POST /api/pos-terminal/authenticate
❌ No requiere X-Tenant-Id
Rate Limit: PosAuthLimiter (5/min x IP)
```

**Body `PosTerminalAuthRequestDto`**:
```json
{
  "serialCode": "AB12-CD34-EF56-GH78",
  "machineIdentifier": "PC-CAJA-01-HWID",
  "deviceName": "Caja Principal Piso 1"
}
```

| Campo | Req | Notas WPF |
|---|---|---|
| `serialCode` | ✅ | Ingresado manualmente por el admin del negocio. Formato esperado `XXXX-XXXX-XXXX-XXXX` (mayúsculas/minúsculas aceptadas; se normaliza). |
| `machineIdentifier` | ✅ | ID único de la máquina. **Debe ser estable** (no cambiar entre reinicios). Ejemplos de fuente WPF: `Win32_BIOS.SerialNumber + Win32_BaseBoard.SerialNumber`, o GUID generado 1 vez y guardado en `%ProgramData%\POSCo\machine.id`. Máx 100 chars. |
| `deviceName` | ❔ | Nombre mostrable en el panel administrativo (100 chars). |

**Validaciones aplicadas (relevantes para WPF)**:
1. Formato regex del serial → 400.
2. Serial inexistente → `Success:false`, msg: `"Serial no válido."`
3. Tenant inactivo/sin BD → error.
4. **Un machineId no puede tener 2 seriales activados** → error claro.
5. **Serial activado en otra máquina** → error; se debe liberar desde A.2.2.
6. Límite `MaxRegisters` alcanzado → error.

**Respuesta `PosTerminalAuthResponseDto` (éxito)** — ⚠️ `registerId` es **Guid**:
```json
{
  "success": true,
  "tenantId": "PANADERIAMARIA-00002",
  "tenantName": "PANADERÍA MARÍA S.A.S.",
  "registerId": "33333333-3333-3333-3333-333333333333",
  "registerCode": "REG-AB12-0800",
  "lastSyncUtc": "2026-08-07T14:00:00Z",
  "initialSync": { /* InitialSyncPayloadDto completo */ }
}
```

**Almacenar WPF**: `tenantId` (string) y `registerId` (**`Guid`**, NO int) son OBLIGATORIOS para todos los siguientes requests. El backend ya crea / activa la fila `Register` en la BD tenant con el `MachineIdentifier`.

### C.1.1. InitialSyncPayloadDto (toda la base para offline)

```csharp
record InitialSyncPayloadDto(
    StoreInfoDto      StoreInfo,   // Datos básicos tienda
    List<UserSyncDto>     Users,   // Id: Guid. PIN offline + roles
    List<ItemSyncDto>     Items,   // Id: Guid. Inventario actual
    List<CustomerSyncDto> Customers, // Id: Guid
    DateTime GeneratedAtUtc,
    long    Version           // Incremental; WPF lo guarda como watermark
);
```

| DTO | Campos clave WPF |
|---|---|
| `StoreInfoDto` | `DefaultTaxRate=0.19`, `DefaultCurrency=COP`, `Country=CO`. Muestra en impresiones tickets. |
| `UserSyncDto` | `Id` (**Guid**) + `OfflinePinHash`: hash determinista; WPF puede pedir PIN de 4 dígitos al cajero y validarlo localmente con la misma rutina (recomendación: agregar endpoint auxiliar para especificar la función exacta si se usa). |
| `ItemSyncDto` | `Id` (**Guid**). Todos los `IsActive=true`. Incluye `Stock` actual y `UpdatedAtUtc`. |
| `CustomerSyncDto` | `Id` (**Guid**). `DocumentNumber` único; usa lo mismo que el `Customer` normal. |

---

## C.2. POS-TERMINAL · Sincronización Full / Delta

✅ **Requieren header `X-Tenant-Id`**

### C.2.1. Full Sync (refresco completo)

```
POST /api/pos-terminal/sync/full
Body: { "registerId": "33333333-3333-3333-3333-333333333333" }
```

⚠️ `registerId` es **Guid** — enviar `Guid.Empty` dispara `400`.

Llamar solo cuando:
- El POS inicia por primera vez y el `InitialSyncPayload` del login se perdió por algún motivo.
- Botón manual de "Sincronizar todo".
- Corrupción de la base local del POS.

Devuelve exactamente el mismo `InitialSyncPayloadDto` del login.

### C.2.2. Delta Sync (cambios desde fecha watermark)

```
POST /api/pos-terminal/sync/delta
Body: DeltaSyncRequestDto
```

```json
{
  "registerId": "33333333-3333-3333-3333-333333333333",
  "sinceUtc": "2026-08-07T14:00:00Z"
}
```

- Si `sinceUtc` es `null`, el backend toma por defecto **"hace 24 horas"**.
- Devuelve solo registros **creados o modificados** (`UpdatedAt/CreatedAt >= sinceUtc`).
- Todos los `Items[].Id`, `Customers[].Id`, `Users[].Id` dentro del payload son **Guid**; usa este valor para Upsert local por clave primaria.
- **Anti-flood**: Si la caja pide delta más seguido que `Business:MinDeltaSyncIntervalSeconds` (default 10s), el backend responde **payload vacío** (0 registros) sin registrar `SyncLog`.
- WPF debe guardar `SyncUntilUtc` como nuevo watermark para el siguiente request.

**Respuesta `DeltaSyncResponseDto`**:
```json
{
  "items": [ /* ItemSyncDto[] nuevos. Cada uno con Id (Guid) */ ],
  "customers": [ /* CustomerSyncDto[] · Id Guid */ ],
  "users": [ /* UserSyncDto[] · Id Guid */ ],
  "syncUntilUtc": "2026-08-07T15:00:00Z",
  "totalRecords": 13,
  "version": 638980680000000000
}
```

💡 **Frecuencia polling recomendada**: 1 minuto en horas pico, 5 minutos en horas tranquilas. Nunca menos de 10s.

---

## C.3. POS-TERMINAL · Envío de facturas en bloque

```
POST /api/pos-terminal/invoices/batch
✅ X-Tenant-Id obligatorio
Hasta 10 facturas por lote.
```

Este es el endpoint más robusto; procesa **ventas offline** que el POS generó sin conexión. **Cada factura es atómica**: si una falla, las demás 9 se procesan igualmente. La respuesta trae el status individual.

### C.3.1. Body ejemplo `InvoiceBatchRequestDto`

**⚠️ CRÍTICO WPF**: Todos los campos `registerId`, `userId`, `customerId`, `entries[].itemId` son **Guid**.  
**Para "ninguno"**: `customerId = "00000000-0000-0000-0000-000000000000"` (Guid.Empty) — **NO `0`**.

```json
{
  "registerId": "33333333-3333-3333-3333-333333333333",
  "registerCode": "REG-AB12-0800",
  "invoices": [
    {
      "externalTransactionId": "POSLOCAL-00000245",
      "registerId": "33333333-3333-3333-3333-333333333333",
      "registerCode": "REG-AB12-0800",
      "userId": "55555555-5555-5555-5555-555555555555",
      "userEmail": "cajero1@panaderia.com",
      "customerId": "00000000-0000-0000-0000-000000000000",
      "customerDocumentNumber": "CC-1234567890",
      "customerName": "Cliente ocasional",
      "subtotal": 14000.0,
      "discountAmount": 500.0,
      "taxAmount": 2565.0,
      "totalAmount": 16065.0,
      "paymentMethod": "Cash",
      "notes": "Descuento de promoción 2x1",
      "transactionAtUtc": "2026-08-07T12:44:10Z",
      "entries": [
        {
          "itemId": "77777777-7777-7777-7777-777777777777",
          "itemSku": "PAN-QUESO-001",
          "itemName": "Pan de queso",
          "quantity": 4,
          "unitPrice": 3500.0,
          "lineDiscount": 500.0,
          "taxAmount": 1330.0
        }
      ]
    }
  ]
}
```

| Campo (factura) | WPF Notas |
|---|---|
| `externalTransactionId` | ✅ **OBLIGATORIO** y único por caja (máx 100 chars). Clave de **idempotencia**: si el POS reenvía el mismo batch (timeout de red) y el backend ya procesó esa factura, retorna `success:true` sin duplicar. |
| `userId` / `userEmail` | Al menos uno debe ser válido. `userId` es **Guid**. Si `userId` no existe pero `userEmail` sí, se resuelve automáticamente. Si el usuario está **inactivo** → la factura se rechaza individualmente. |
| `customerId` / `customerDocumentNumber` / `customerName` | `customerId` es Guid o `Guid.Empty`; si está vacío pero hay `customerDocumentNumber` se busca o se CREA automáticamente un cliente mínimo. |
| `subtotal / discountAmount / taxAmount / totalAmount` | Se validan matemáticamente: `Total = Subtotal + Tax − Discount` (tolerancia ±$0.01). También se valida `Sum(Qty × Unit − LnDto) ≈ Subtotal`. |
| `paymentMethod` | Whitelist: `Cash/Card/Transfer/Mixed` por defecto. |
| `transactionAtUtc` | Fecha real de la venta (offline). Tope máximo `MaxInvoiceOfflineAgeDays` días (default 30). No puede estar > 5 min en el futuro. |
| `entries[]` | Al menos 1 línea. `itemId` Guid es preferente; si no, se busca por `itemSku`; si no existe, se graba la línea sin vínculo a Item (nombre y SKU copiados como texto). |

### C.3.2. Validación stock (bloqueo por defecto)

Por defecto el backend **bloquea** la factura individual si algún producto queda con stock < 0. El WPF debe reaccionar a este error en `results[i].errorMessage` — nota que el `Id` referenciado ahora es **Guid Público**:

```json
"Stock insuficiente para el producto 'Pan de queso' (PublicId=77777777-7777-7777-7777-777777777777). Stock actual=3, Requerido=5. Habilite Business:AllowNegativeStock=true si desea permitir ventas sin stock."
```

Estrategia sugerida WPF: Reencolar la factura con prioridad baja y notificar al cajero (tal vez hubo venta simultánea en línea y el stock ya no existe; llamar `DeltaSync` para refrescar inventario y reintentar).

### C.3.3. Respuesta `InvoiceBatchResponseDto`

⚠️ `results[].transactionId` es **Guid Público** (no int). Úsalo para el lookup local si necesitas enlazar la cola offline con la venta en backend.

```json
{
  "batchId": "BATCH-20260807150000-1a2b3c4d5e6f7a8b9c0d1e2f",
  "totalInvoices": 10,
  "processedCount": 9,
  "failedCount": 1,
  "processedAtUtc": "2026-08-07T15:00:00Z",
  "results": [
    {
      "externalTransactionId": "POSLOCAL-00000245",
      "success": true,
      "transactionId": "99999999-9999-9999-9999-999999999999",
      "transactionNumber": "OFF-POSLOCAL-00000245"
    },
    {
      "externalTransactionId": "POSLOCAL-00000246",
      "success": false,
      "errorMessage": "Usuario 'cajero_inactivo@panaderia.com' está inactivo..."
    }
  ]
}
```

**Logica WPF tras recibir la respuesta**:

| Status individual | Acción |
|---|---|
| `success: true` | Eliminar la factura de la cola offline persistente. Guardar `transactionId` (Guid) si necesitas trazabilidad futura. |
| `success: false` | ✅ **NO eliminar de la cola**. Mostrar error al cajero; reintentar en próximo ciclo tras corregir el problema (stock, usuario activo, etc.). Si el error es de formato inválido (ej: campos faltantes), marcar como "Requiere revisión humana" y no reintentar indefinidamente. |

**Status codes HTTP globales del lote**:
- `200 OK` → Todas OK, o mix OK+Fail pero al menos 1 OK.
- `422 UnprocessableEntity` → 0 facturas OK y todas falladas (ej: batch de 5 facturas y todas con cálculos inválidos).
- `400` → Request entero inválido (no llega a procesar ninguna).

---

# 📚 APÉNDICE A · TODOS los DTOs (resumen)

Para referencia rápida del equipo React + WPF. Todos los DTOs están en [TenantDtos.cs](file:///d:/Proyectos/POSCo/BackendPOS/src/Application/DTOs/TenantDtos.cs).

**Regla general de tipos**: Cualquier campo llamado `Id` o terminado en `Id` expuesto en un DTO es **`Guid`** (a menos que el nombre indique lo contrario, p.ej. `ExternalTransactionId` que es string libre).

| DTO | Usado en |
|---|---|
| `CreateTenantDto`, `UpdateTenantDto`, `TenantResponseDto`, `TenantListResponseDto` | Grupo A · `Id = Guid` |
| `PosSerialCodeResponseDto`, `DecommissionSerialDto` | Grupo A (seriales) · `Id = Guid` |
| `LoginDto`, `AuthResponseDto`, `ChangePasswordDto` | Grupo B / Login · `User.Id = Guid` |
| `CreateUserDto`, `UpdateUserDto`, `UserResponseDto` | Grupo B (usuarios) · `Id = Guid` |
| `CreateCustomerDto`/`Update`/`Response` | Grupo B · `Id = Guid` |
| `CreateItemDto`/`Update`/`Response` | Grupo B · `Id = Guid` |
| `CreateRegisterDto`/`Update`/`Response` | Grupo B y C.1 (interno) · `Id = Guid` |
| `TransactionEntryDto`, `CreateTransactionDto`, `TransactionResponseDto`/`EntryResponse` | Grupo B · `RegisterId / UserId / CustomerId / ItemId / TransactionId = Guid` |
| `PosTerminalAuthRequestDto`, `PosTerminalAuthResponseDto` | **WPF C.1** · `RegisterId = Guid?` |
| `InitialSyncPayloadDto`, `StoreInfoDto`, `UserSyncDto`, `ItemSyncDto`, `CustomerSyncDto` | **WPF C.1 + C.2.1** · Todos los Sync*.Id = Guid |
| `DeltaSyncRequestDto`, `DeltaSyncResponseDto` | **WPF C.2.2** · `RegisterId = Guid` |
| `InvoiceEntryBatchDto`, `InvoiceBatchItemDto`, `InvoiceBatchRequestDto`, `InvoiceBatchResultItemDto`, `InvoiceBatchResponseDto` | **WPF C.3** · `*Id` = Guid, `TransactionId` de resultado = Guid |

---

# ⚙️ APÉNDICE B · Configuración recomendada `appsettings.json`

Los equipos de despliegue y QA deben ajustar estos valores:

```json
{
  "ConnectionStrings": {
    "MasterDb": "Host=localhost;Port=5432;Database=posco_master;Username=postgres;Password=TU_PASSWORD;Pooling=true;"
  },

  "Business": {
    "DefaultMaxRegisters": 3,

    "AllowNegativeStock": false,
    // ↑ false = BLOQUEA facturas batch sin stock (comportamiento default solicitado)

    "MaxInvoiceOfflineAgeDays": 30,
    // ↑ Tope de antiguedad de facturas offline aceptadas.

    "MinDeltaSyncIntervalSeconds": 10,
    // ↑ Anti-flood: mínimo tiempo entre delta-sync por caja.

    "AllowedPaymentMethods": ["Cash", "Card", "Transfer", "Mixed"]
  },

  "PosIntegration": {
    "GlobalSharedSecret": null
    // ↑ Poner string aleatorio 32-64 chars en producción para activar
    //   validación HMAC (X-POS-Signature header). Mientras null: skip.
  }
}
```

---

## 🗂️ Referencia rápida a controladores / archivos fuente

| Endpoint Group | Controlador | Archivo |
|---|---|---|
| A (Platform Admin) | `TenantsController` | [TenantsController.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/TenantsController.cs) |
| B1 (Auth) | `AuthController` | [AuthController.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/AuthController.cs) |
| B2 (Customers) | `CustomersController` | [BusinessControllers.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/BusinessControllers.cs#L87-L148) |
| B3 (Items) | `ItemsController` | [BusinessControllers.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/BusinessControllers.cs#L156-L215) |
| B4 (Registers) | `RegistersController` | [BusinessControllers.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/BusinessControllers.cs#L17-L80) |
| B5 (Transactions online) | `TransactionsController` | [BusinessControllers.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/BusinessControllers.cs#L223-L294) |
| C (POS WPF integration) | `PosTerminalController` | [PosTerminalController.cs](file:///d:/Proyectos/POSCo/BackendPOS/BackendPOS/Controllers/PosTerminalController.cs) |

---

_**Fin de la referencia**_. Cualquier actualización a endpoints debe reflejarse aquí.
