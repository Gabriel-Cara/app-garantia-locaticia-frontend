import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getRoleHomePath } from "@/types/auth";

export function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <div className="flex max-w-full items-center gap-3 rounded-full border bg-white px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          <span className="truncate">Carregando sua sessão...</span>
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to={getRoleHomePath(session.user.role)} replace />;
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <Outlet />
    </div>
  );
}