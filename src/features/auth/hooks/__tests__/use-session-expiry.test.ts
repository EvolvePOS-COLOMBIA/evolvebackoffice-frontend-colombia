import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AuthSession } from "@/features/auth/types"
import { notify } from "@/hooks/use-notify"
import { useAppStore } from "@/store/app-store"

import { useSessionExpiry } from "../use-session-expiry"

vi.mock("@/hooks/use-notify", () => ({
  notify: { info: vi.fn() },
}))

const mockedNotify = vi.mocked(notify)

function buildSession(expiresAtUtc: string): AuthSession {
  return {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAtUtc,
    user: { id: "user-1", email: "user@example.com", fullName: "Test User", role: "PlatformAdmin" },
    tenantId: null,
    forcePasswordChange: false,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useAppStore.setState({ session: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useSessionExpiry", () => {
  it("expires immediately when the deadline is already in the past", () => {
    vi.useFakeTimers()

    const past = new Date(Date.now() - 1_000).toISOString()
    useAppStore.setState({ session: buildSession(past) })

    renderHook(() => useSessionExpiry())

    expect(mockedNotify.info).toHaveBeenCalledTimes(1)
    expect(mockedNotify.info).toHaveBeenCalledWith("session_expired")
    expect(useAppStore.getState().session).toBeNull()
  })

  it("waits for the deadline and expires once the timer fires", () => {
    vi.useFakeTimers()

    const inOneHour = new Date(Date.now() + 60 * 60 * 1_000).toISOString()
    useAppStore.setState({ session: buildSession(inOneHour) })

    renderHook(() => useSessionExpiry())

    expect(mockedNotify.info).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(59 * 60 * 1_000)
    })

    expect(mockedNotify.info).not.toHaveBeenCalled()
    expect(useAppStore.getState().session).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1_000)
    })

    expect(mockedNotify.info).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().session).toBeNull()
  })

  it("expires when the tab becomes visible and the deadline already passed", () => {
    vi.useFakeTimers()

    const inOneHour = new Date(Date.now() + 60 * 60 * 1_000).toISOString()
    useAppStore.setState({ session: buildSession(inOneHour) })

    renderHook(() => useSessionExpiry())

    // Background tabs throttle timers: the clock passes the deadline without
    // the callback running.
    act(() => {
      vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1_000)
    })

    expect(mockedNotify.info).not.toHaveBeenCalled()

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(mockedNotify.info).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().session).toBeNull()
  })

  it("stops listening after unmount", () => {
    vi.useFakeTimers()

    const inOneHour = new Date(Date.now() + 60 * 60 * 1_000).toISOString()
    useAppStore.setState({ session: buildSession(inOneHour) })

    const { unmount } = renderHook(() => useSessionExpiry())
    unmount()

    act(() => {
      vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1_000)
      document.dispatchEvent(new Event("visibilitychange"))
      vi.runAllTimers()
    })

    expect(mockedNotify.info).not.toHaveBeenCalled()
    expect(useAppStore.getState().session).not.toBeNull()
  })
})
