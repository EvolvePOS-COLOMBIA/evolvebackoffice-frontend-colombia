import { test, expect, request, type APIRequestContext, type APIResponse, type Page } from "@playwright/test"
import { createServer, type Server } from "node:http"
import { createHmac, randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Run against a local Development backend with PostgreSQL. Each run owns its tenant.
// E2E_BACKEND_DIR points to the BackendPOS repo; VITE_API_URL must match E2E_API_URL.
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:5285"
const backendDir = process.env.E2E_BACKEND_DIR
test.describe.configure({ mode: "serial" })
test.skip(!backendDir, "Set E2E_BACKEND_DIR to run the real API/Playwright suite.")

type Entity = { id: string; name: string }
type CreatedTenant = Entity & { tenantId: string; contactEmail: string; adminTemporaryPassword: string }
type Board = { unassigned: Delivery[]; couriers: { orders: Delivery[]; pendingToCollect: number }[] }
type Delivery = Entity & {
  reference: string
  status: string
  customerName: string
  customerPhone: string
  tipAmount: number
  paymentConfirmed: boolean
  changeToCarry: number
  syncStatus: string
  deliveryFailureReason: string | null
  cancelledWhileDispatched: boolean
}
let platform: APIRequestContext
let api: APIRequestContext
let cashier: APIRequestContext
let tenant: CreatedTenant
let branch: Entity
let courier: Entity
let otherCourier: Entity
let item: Entity
let shift: Entity
let token: string
let mobileToken: string
let cashOrder: string
let prepaidOrder: string
let server: Server
let fakeUrl: string
let jwtCfg: { Secret: string; Issuer: string; Audience: string }
const outbound: string[] = []
const suffix = randomUUID().slice(0, 8)
let manualOne: string
let manualTwo: string
let eShift: Entity
let eToken: string
let eZone: Entity & {
  branchId: string
  latitude: number
  longitude: number
  radiusMeters: number
  shippingCost: number
  priority: number
  isActive: boolean
}
const proofPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII="
// UI/marker behavior is real; automated QA never loads community tile servers.
test.beforeEach(async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({ contentType: "image/png", body: Buffer.from(proofPng, "base64") })
  )
})

async function check(response: APIResponse) {
  expect(response.ok(), `${response.status()} ${response.url()} ${await response.text()}`).toBeTruthy()
}
async function json<T>(response: APIResponse): Promise<T> {
  await check(response)
  return response.json() as Promise<T>
}
function jwt(role: string, tenantId?: string) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ iss: jwtCfg.Issuer, aud: jwtCfg.Audience, sub: randomUUID(), role, ...(tenantId ? { tid: tenantId } : {}), exp: Math.floor(Date.now() / 1000) + 3600 })}`
  return `${unsigned}.${createHmac("sha256", jwtCfg.Secret).update(unsigned).digest("base64url")}`
}
async function session(page: Page, accessToken = token) {
  await page.addInitScript(
    ({ tenantId, accessToken }) =>
      localStorage.setItem(
        "pos-manager-storage",
        JSON.stringify({
          state: {
            session: {
              accessToken,
              refreshToken: null,
              expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
              user: { id: "e2e", email: "qa@example.test", fullName: "QA", role: "BusinessAdmin" },
              tenantId,
              forcePasswordChange: false,
            },
            theme: "light",
            locale: "es",
            onboardingCompleted: { [tenantId]: true },
            onboardingDrafts: {},
          },
          version: 0,
        })
      ),
    { tenantId: tenant.tenantId, accessToken }
  )
}
async function webhook(reference: string, extras: Record<string, unknown> = {}, status = "done", products?: object[]) {
  return json<{ orderId: string }>(
    await platform.post(`/api/webhooks/cluvi/${tenant.tenantId}?storeId=phase2`, {
      data: {
        store_id: "phase2",
        customer: {
          name: "Rafael Pérez",
          email: "rafael@example.test",
          phone_code: "57",
          phone_number: "3001234567",
          document_number: "123456",
        },
        order_detail: {
          order_id: reference,
          created_at: new Date().toISOString(),
          status,
          service: "delivery",
          payment_method: "cash",
          payment_confirmed: false,
          comment: "Sin cebolla",
          delivery_information: {
            complete_address: "Calle 10 # 20-30",
            complement: "Apto 2",
            coordinates: { lat: 4.61, lon: -74.08 },
          },
          totals: {
            total_products: 20000,
            total_discounts: 0,
            total_delivery: 5000,
            total_tip: 2000,
            total_order: 27000,
          },
          products: products ?? [
            {
              pos_id: `unlinked-${reference}`,
              sku: `unlinked-${reference}`,
              label: "Hamburguesa Cluvi",
              quantity: 1,
              price: 20000,
              total: 20000,
              modifiers: [],
            },
          ],
          ...extras,
        },
      },
    })
  )
}
async function board(): Promise<Board> {
  return json<Board>(await api.get(`/api/orders/deliveries?branchId=${branch.id}`))
}
function allOrders(board: Board) {
  return [...board.unassigned, ...board.couriers.flatMap((g) => g.orders)]
}

test.beforeAll(async () => {
  test.setTimeout(120000)
  if (!backendDir) return
  expect(["localhost", "127.0.0.1"]).toContain(new URL(apiUrl).hostname)
  jwtCfg = JSON.parse(readFileSync(join(backendDir, "BackendPOS/appsettings.Development.json"), "utf8")).Jwt
  platform = await request.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${jwt("ADMIN")}` },
  })
  tenant = await json<CreatedTenant>(
    await platform.post("/api/tenants", {
      data: {
        name: `Playwright phase2 ${suffix}`,
        contactEmail: `phase2-${suffix}@example.test`,
        adminIdentification: `99${Date.now()}`,
        maxRegisters: 3,
        countryCode: "CO",
        timeZoneId: "America/Bogota",
      },
    })
  )
  const login = await json<{ token: string }>(
    await platform.post("/api/auth/login/admin", {
      headers: { "X-Tenant-Id": tenant.tenantId },
      data: { email: tenant.contactEmail, password: tenant.adminTemporaryPassword },
    })
  )
  token = login.token
  api = await request.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${token}`, "X-Tenant-Id": tenant.tenantId },
  })
  cashier = await request.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${jwt("CASHIER", tenant.id)}`, "X-Tenant-Id": tenant.tenantId },
  })
  const modules = await json<{ id: string; moduleId: string; moduleCode: string }[]>(
    await api.get("/api/tenant-modules")
  )
  for (const module of modules.filter((m) => ["CLUVI", "ORDERS", "DOMICILIOS"].includes(m.moduleCode)))
    await check(await api.put(`/api/tenant-modules/${module.moduleId}`, { data: { isEnabled: true, quantity: 5 } }))
  branch = await json<Entity>(
    await api.post("/api/branches", { data: { name: "Centro QA", timeZoneId: "America/Bogota" } })
  )
  for (const module of modules.filter((m) => ["CLUVI", "ORDERS", "DOMICILIOS"].includes(m.moduleCode)))
    await check(await api.post(`/api/branches/${branch.id}/modules`, { data: { tenantModulePublicId: module.id } }))
  courier = await json<Entity>(
    await api.post("/api/couriers", { data: { name: "Ana QA", phone: "3002223344", branchId: branch.id } })
  )
  otherCourier = await json<Entity>(await api.post("/api/couriers", { data: { name: "Luis QA", branchId: branch.id } }))
  item = await json<Entity>(await api.post("/api/items", { data: { name: "Hamburguesa vinculada", sku: "CAT-QA" } }))
  await check(
    await api.post(`/api/branches/${branch.id}/items`, {
      data: { branchPublicId: branch.id, itemPublicId: item.id, price: 20000, quantity: 10 },
    })
  )
  server = createServer((req, res) => {
    outbound.push(`${req.method} ${req.url}`)
    res.setHeader("Content-Type", "application/json")
    if (req.url?.includes("push-error")) {
      res.statusCode = 503
      res.end('{"error":"simulated outage"}')
    } else res.end(JSON.stringify({ status: "on", store: { status: "on" }, products: [], categories: [] }))
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Fake Cluvi port unavailable")
  fakeUrl = `http://127.0.0.1:${address.port}`
  await json<Entity>(
    await api.post(`/api/branches/${branch.id}/integrations`, {
      data: {
        platformCode: "CLUVI",
        isActive: true,
        baseUrl: fakeUrl,
        apiKey: "fake-local-token",
        settingsJson: '{"storeId":"phase2"}',
      },
    })
  )
})

test.afterAll(async () => {
  // Delete only the isolated tenant this run created, after checking its exact name and id.
  if (tenant?.id && tenant.name === `Playwright phase2 ${suffix}`.toUpperCase() && platform) {
    const owned = await json<Entity>(await platform.get(`/api/tenants/${tenant.id}`))
    expect(owned.id).toBe(tenant.id)
    expect(owned.name).toBe(`Playwright phase2 ${suffix}`.toUpperCase())
    await check(await platform.delete(`/api/tenants/${tenant.id}`))
  }
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()))
  await api?.dispose()
  await cashier?.dispose()
  await platform?.dispose()
})

test("Cluvi conserva cliente, teléfono, propina y notas; pickup no aparece en domicilios", async () => {
  cashOrder = (await webhook(`cash-${suffix}`)).orderId
  const ready = allOrders(await board()).find((o) => o.id === cashOrder)!
  expect(ready.customerName).toBe("Rafael Pérez")
  expect(ready.customerPhone).toBe("+573001234567")
  expect(ready.tipAmount).toBe(2000)
  expect(ready.paymentConfirmed).toBe(false)
  const detail = await json<{ notes: string }>(await api.get(`/api/orders/${cashOrder}`))
  expect(detail.notes).toContain("Sin cebolla")
  const pickup = await webhook(`pickup-${suffix}`, { service: "pickup" })
  expect(allOrders(await board()).some((o) => o.id === pickup.orderId)).toBe(false)
  const people = await json<{ totalCount: number }>(await api.get("/api/persons"))
  expect(people.totalCount).toBe(1)
})

test("UI inicia un turno y genera enlace móvil", async ({ page }) => {
  await session(page)
  await page.goto("/business/orders/operations")
  await page.getByLabel("Sucursal", { exact: true }).selectOption(branch.id)
  await page.getByLabel("Selecciona un domiciliario", { exact: true }).selectOption(courier.id)
  await page.getByLabel("Base entregada", { exact: true }).fill("50000")
  await page.getByRole("button", { name: "Iniciar turno", exact: true }).click()
  await expect(page.getByText("Ana QA · En turno", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Generar enlace móvil", exact: true }).click()
  await expect(page.getByLabel("Enlace del domiciliario (vence en 24 horas)")).toHaveValue(/\/courier\/.*#.+/)
  const overview = await json<{ shifts: Entity[] }>(await api.get("/api/delivery-operations"))
  shift = overview.shifts[0]
  mobileToken = (await json<{ token: string }>(await api.post(`/api/delivery-operations/shifts/${shift.id}/access`)))
    .token
})

test("UI despacha con paga-con, muestra cambio y envía onWay de inmediato", async ({ page }) => {
  await session(page)
  await page.goto("/business/orders/deliveries")
  const card = page.locator("[data-rfd-draggable-id]").filter({ hasText: `cash-${suffix}` })
  await expect(card.getByText("Rafael Pérez")).toBeVisible()
  await expect(card.getByText(/COBRAR/)).toBeVisible()
  await card.getByRole("button", { name: "Enviar", exact: true }).click()
  await page.getByLabel("Paga con", { exact: true }).fill("26000")
  await expect(page.getByRole("dialog").getByRole("button", { name: "Enviar", exact: true })).toBeDisabled()
  await page.getByLabel("Paga con", { exact: true }).fill("30000")
  await expect(page.getByText(/Llevar.*3\.000.*de cambio/)).toBeVisible()
  await page.getByRole("dialog").getByRole("button", { name: "Enviar", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeHidden()
  expect(outbound.some((p) => p.endsWith(`/cash-${suffix}/onWay`))).toBe(true)
  expect(allOrders(await board()).find((o) => o.id === cashOrder)?.syncStatus).toBe("Synced")
})

test("Móvil entrega líneas sin vincular y concilia efectivo con cambio", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/courier/${tenant.tenantId}#${encodeURIComponent(mobileToken)}`)
  await expect(page.getByRole("heading", { name: /Ana QA.*Mis domicilios/ })).toBeVisible()
  await expect(page.getByRole("link", { name: "+573001234567", exact: true })).toHaveAttribute(
    "href",
    "tel:+573001234567"
  )
  await expect(page.getByRole("link", { name: "Waze" })).toHaveAttribute("href", /waze\.com/)
  await page.getByRole("button", { name: "Entregado", exact: true }).click()
  await page.getByLabel("Recibí en efectivo").fill("26000")
  await expect(page.getByRole("button", { name: "Confirmar entrega y cobro" })).toBeDisabled()
  await page.getByLabel("Recibí en efectivo").fill("30000")
  const delivered = page.waitForResponse(
    (r) => r.url().includes(`/orders/${cashOrder}/deliver`) && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Confirmar entrega y cobro" }).click()
  expect((await delivered).status()).toBe(204)
  await expect(page.getByRole("button", { name: "Confirmar entrega y cobro" })).toHaveCount(0)
  await expect(page.getByText("Entregado", { exact: true })).toBeVisible()
  const preview = await json<{ orders: { id: string; payments: { changeAmount: number }[] }[] }>(
    await api.get(`/api/branches/${branch.id}/order-closing/preview`)
  )
  expect(preview.orders.find((o) => o.id === cashOrder)?.payments[0].changeAmount).toBe(3000)
  await check(
    await platform.post(`/api/courier-mobile/${tenant.tenantId}/orders/${cashOrder}/deliver`, {
      headers: { "X-Courier-Token": mobileToken },
      data: { tenderedAmount: 30000 },
    })
  )
})

test("Prepagado muestra no cobrar, entrega sin efectivo y no aumenta caja", async ({ page }) => {
  prepaidOrder = (await webhook(`prepaid-${suffix}`, { payment_confirmed: true, payment_method: "card" })).orderId
  await check(
    await api.post(`/api/delivery-operations/orders/${prepaidOrder}/dispatch`, { data: { courierId: courier.id } })
  )
  await page.goto(`/courier/${tenant.tenantId}#${encodeURIComponent(mobileToken)}`)
  await expect(page.getByText("PAGADO, no cobrar", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Entregado", exact: true }).click()
  await expect(page.getByLabel("Recibí en efectivo")).toHaveCount(0)
  const delivered = page.waitForResponse(
    (r) => r.url().includes(`/orders/${prepaidOrder}/deliver`) && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Confirmar entrega y cobro" }).click()
  expect((await delivered).status()).toBe(204)
  await expect(page.getByRole("button", { name: "Entregado", exact: true })).toHaveCount(0)
  const overview = await json<{ shifts: { id: string; expectedCash: number; tipsTotal: number }[] }>(
    await api.get("/api/delivery-operations")
  )
  expect(overview.shifts.find((s) => s.id === shift.id)?.expectedCash).toBe(77000)
  expect(overview.shifts.find((s) => s.id === shift.id)?.tipsTotal).toBe(4000)
})

test("No entregado permite retorno y reenvío; cancelación Cluvi avisa al despacho", async ({ page }) => {
  const id = (await webhook(`incident-${suffix}`)).orderId
  await check(await api.post(`/api/delivery-operations/orders/${id}/dispatch`, { data: { courierId: courier.id } }))
  await session(page)
  await page.goto("/business/orders/deliveries")
  await page.getByRole("button", { name: "No entregado", exact: true }).click()
  await page.getByLabel("Motivo").selectOption("No contesta")
  await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click()
  await expect(page.getByText("No entregado: No contesta", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Devolver a tienda", exact: true }).click()
  await page.getByRole("button", { name: "Confirmar devolución", exact: true }).click()
  await expect.poll(async () => allOrders(await board()).find((o) => o.id === id)?.status).toBe("Ready")
  await check(await api.post(`/api/delivery-operations/orders/${id}/dispatch`, { data: { courierId: courier.id } }))
  await webhook(`incident-${suffix}`, {}, "nulled")
  await page.reload()
  await expect(page.getByRole("alert").filter({ hasText: "Cluvi canceló este pedido en camino" })).toBeVisible()
  await page.getByRole("button", { name: "Devolver a tienda", exact: true }).click()
  await page.getByRole("button", { name: "Confirmar devolución", exact: true }).click()
  await expect.poll(async () => allOrders(await board()).some((o) => o.id === id)).toBe(false)
})

test("UI vincula pos_id una sola vez y mapea dataphone al catálogo", async ({ page }) => {
  const id = (await webhook(`link-${suffix}`)).orderId
  await session(page)
  await page.goto("/business/orders/operations")
  const row = page
    .locator("div.rounded-lg.border.p-3")
    .filter({ hasText: `unlinked-link-${suffix}` })
    .first()
  await row.getByLabel(/Artículo del catálogo/).selectOption(item.id)
  await row.getByRole("button", { name: "Vincular", exact: true }).click()
  await expect(row).toBeHidden()
  const detail = await json<{ items: { itemId: string }[] }>(await api.get(`/api/orders/${id}`))
  expect(detail.items[0].itemId).toBe(item.id)
  await page.getByLabel("Medio en Cluvi").fill("dataphone")
  await page.getByLabel("Medio del catálogo").selectOption("TARJETA_DEBITO")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()
  await expect(page.getByText("dataphone → TARJETA_DEBITO", { exact: true })).toBeVisible()
})

test("Cajero puede despachar, pero no administrar domiciliarios ni turnos", async ({ page }) => {
  expect((await cashier.post("/api/couriers", { data: { name: "Forbidden" } })).status()).toBe(403)
  expect(
    (
      await cashier.post("/api/delivery-operations/shifts", {
        data: { courierId: otherCourier.id, branchId: branch.id, openingCash: 0 },
      })
    ).status()
  ).toBe(403)
  await check(await cashier.get("/api/orders/deliveries"))
  const id = (await webhook(`cashier-${suffix}`)).orderId
  await check(await cashier.put(`/api/orders/${id}/courier`, { data: { courierId: otherCourier.id } }))
  await check(await cashier.put(`/api/orders/${id}/status`, { data: { status: "Shipped" } }))
  expect((await cashier.put(`/api/orders/${id}/status`, { data: { status: "Cancelled" } })).status()).toBe(403)
  await check(await cashier.put(`/api/orders/${id}/status`, { data: { status: "Delivered" } }))
  await session(page, jwt("CASHIER", tenant.id))
  await page.goto("/business/orders/deliveries")
  await expect(page.getByRole("link", { name: "Turnos y Cluvi", exact: true })).toHaveCount(0)
  await page.goto("/business/orders/operations")
  await expect(page.getByRole("alert")).toContainText("Solo administradores y gerentes")
})

test("Long-poll muestra un pedido Listo sin recargar y change_payment no regresa su estado", async ({ page }) => {
  await session(page)
  const polling = page.waitForRequest(
    (r) => r.url().includes("/api/orders/updates") && r.url().includes("includeChanges=true")
  )
  await page.goto("/business/orders/deliveries")
  await polling
  const reference = `realtime-${suffix}`
  const id = (await webhook(reference, {}, "cooking")).orderId
  await json(
    await platform.post(`/api/webhooks/cluvi/${tenant.tenantId}?storeId=phase2`, {
      data: {
        store_id: "phase2",
        event: "change_payment",
        order_detail: { order_id: reference },
        event_content: { payment_method: "card", payment_confirmed: true, status: "pending" },
      },
    })
  )
  expect((await json<{ statusCode: string }>(await api.get(`/api/orders/${id}`))).statusCode).toBe("Preparing")
  await webhook(reference, { payment_confirmed: true, payment_method: "card" }, "done")
  const card = page.locator("[data-rfd-draggable-id]").filter({ hasText: reference })
  await expect(card.getByText("PAGADO, no cobrar", { exact: true })).toBeVisible({ timeout: 12000 })
  const updates = await json<{ data: { id: string; status: string }[] }>(
    await api.get(
      "/api/orders/updates?includeChanges=true&waitSeconds=0&sinceUtc=" +
        encodeURIComponent(new Date(Date.now() - 60000).toISOString())
    )
  )
  expect(updates.data.some((o) => o.id === id && o.status === "Ready")).toBe(true)
})

test("UI muestra fallo de sincronización y permite pausar/reanudar Cluvi", async ({ page }) => {
  const id = (await webhook(`push-error-${suffix}`)).orderId
  await check(
    await api.post(`/api/delivery-operations/orders/${id}/dispatch`, { data: { courierId: otherCourier.id } })
  )
  expect(allOrders(await board()).find((o) => o.id === id)?.syncStatus).toBe("Error")
  await session(page)
  await page.goto("/business/orders/deliveries")
  await expect(page.getByText("Cluvi: Error", { exact: true })).toBeVisible()
  await page.goto("/business/orders/operations")
  await page.getByRole("button", { name: "Reanudar tienda", exact: true }).click()
  await expect(page.getByText("Centro QA · Tienda activa", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Pausar tienda", exact: true }).click()
  await expect(page.getByText("Centro QA · Tienda pausada", { exact: true })).toBeVisible()
})

test("UI liquida turno y revoca enlace móvil", async ({ page }) => {
  await session(page)
  await page.goto("/business/orders/operations")
  await page.getByLabel("Efectivo devuelto Ana QA", { exact: true }).fill("77000")
  await page.getByRole("button", { name: "Liquidar turno", exact: true }).click()
  await expect(page.getByText("Ana QA · Liquidado", { exact: true })).toBeVisible()
  expect(
    (
      await platform.get(`/api/courier-mobile/${tenant.tenantId}`, { headers: { "X-Courier-Token": mobileToken } })
    ).status()
  ).toBe(401)
  await page.goto(`/courier/${tenant.tenantId}#${encodeURIComponent(mobileToken)}`)
  await expect(page.getByRole("alert")).toContainText(/revocado|liquidado/)
})

test("E: UI configura zona circular y API protege administración y cobertura", async ({ page }) => {
  await session(page)
  await page.goto("/business/orders/routes")
  await page.getByLabel("Sucursal", { exact: true }).selectOption(branch.id)
  await expect(page.getByRole("region", { name: "Mapa de domicilios pendientes" })).toHaveCount(2)
  await page.getByLabel("Nombre de zona", { exact: true }).fill("Centro E")
  await page.getByLabel("Latitud", { exact: true }).fill("4.61")
  await page.getByLabel("Longitud", { exact: true }).fill("-74.08")
  await page.getByLabel("Radio (metros)", { exact: true }).fill("2500")
  await page.getByLabel("Tarifa de envío", { exact: true }).fill("3800")
  await page.getByLabel("Prioridad", { exact: true }).fill("1")
  const saved = page.waitForResponse(
    (r) => r.url().includes("/delivery-enhancements/zones") && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Agregar zona", exact: true }).click()
  eZone = await (await saved).json()
  expect(eZone.shippingCost).toBe(3800)
  await expect(page.getByRole("button", { name: "Desactivar zona", exact: true })).toBeVisible()
  expect(
    (await cashier.post("/api/delivery-enhancements/zones", { data: { ...eZone, name: "No permitido" } })).status()
  ).toBe(403)
  expect(
    (await api.get(`/api/delivery-enhancements/quote?branchId=${branch.id}&latitude=40&longitude=40`)).status()
  ).toBe(400)
  expect(
    (
      await json<{ shippingCost: number }>(
        await api.get(`/api/delivery-enhancements/quote?branchId=${branch.id}&latitude=4.61&longitude=-74.08`)
      )
    ).shippingCost
  ).toBe(3800)
  await page.screenshot({ path: "test-results/e-zones.png", fullPage: true })
})

test("E: UI crea pedido manual con destinatario y tarifa automática; servidor ignora tarifa manipulada", async ({
  page,
}) => {
  await session(page)
  await page.goto("/business/orders")
  await page.getByRole("button", { name: "Crear Orden", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Productos", { exact: true }).click()
  await page.getByRole("option", { name: /Hamburguesa vinculada/i }).click()
  await dialog.getByLabel("Nombre del cliente", { exact: true }).fill("Cliente E")
  await dialog.getByLabel("Teléfono", { exact: true }).fill("+573001234567")
  await dialog.getByLabel("Dirección", { exact: true }).fill("Calle 10 #20-30")
  await dialog.getByLabel("Latitud", { exact: true }).fill("4.61")
  await dialog.getByLabel("Longitud", { exact: true }).fill("-74.08")
  await dialog.getByLabel("Calcular tarifa automáticamente por zona", { exact: true }).check()
  await expect(dialog.getByText(/Zona Centro E/)).toBeVisible()
  const created = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/orders" && r.request().method() === "POST"
  )
  await dialog.getByRole("button", { name: "Crear Orden", exact: true }).click()
  const response = await created
  expect(response.ok()).toBe(true)
  const data = await response.json()
  manualOne = data.id
  expect(data.shippingCost).toBe(3800)
  expect(data.total).toBe(23800)
  await expect(dialog).toBeHidden()
  const second = await json<{ id: string; shippingCost: number }>(
    await api.post("/api/orders", {
      data: {
        branchId: branch.id,
        customerName: "Cliente E dos",
        customerPhone: "+573001234567",
        shippingStreet: "Calle 11",
        shippingLatitude: 4.61,
        shippingLongitude: -74.08,
        paymentMethod: "EFFECTIVO",
        automaticShipping: true,
        shippingCost: 1,
        items: [{ itemPublicId: item.id, quantity: 1 }],
      },
    })
  )
  manualTwo = second.id
  expect(second.shippingCost).toBe(3800)
  await check(await api.put(`/api/delivery-enhancements/zones/${eZone.id}`, { data: { ...eZone, shippingCost: 9000 } }))
  expect((await json<{ shippingCost: number }>(await api.get(`/api/orders/${manualOne}`))).shippingCost).toBe(3800)
  const failed = await api.post("/api/orders", {
    data: {
      branchId: branch.id,
      shippingStreet: "Fuera",
      shippingLatitude: 40,
      shippingLongitude: 40,
      automaticShipping: true,
      items: [{ itemPublicId: item.id, quantity: 1 }],
    },
  })
  expect(failed.status()).toBe(400)
})

test("E: lote inválido no despacha parcialmente; UI reordena dos paradas y despacha", async ({ page }) => {
  eShift = await json<Entity>(
    await api.post("/api/delivery-operations/shifts", {
      data: { courierId: courier.id, branchId: branch.id, openingCash: 0 },
    })
  )
  eToken = (await json<{ token: string }>(await api.post(`/api/delivery-operations/shifts/${eShift.id}/access`))).token
  await check(await api.put(`/api/orders/${manualOne}/status`, { data: { status: "Preparing" } }))
  await check(await api.put(`/api/orders/${manualOne}/status`, { data: { status: "Ready" } }))
  const bad = await api.post("/api/delivery-enhancements/runs", {
    data: { shiftId: eShift.id, orderIds: [manualOne, manualTwo] },
  })
  expect(bad.status()).toBe(400)
  expect((await json<{ statusCode: string }>(await api.get(`/api/orders/${manualOne}`))).statusCode).toBe("Ready")
  await check(await api.put(`/api/orders/${manualTwo}/status`, { data: { status: "Preparing" } }))
  await check(await api.put(`/api/orders/${manualTwo}/status`, { data: { status: "Ready" } }))
  const ready = allOrders(await board())
  const one = ready.find((o) => o.id === manualOne)!
  const two = ready.find((o) => o.id === manualTwo)!
  await session(page)
  await page.goto("/business/orders/routes")
  await page.getByLabel("Sucursal", { exact: true }).selectOption(branch.id)
  await page.getByLabel("Turno del domiciliario", { exact: true }).selectOption(eShift.id)
  await page.getByLabel(`#${one.reference}`, { exact: true }).check()
  await page.getByLabel(`#${two.reference}`, { exact: true }).check()
  await page.getByRole("button", { name: "Subir parada 2", exact: true }).click()
  const dispatched = page.waitForResponse(
    (r) => r.url().includes("/delivery-enhancements/runs") && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Despachar 2 pedidos", exact: true }).click()
  const run = await (await dispatched).json()
  expect(run.stops.map((s: { orderId: string }) => s.orderId)).toEqual([manualTwo, manualOne])
  expect(run.stops.every((s: { status: string }) => s.status === "Shipped")).toBe(true)
  await expect(page.getByRole("button", { name: "Avisar al cliente", exact: true })).toHaveCount(2)
  await page.screenshot({ path: "test-results/e-run.png", fullPage: true })
})

test("E: aviso manual prepara WhatsApp Desktop sin API ni envío real; Cluvi no duplica aviso", async ({ page }) => {
  await session(page)
  await page.goto("/business/orders/routes")
  await page.getByLabel("Sucursal", { exact: true }).selectOption(branch.id)
  await page.getByRole("button", { name: "Avisar al cliente", exact: true }).first().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Mensaje", { exact: true })).toHaveValue(/va en camino con Ana QA/)
  const link = dialog.getByRole("link", { name: "Abrir WhatsApp Desktop", exact: true })
  const href = await link.getAttribute("href")
  expect(href).toMatch(/^whatsapp:\/\/send\?phone=573001234567&text=/)
  expect(new URL(href!).searchParams.get("text")).toContain("Ana QA")
  // Cancel external protocol navigation: no contact or real message is touched in QA.
  await link.evaluate((el) => el.addEventListener("click", (e) => e.preventDefault()))
  const external: string[] = []
  page.on("request", (r) => {
    if (/whatsapp|wa\.me/i.test(r.url())) external.push(r.url())
  })
  await link.click()
  expect(external).toEqual([])
  await expect(dialog.getByText(/no lo envía automáticamente/)).toBeVisible()
  await dialog.getByLabel("Destinatario WhatsApp").fill("javascript:alert(1)")
  await expect(link).toHaveCount(0)
  await expect(dialog.getByRole("alert")).toContainText("teléfono internacional válido")
  await page.screenshot({ path: "test-results/e-whatsapp.png" })
})

test("E: móvil firma entrega, no permite firma sin consentimiento y prueba solo visible con autorización", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/courier/${tenant.tenantId}#${encodeURIComponent(eToken)}`)
  await page.getByRole("button", { name: "Entregado", exact: true }).first().click()
  await page.getByLabel("Recibí en efectivo", { exact: true }).fill("25000")
  await page.getByLabel("Tipo de prueba").selectOption("Signature")
  await page.getByLabel("Nombre de quien recibe").fill("Cliente firma")
  const canvas = page.getByLabel("Firma de recibido", { exact: true })
  await canvas.scrollIntoViewIfNeeded()
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 50)
  await page.mouse.down()
  await page.mouse.move(box.x + 140, box.y + 75, { steps: 10 })
  await page.mouse.move(box.x + 220, box.y + 40, { steps: 10 })
  await page.mouse.up()
  await expect(page.getByRole("button", { name: "Confirmar entrega y cobro" })).toBeDisabled()
  await page.getByLabel("El destinatario autoriza guardar esta foto o firma como prueba de entrega.").check()
  await expect(page.getByRole("button", { name: "Confirmar entrega y cobro" })).toBeEnabled()
  await page.screenshot({ path: "test-results/e-mobile-signature.png", fullPage: true })
  const delivered = page.waitForResponse((r) => r.url().includes("/deliver") && r.request().method() === "POST")
  await page.getByRole("button", { name: "Confirmar entrega y cobro" }).click()
  const response = await delivered
  expect(response.status()).toBe(204)
  const deliveredId = new URL(response.url()).pathname.split("/").at(-2)!
  expect(deliveredId).toBe(manualTwo)
  const proof = await json<{ kind: string; receiverName: string; data: string }>(
    await api.get(`/api/delivery-enhancements/orders/${deliveredId}/proof`)
  )
  expect(proof.kind).toBe("Signature")
  expect(proof.receiverName).toBe("Cliente firma")
  expect(proof.data.length).toBeGreaterThan(100)
  expect((await cashier.get(`/api/delivery-enhancements/orders/${deliveredId}/proof`)).status()).toBe(403)
  expect(
    (
      await platform.get(`/api/delivery-enhancements/orders/${deliveredId}/proof`, {
        headers: { Authorization: "", "X-Tenant-Id": tenant.tenantId },
      })
    ).status()
  ).toBe(401)
  await session(page)
  await page.goto("/business/orders/deliveries")
  await page.getByRole("button", { name: "Por domiciliario", exact: true }).click()
  await page.getByRole("button", { name: "Ver prueba de entrega", exact: true }).click()
  await expect(page.getByRole("dialog").getByRole("img", { name: "Firma de recibido" })).toBeVisible()
})

test("E: foto válida se guarda atómicamente, formato falso no cobra y reintento no duplica prueba", async ({
  page,
}) => {
  const remaining = allOrders(await board()).find(
    (o) => [manualOne, manualTwo].includes(o.id) && o.status === "Shipped"
  )!
  const url = `/api/courier-mobile/${tenant.tenantId}/orders/${remaining.id}/deliver`
  const headers = { "X-Courier-Token": eToken }
  const bad = await platform.post(url, {
    headers,
    data: { tenderedAmount: 25000, proof: { kind: "Photo", contentType: "image/png", data: "PHN2Zz48L3N2Zz4=" } },
  })
  expect(bad.status()).toBe(400)
  expect((await json<{ statusCode: string }>(await api.get(`/api/orders/${remaining.id}`))).statusCode).toBe("Shipped")
  const payload = {
    tenderedAmount: 25000,
    proof: { kind: "Photo", contentType: "image/png", data: proofPng, receiverName: "Cliente foto" },
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/courier/${tenant.tenantId}#${encodeURIComponent(eToken)}`)
  await page.getByRole("button", { name: "Entregado", exact: true }).click()
  await page.getByLabel("Recibí en efectivo", { exact: true }).fill("25000")
  await page.getByLabel("Tipo de prueba").selectOption("Photo")
  await page.getByLabel("Nombre de quien recibe").fill("Cliente foto")
  await page
    .getByLabel("Foto de entrega", { exact: true })
    .setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: Buffer.from(proofPng, "base64") })
  await expect(page.getByRole("img", { name: "Foto de entrega", exact: true })).toBeVisible()
  await page.getByLabel("El destinatario autoriza guardar esta foto o firma como prueba de entrega.").check()
  const delivered = page.waitForResponse(
    (r) => r.url().includes(`/orders/${remaining.id}/deliver`) && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Confirmar entrega y cobro", exact: true }).click()
  expect((await delivered).status()).toBe(204)
  await check(await platform.post(url, { headers, data: payload }))
  const proofResponse = await api.get(`/api/delivery-enhancements/orders/${remaining.id}/proof`)
  expect(proofResponse.headers()["cache-control"]).toContain("no-store")
  expect((await json<{ data: string }>(proofResponse)).data).toBe(proofPng)
  const summary = await json<{ shifts: { id: string; expectedCash: number; deliveredCount: number }[] }>(
    await api.get("/api/delivery-operations")
  )
  expect(summary.shifts.find((s) => s.id === eShift.id)?.expectedCash).toBe(47600)
  expect(summary.shifts.find((s) => s.id === eShift.id)?.deliveredCount).toBe(2)
})
