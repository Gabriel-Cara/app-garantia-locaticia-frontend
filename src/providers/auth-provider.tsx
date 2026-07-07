import { useState, useEffect, type ReactNode } from "react";
import { api } from "@/services/api";
import { AuthContext } from "./auth-context";
import type { AuthSession } from "@/types/auth";

const LOCAL_STORAGE_KEY = "@doculoc";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<null | AuthSession>(null);
  const [isLoading, setIsLoading] = useState(true);

  function save(data: AuthSession) {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY}:user`,
      JSON.stringify(data.user),
    );
    localStorage.setItem(`${LOCAL_STORAGE_KEY}:token`, data.token);

    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

    setSession(data);
  }

  function remove() {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}:user`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}:token`);

    delete api.defaults.headers.common["Authorization"];
    setSession(null);
  }

  async function loadUser() {
    const token = localStorage.getItem(`${LOCAL_STORAGE_KEY}:token`);

    if (!token) {
      setIsLoading(false);
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    try {
      const response = await api.get("/auth/me");

      const sessionData = {
        token,
        user: response.data.user,
      };

      localStorage.setItem(
        `${LOCAL_STORAGE_KEY}:user`,
        JSON.stringify(response.data.user),
      );

      setSession(sessionData);
    } catch {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}:user`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}:token`);
      delete api.defaults.headers.common["Authorization"];
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, save, remove }}>
      {children}
    </AuthContext.Provider>
  );
}
