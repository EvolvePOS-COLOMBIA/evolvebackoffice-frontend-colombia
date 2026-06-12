import { useAppStore } from "@/store/app-store"

export function useAuth() {
  const session = useAppStore((state) => state.session)
  const login = useAppStore((state) => state.login)
  const logout = useAppStore((state) => state.logout)

  return {
    session,
    isAuthenticated: Boolean(session),
    login,
    logout,
  }
}
