import { api } from "@/services/api";

export interface SignInBody {
  email: string;
  password: string;
}

export async function signIn({ email, password}: SignInBody) {
  return api.post("/auth/login", {
    email,
    password,
  });
}