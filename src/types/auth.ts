export type UserRole =
  | "ADMIN"
  | "REAL_ESTATE"
  | "ACCOUNT_EXECUTIVE"
  | "admin"
  | "real_estate"
  | "account_executive";

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

export type NormalizedUserRole = "ADMIN" | "REAL_ESTATE" | "ACCOUNT_EXECUTIVE";

export function normalizeRole(role?: UserRole | string | null) {
  return String(role ?? "").toUpperCase() as NormalizedUserRole;
}

export function getRoleBasePath(role?: UserRole | string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADMIN") return "/admin";
  if (normalizedRole === "ACCOUNT_EXECUTIVE") return "/account-executive";

  return "/real_estate";
}

export function getRoleHomePath(role?: UserRole | string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADMIN") {
    return "/admin/dashboard";
  }

  if (normalizedRole === "ACCOUNT_EXECUTIVE") {
    return "/account-executive/consultas";
  }

  return "/real_estate/dashboard";
}
