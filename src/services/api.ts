import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

type ApiErrorResponse = {
  error?: boolean;
  message?: string;
  code?: number;
};

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message ?? error.message;
  }

  if (error instanceof Error) return error.message;

  return "Não foi possível concluir a solicitação.";
}