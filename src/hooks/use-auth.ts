import { useContext } from "react";

import { AuthContext } from "@/providers/auth-context";

export function useAuth() {
  const context = useContext(AuthContext);

  return context;
}