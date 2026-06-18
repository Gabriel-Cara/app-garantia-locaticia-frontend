import { api } from "@/services/api";
import { onlyDigits } from "@/lib/format";

export interface SignUpBody {
  email: string
  password: string
  role: string
  realEstateProfile?: {
    name: string
    cnpj: string
    phone: string
    responsibleName: string
  }
}

export async function signUp({ email, password, role, realEstateProfile }: SignUpBody) {
  const cleanRealEstateProfile = realEstateProfile
    ? {
        ...realEstateProfile,
        cnpj: onlyDigits(realEstateProfile.cnpj),
      }
    : undefined;

  return api.post("/auth/register", {
    email,
    password,
    role,
    realEstateProfile: cleanRealEstateProfile
  });
}
