import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/config/axios-client"
import { loginBusinessAdmin } from "../auth.service"
import { getCourierMobile, collectDelivery } from "@/features/business/orders/services/delivery-operations.service"
import { createUserSchema } from "@/features/business/people/users/schemas/user-schema"
import i18n from "@/i18n"

vi.mock("@/config/axios-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const mockedApi = vi.mocked(api, { deep: true })

describe("DELIVERY identity", () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(["DELIVERY", "Delivery"])("maps %s to restricted frontend role using existing login", async (role) => {
    mockedApi.post.mockResolvedValue({
      data: {
        token: "header.payload.signature",
        refreshToken: "refresh",
        refreshTokenExpiresAtUtc: "2099-01-01T00:00:00Z",
        forcePasswordChange: true,
        user: { id: "user-id", fullName: "Ana", email: "ana@example.test", role },
      },
    })
    const session = await loginBusinessAdmin({
      tenantPublicId: " company ",
      email: " ana@example.test ",
      password: "temporary",
    })
    expect(session.user.role).toBe("Delivery")
    expect(session.forcePasswordChange).toBe(true)
    expect(session.tenantId).toBe("company")
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/api/Auth/login/admin",
      { email: "ana@example.test", password: "temporary" },
      { headers: { "X-Tenant-Id": "company" } }
    )
  })

  it("uses JWT client and own identity endpoint without courier capabilities", async () => {
    mockedApi.get.mockResolvedValue({ data: { courierName: "Ana" } })
    mockedApi.post.mockResolvedValue({})
    await getCourierMobile()
    await collectDelivery("order-id", 30000)
    expect(mockedApi.get).toHaveBeenCalledWith("/api/delivery/me")
    expect(mockedApi.post).toHaveBeenCalledWith("/api/delivery/me/orders/order-id/deliver", {
      tenderedAmount: 30000,
      proof: null,
    })
  })

  it("requires delivery email but permits legacy profile with no last name", () => {
    const schema = createUserSchema(i18n.getFixedT("es", "business-users-catalog"))
    const profile = {
      firstName: "Legacy Delivery",
      lastName: "",
      identificationTypeId: 1,
      identificationNumber: "12345",
      role: "DELIVERY",
      email: null,
    }
    expect(schema.safeParse(profile).success).toBe(false)
    expect(schema.safeParse({ ...profile, email: "delivery@example.test" }).success).toBe(true)
  })
})
