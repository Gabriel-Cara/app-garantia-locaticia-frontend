export function onlyDigits(value?: string | number | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCpf(value?: string | number | null) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCnpj(value?: string | number | null) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatDocumentInput(
  value?: string | number | null,
  type?: "CPF" | "CNPJ" | string,
) {
  const digits = onlyDigits(value);

  if (type === "CPF") return formatCpf(digits);
  if (type === "CNPJ") return formatCnpj(digits);

  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

export function formatCurrency(value?: string | number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDocument(value?: string | null, type?: "CPF" | "CNPJ" | string) {
  const digits = onlyDigits(value);

  if (!digits) return value || "-";

  if (type === "CPF" || digits.length === 11) return formatCpf(digits);
  if (type === "CNPJ" || digits.length === 14) return formatCnpj(digits);

  return value || "-";
}

export function initials(name?: string | null) {
  const parts = String(name ?? "Doculoc")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "DL";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function normalizeReasons(reasons?: string[] | string | null) {
  if (!reasons) return [];

  if (Array.isArray(reasons)) return reasons;

  try {
    const parsed = JSON.parse(reasons) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [String(reasons)];
  } catch {
    return [String(reasons)];
  }
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_, ddd, part1, part2) => {
        if (!ddd) return "";
        if (!part1) return `(${ddd}`;
        if (!part2) return `(${ddd}) ${part1}`;
        return `(${ddd}) ${part1}-${part2}`;
      },
    );
  }

  return digits.replace(
    /^(\d{2})(\d{5})(\d{0,4}).*/,
    "($1) $2-$3",
  );
}

export function formatCepInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  return digits.replace(/^(\d{5})(\d{0,3}).*/, "$1-$2");
}