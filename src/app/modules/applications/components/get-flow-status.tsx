import type { RentalApplication } from "@/types/doculoc";

export type FlowStatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type FlowStatusStep =
  | "analysis"
  | "contest"
  | "contract-data"
  | "contract-generation"
  | "signature"
  | "finished"
  | "cancelled";

export type FlowStatus = {
  label: string;
  description: string;
  tone: FlowStatusTone;
  step: FlowStatusStep;
};

export function getFlowStatus(application: RentalApplication): FlowStatus {
  const contract = application.contract;
  const signatureStatus = contract?.signatureStatus;

  if (signatureStatus === "CANCELLED") {
    return {
      label: "Assinatura cancelada",
      description:
        contract?.signatureError ??
        "O processo de assinatura foi cancelado na Clicksign.",
      tone: "danger",
      step: "cancelled",
    };
  }

  if (
    signatureStatus === "ACTION_REQUIRED" ||
    signatureStatus === "ERROR" ||
    signatureStatus === "REFUSED"
  ) {
    return {
      label: "Ação necessária na assinatura",
      description:
        contract?.signatureError ??
        "Houve um problema no processo de assinatura.",
      tone: "danger",
      step: "signature",
    };
  }

  if (signatureStatus === "SIGNED") {
    return {
      label: "Contrato assinado",
      description: "Todas as partes assinaram o contrato.",
      tone: "success",
      step: "finished",
    };
  }

  if (signatureStatus === "PARTIALLY_SIGNED") {
    const signers = contract?.signers ?? [];
    const total = signers.length;
    const signed = signers.filter((signer) => signer.status === "SIGNED").length;

    return {
      label: "Aguardando assinaturas",
      description:
        total > 0
          ? `${signed}/${total} partes assinaram o contrato.`
          : "Contrato enviado para assinatura.",
      tone: "info",
      step: "signature",
    };
  }

  if (signatureStatus === "SENT" || signatureStatus === "ENVELOPE_CREATED") {
    return {
      label: "Aguardando assinaturas",
      description: "Contrato enviado para assinatura.",
      tone: "info",
      step: "signature",
    };
  }

  if (
    application.status === "CONTRACT_GENERATED" ||
    contract?.status === "GENERATED"
  ) {
    return {
      label: "Pronto para assinatura",
      description: "Contrato gerado e disponível para envio.",
      tone: "success",
      step: "signature",
    };
  }

  if (application.status === "WAITING_ADMIN_CONTRACT") {
    return {
      label: "Aguardando geração do contrato",
      description: "Dados preenchidos. O admin precisa gerar o contrato.",
      tone: "warning",
      step: "contract-generation",
    };
  }

  if (application.status === "WAITING_CONTRACT_DATA") {
    return {
      label: "Preencher dados do contrato",
      description: "A imobiliária precisa completar os dados do contrato.",
      tone: "warning",
      step: "contract-data",
    };
  }

  if (application.status === "CONTESTED") {
    return {
      label: "Em contestação",
      description: "A imobiliária contestou a análise. Aguardando decisão do admin.",
      tone: "warning",
      step: "contest",
    };
  }

  if (application.status === "ADMIN_REJECTED") {
    return {
      label: "Reprovado pelo admin",
      description: "A consulta foi reprovada manualmente pelo administrador.",
      tone: "danger",
      step: "finished",
    };
  }

  if (application.status === "REJECTED") {
    return {
      label: "Não recomendado",
      description: "Consulta não aprovada. A imobiliária pode contestar.",
      tone: "danger",
      step: "analysis",
    };
  }

  if (application.status === "CANCELLED") {
    return {
      label: "Consulta cancelada",
      description: "Esta consulta foi cancelada.",
      tone: "danger",
      step: "cancelled",
    };
  }

  if (application.status === "CONSULTED") {
    if (
      application.recommendation === "RECOMMENDED" ||
      application.recommendation === "recommended"
    ) {
      return {
        label: "Aprovado para contrato",
        description: "Consulta recomendada e liberada para avanço.",
        tone: "success",
        step: "analysis",
      };
    }

    if (
      application.recommendation === "NOT_RECOMMENDED" ||
      application.recommendation === "not_recommended"
    ) {
      return {
        label: "Não recomendado",
        description: "Consulta não recomendada. Pode ser contestada.",
        tone: "danger",
        step: "analysis",
      };
    }

    return {
      label: "Em revisão",
      description: "Consulta concluída e aguardando decisão.",
      tone: "info",
      step: "analysis",
    };
  }

  return {
    label: "Em análise",
    description: "Consulta em processamento.",
    tone: "neutral",
    step: "analysis",
  };
}