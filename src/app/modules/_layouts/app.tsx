import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import doculocIcon from "@/assets/icon.svg";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHomePath, normalizeRole } from "@/types/auth";
import { AppSidebar } from "../admin/components/app-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppLayout({
  expectedRole,
}: {
  expectedRole?: "ADMIN" | "REAL_ESTATE" | "ACCOUNT_EXECUTIVE";
}) {
  const { session, isLoading, remove } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  if (!session) {
    return (
      <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
    );
  }

  const currentRole = normalizeRole(session.user.role);

  if (expectedRole && currentRole !== expectedRole) {
    return <Navigate to={getRoleHomePath(currentRole)} replace />;
  }

  function handleSignOut() {
    remove();
    navigate("/sign-in");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="app-shell-bg min-h-svh min-w-0 overflow-x-hidden bg-transparent">
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="shrink-0 rounded-2xl block md:hidden" />
              <div className="min-w-0 flex items-center gap-2">
                <img
                  src={doculocIcon}
                  className="w-6 max-w-full"
                  alt="Doculoc"
                />
                <p className="truncate text-sm font-medium">
                  {currentRole === "ADMIN"
                    ? "Administração"
                    : currentRole === "ACCOUNT_EXECUTIVE"
                      ? "Executivo de contas"
                      : "Portal imobiliária"}
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="icon-sm"
                  className="shrink-0 rounded-full"
                >
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Desconectar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
