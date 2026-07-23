import { api } from "@/services/api";
import { onlyDigits } from "@/lib/format";

export interface SignUpBody {
  email: string;
  password: string;
  role: string;
  realEstateProfile?: {
    profileType: "COMPANY" | "AUTONOMOUS_BROKER";
    name: string;
    document: string;
    cnpj?: string;
    phone: string;
    responsibleName: string;

    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
}

export async function signUp({
  email,
  password,
  role,
  realEstateProfile,
}: SignUpBody) {
  const cleanDocument = onlyDigits(realEstateProfile?.document);

  const cleanRealEstateProfile = realEstateProfile
    ? {
        ...realEstateProfile,
        document: cleanDocument,
        cnpj:
          realEstateProfile.profileType === "COMPANY"
            ? cleanDocument
            : undefined,
      }
    : undefined;

  return api.post("/auth/register", {
    email,
    password,
    role,
    realEstateProfile: cleanRealEstateProfile,
  });
}
