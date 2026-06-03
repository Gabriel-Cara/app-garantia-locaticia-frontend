import { api } from "./api";
import { onlyDigits } from "@/lib/format";
import type {
  AdminDecision,
  ContractDataBody,
  CreateApplicationBody,
  CreateApplicationResponse,
  ListApplicationsParams,
  ListApplicationsResponse,
  RentalApplication,
} from "@/types/doculoc";

function buildParams(params?: ListApplicationsParams) {
  const cleanParams = new URLSearchParams();

  if (params?.status && params.status !== "ALL") {
    cleanParams.set("status", params.status);
  }

  if (params?.document) {
    cleanParams.set("document", onlyDigits(params.document));
  }

  if (params?.requesterId) {
    cleanParams.set("requesterId", params.requesterId);
  }

  if (params?.page) cleanParams.set("page", String(params.page));
  if (params?.perPage) cleanParams.set("perPage", String(params.perPage));

  return cleanParams;
}

export async function listRentalApplications(params?: ListApplicationsParams) {
  const searchParams = buildParams(params);
  const response = await api.get<ListApplicationsResponse>("/rental-applications", {
    params: Object.fromEntries(searchParams),
  });

  return response.data;
}

export async function getRentalApplication(applicationId: string) {
  const response = await api.get<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}`,
  );

  return response.data.application;
}

export async function createCpfApplication(body: CreateApplicationBody) {
  const response = await api.post<CreateApplicationResponse>("/rental-applications/cpf", {
    cpf: onlyDigits(body.document),
    rentValue: body.rentValue,
    condominiumValue: body.condominiumValue,
    feesValue: body.feesValue,
  });

  return response.data;
}

export async function createCnpjApplication(body: CreateApplicationBody) {
  const response = await api.post<CreateApplicationResponse>("/rental-applications/cnpj", {
    cnpj: onlyDigits(body.document),
    rentValue: body.rentValue,
    condominiumValue: body.condominiumValue,
    feesValue: body.feesValue,
  });

  return response.data;
}

export async function fillContractData(applicationId: string, body: ContractDataBody) {
  const response = await api.patch<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}/contract-data`,
    {
      ...body,
      tenantDocument: onlyDigits(body.tenantDocument),
      tenantPhone: onlyDigits(body.tenantPhone),
      propertyZipCode: onlyDigits(body.propertyZipCode),
    },
  );

  return response.data.application;
}

export async function contestRentalApplication(applicationId: string, reason: string) {
  const response = await api.post(`/rental-applications/${applicationId}/contest`, {
    reason,
  });

  return response.data;
}

export async function decideRentalApplication(
  applicationId: string,
  decision: AdminDecision,
  reason: string,
) {
  const response = await api.patch<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}/admin-decision`,
    { decision, reason },
  );

  return response.data.application;
}
