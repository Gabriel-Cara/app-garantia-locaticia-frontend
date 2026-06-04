import { api } from "@/services/api";

export interface ForgotPasswordBody {
  email: string;
}

export async function forgotPassword({ email }: ForgotPasswordBody) {
  return api.post("/auth/forgot-password", { email });
}
