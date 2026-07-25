import { ShieldAlert } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function UnauthorizedPage() {
  const { defaultRoute, isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_34%)] px-4">
      <Card className="w-full max-w-lg rounded-[32px]">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-amber-400/30 bg-amber-500/10 text-amber-500">
            <ShieldAlert className="size-7" />
          </div>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            Your current role does not have permission to access this section of the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to={isAuthenticated ? defaultRoute : "/login"}>{isAuthenticated ? "Go to dashboard" : "Sign in"}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
