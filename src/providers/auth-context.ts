import { createContext } from "react";

import type { AuthSession } from "@/types/auth";

export type AuthContextValue = {
  session: AuthSession | null;
  save: (data: AuthSession) => void;
  isLoading: boolean;
  remove: () => void;
};

export const AuthContext = createContext({} as AuthContextValue);
