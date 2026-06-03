import { api } from "./api";
import type { Contract } from "@/types/doculoc";

export async function generateContract(applicationId: string) {
  const response = await api.post<{ contract: Contract }>(
    `/contracts/applications/${applicationId}/generate`,
  );

  return response.data.contract;
}

export async function downloadContract(contractId: string, fallbackFileName = "contrato-doculoc.docx") {
  const response = await api.get<Blob>(`/contracts/${contractId}/download`, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const fileNameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  const fileName = fileNameMatch?.[1] ?? fallbackFileName;
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
