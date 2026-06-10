export type UserRole = "ADMIN" | "REAL_ESTATE" | "admin" | "real_estate";

export type RealEstateProfile = {
  id: string;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  responsibleName?: string | null;

  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  realEstateProfile?: RealEstateProfile | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export function normalizeRole(role?: UserRole | string | null) {
  return String(role ?? "").toUpperCase() as "ADMIN" | "REAL_ESTATE";
}

export function getRoleBasePath(role?: UserRole | string | null) {
  return normalizeRole(role) === "ADMIN" ? "/admin" : "/real_estate";
}
