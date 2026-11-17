import { AxiosError } from "axios"
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/config/axios-client"
import { queryClient } from "@/config/react-query"
import type { AuthSession } from "@/features/auth/types"
import { notify } from "@/hooks/use-notify"
import { useAppStore } from "@/store/app-store"

import { expireSession } from "../session-expiry"

vi.mock("@/hooks/use-notify", () => ({
  notify: { info: vi.fn() },
}))

const mockedNotify = vi.mocked(notify)

function buildSession(expiresAtUtc = new Date(Date.now() + 60_000).toISOString()): AuthSession {
  return {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAtUtc,
    user: { id: "user-1", email: "user@example.com", fullName: "Test User", role: "PlatformAdmin" },
    tenantId: null,
    forcePasswordChange: false,
  }
}

function rejectUnauthorized(config: InternalAxiosRequestConfig): Promise<never> {
  const response: AxiosResponse = {
    data: { message: "Unauthorized" },
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
  }

  return Promise.reject(
    new AxiosError("Request failed with status code 401", AxiosError.ERR_BAD_REQUEST, config, {}, response)
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAppStore.setState({ session: null })
  queryClient.clear()
})

describe("expireSession", () => {
  it("ends the session with a single toast, a store logout and a cleared query cache", () => {
    useAppStore.setState({ session: buildSession() })
    queryClient.setQueryData(["orders"], [{ id: "order-1" }])

    expireSession()

    expect(mockedNotify.info).toHaveBeenCalledTimes(1)
    expect(mockedNotify.info).toHaveBeenCalledWith("session_expired")
    expect(useAppStore.getState().session).toBeNull()
    expect(queryClient.getQueryData(["orders"])).toBeUndefined()
  })

  it("is idempotent when called twice, as parallel 401 responses do", () => {
    useAppStore.setState({ session: buildSession() })

    expireSession()
    expireSession()

    expect(mockedNotify.info).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().session).toBeNull()
  })

  it("does nothing when there is no active session", () => {
    expect(() => expireSession()).not.toThrow()

    expect(mockedNotify.info).not.toHaveBeenCalled()
    expect(useAppStore.getState().session).toBeNull()
  })
})

describe("401 response interceptor", () => {
  beforeEach(() => {
    api.defaults.adapter = rejectUnauthorized
  })

  it("ends the session when a request outside the auth endpoints returns 401", async () => {
    useAppStore.setState({ session: buildSession() })

    const error = await api.get("/api/orders").then(
      () => null,
      (reason: unknown) => reason
    )

    expect(error).toBeInstanceOf(AxiosError)
    expect((error as AxiosError).response?.status).toBe(401)
    expect(mockedNotify.info).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().session).toBeNull()
  })

  it("keeps the session when a 401 comes from the auth endpoints (bad credentials)", async () => {
    useAppStore.setState({ session: buildSession() })

    await expect(
      api.post("/api/Auth/login/platform", { email: "user@example.com", password: "wrong" })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(mockedNotify.info).not.toHaveBeenCalled()
    expect(useAppStore.getState().session).not.toBeNull()
  })
})
