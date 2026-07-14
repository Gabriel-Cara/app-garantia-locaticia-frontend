import { api } from "./api";
import { onlyDigits } from "@/lib/format";
import type {
  AdminDecision,
  ConsultStatusResponse,
  ContractDataBody,
  CreateApplicationBody,
  CreateApplicationInitialResponse,
  CreateApplicationResponse,
  ListApplicationsParams,
  ListApplicationsResponse,
  RentalApplication,
  UpdateRentalValuesBody,
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

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isPendingConsultResponse(data: unknown): data is {
  pending?: boolean;
  status?: string;
  consultLockId: string;
} {
  if (!data || typeof data !== "object") return false;

  const value = data as {
    pending?: boolean;
    status?: string;
    consultLockId?: unknown;
  };

  return (
    typeof value.consultLockId === "string" &&
    (value.pending === true || value.status === "PROCESSING")
  );
}

function isCreateApplicationResponse(
  data: unknown,
): data is CreateApplicationResponse {
  if (!data || typeof data !== "object") return false;

  const value = data as {
    application?: unknown;
  };

  return !!value.application && typeof value.application === "object";
}

export async function getConsultStatus(consultLockId: string) {
  const response = await api.get<ConsultStatusResponse>(
    `/rental-applications/consults/${consultLockId}/status`,
  );

  return response.data;
}

async function waitForConsultResult(
  consultLockId: string,
): Promise<CreateApplicationResponse> {
  const maxAttempts = 72;
  const delayMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await getConsultStatus(consultLockId);

    if (status.status === "COMPLETED") {
      return {
        application: status.application,
        decision: status.decision ?? {
          status: String(status.application.automaticDecision ?? "unknown"),
          recommendation: String(
            status.application.recommendation ?? "unknown",
          ),
        },
      };
    }

    if (status.status === "FAILED") {
      throw new Error(status.message || "A pré-análise falhou.");
    }

    await sleep(delayMs);
  }

  throw new Error(
    "A análise ainda está em processamento. Tente atualizar a lista de consultas em alguns minutos.",
  );
}

async function resolveCreateApplicationResponse(
  data: CreateApplicationInitialResponse,
): Promise<CreateApplicationResponse> {
  if (isCreateApplicationResponse(data)) {
    return data;
  }

  if (isPendingConsultResponse(data)) {
    return waitForConsultResult(data.consultLockId);
  }

  throw new Error(
    "A API retornou uma resposta inesperada ao criar a consulta.",
  );
}

export async function listRentalApplications(params?: ListApplicationsParams) {
  const searchParams = buildParams(params);
  const response = await api.get<ListApplicationsResponse>(
    "/rental-applications",
    {
      params: Object.fromEntries(searchParams),
    },
  );

  return response.data;
}

export async function getRentalApplication(applicationId: string) {
  const response = await api.get<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}`,
  );

  return response.data.application;
}

export async function createCpfApplication(body: CreateApplicationBody) {
  const response = await api.post<CreateApplicationInitialResponse>(
    "/rental-applications/cpf",
    {
      cpf: onlyDigits(body.document),
      rentValue: body.rentValue,
      condominiumValue: body.condominiumValue,
      feesValue: body.feesValue,
    },
  );

  return resolveCreateApplicationResponse(response.data);
}

export async function createCnpjApplication(body: CreateApplicationBody) {
  const response = await api.post<CreateApplicationInitialResponse>(
    "/rental-applications/cnpj",
    {
      cnpj: onlyDigits(body.document),
      rentValue: body.rentValue,
      condominiumValue: body.condominiumValue,
      feesValue: body.feesValue,
    },
  );

  return resolveCreateApplicationResponse(response.data);
}

export async function fillContractData(
  applicationId: string,
  body: ContractDataBody,
) {
  const response = await api.patch<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}/contract-data`,
    {
      ...body,
      tenants: body.tenants.map((tenant) => ({
        ...tenant,
        document: onlyDigits(tenant.document),
        phone: onlyDigits(tenant.phone),
      })),
      propertyZipCode: onlyDigits(body.propertyZipCode),
    },
  );

  return response.data.application;
}

export async function contestRentalApplication(
  applicationId: string,
  reason: string,
) {
  const response = await api.post(
    `/rental-applications/${applicationId}/contest`,
    {
      reason,
    },
  );

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

export async function updateRentalValues(
  applicationId: string,
  body: UpdateRentalValuesBody,
) {
  const response = await api.patch<{ application: RentalApplication }>(
    `/rental-applications/${applicationId}/rental-values`,
    body,
  );

  return response.data.application;
}

export async function deleteRentalApplication(applicationId: string) {
  await api.delete(`/rental-applications/${applicationId}`);
}
