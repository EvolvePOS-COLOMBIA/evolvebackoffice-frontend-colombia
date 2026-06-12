import { LoginForm } from "@/features/auth/components/login-form"

export function LoginPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_26%)]">
      <LoginForm />
    </div>
  )
}
