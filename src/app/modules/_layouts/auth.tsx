import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return <div className="grid min-h-svh lg:grid-cols-2">
    <Outlet />
  </div>;
}
