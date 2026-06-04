import { api } from "@/services/api";

export interface ResetPasswordBody {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export async function resetPassword({
  token,
  password,
  passwordConfirmation,
}: ResetPasswordBody) {
  return api.post("/auth/reset-password", {
    token,
    password,
    passwordConfirmation,
  });
}
