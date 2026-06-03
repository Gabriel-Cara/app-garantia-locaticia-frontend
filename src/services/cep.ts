import { onlyDigits } from "@/lib/format";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export type CepAddress = {
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function fetchAddressByCep(cep: string): Promise<CepAddress> {
  const cleanCep = onlyDigits(cep);

  if (cleanCep.length !== 8) {
    throw new Error("CEP deve conter 8 dígitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    street: data.logradouro ?? "",
    complement: data.complemento ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}