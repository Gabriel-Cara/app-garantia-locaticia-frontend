import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  applicationStatusLabels,
} from "@/lib/status";

import type { RentalApplication } from "@/types/doculoc";
import { cn } from "@/lib/utils";

function getRecommendationLabel(recommendation?: string | null) {
  if (recommendation === "RECOMMENDED" || recommendation === "recommended") {
    return "Recomendado";
  }

  if (
    recommendation === "NOT_RECOMMENDED" ||
    recommendation === "not_recommended"
  ) {
    return "Não recomendado";
  }

  return "Em análise";
}

function getAutomaticDecisionLabel(decision?: string | null) {
  if (decision === "APPROVED") return "Aprovado";
  if (decision === "REJECTED") return "Reprovado";

  return "Não definido";
}

function getContractStatusLabel(status?: string | null) {
  if (!status) return "Não gerado";

  const labels: Record<string, string> = {
    PENDING: "Pendente",
    GENERATED: "Gerado",
    FAILED: "Falhou",
  };

  return labels[status] ?? status;
}

function getSignatureStatusLabel(status?: string | null) {
  if (!status || status === "NOT_SENT") return "Não enviado";

  const labels: Record<string, string> = {
    ENVELOPE_CREATED: "Envelope criado",
    SENT: "Enviado",
    PARTIALLY_SIGNED: "Parcialmente assinado",
    SIGNED: "Assinado",
    ACTION_REQUIRED: "Ação necessária",
    REFUSED: "Recusado",
    CANCELLED: "Cancelado",
    ERROR: "Erro",
  };

  return labels[status] ?? status;
}

function getBadgeTone(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("recomendado") &&
    !normalized.includes("não")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("aprovado") ||
    normalized.includes("gerado") ||
    normalized.includes("assinado")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("não") ||
    normalized.includes("reprovado") ||
    normalized.includes("cancelado") ||
    normalized.includes("erro") ||
    normalized.includes("recusado")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    normalized.includes("pendente") ||
    normalized.includes("enviado") ||
    normalized.includes("parcialmente") ||
    normalized.includes("aguardando") ||
    normalized.includes("ação")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-50 text-stone-700";
}

function TechnicalStatusItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>

        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <Badge
        variant="outline"
        className={cn("h-7 w-fit rounded-full px-3", getBadgeTone(value))}
      >
        {value}
      </Badge>
    </div>
  );
}

export function TechnicalStatusAccordion({
  application,
}: {
  application: RentalApplication;
}) {
  const oragoLabel = getRecommendationLabel(application.recommendation);
  const doculocLabel = getAutomaticDecisionLabel(application.automaticDecision);
  const applicationLabel = applicationStatusLabels[application.status];
  const contractLabel = getContractStatusLabel(application.contract?.status);
  const signatureLabel = getSignatureStatusLabel(
    application.contract?.signatureStatus,
  );

  const signedCount =
    application.contract?.signers?.filter((signer) => signer.status === "SIGNED")
      .length ?? 0;

  const totalSigners = application.contract?.signers?.length ?? 0;

  return (
    <Accordion type="single" collapsible className="rounded-3xl border bg-white/70 px-4">
      <AccordionItem value="technical-status" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          <div className="text-left">
            <p className="font-semibold text-foreground">
              Ver detalhes técnicos dos status
            </p>
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              Pré-análise, Doculoc, consulta, contrato e assinatura.
            </p>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="grid gap-3">
            <TechnicalStatusItem
              label="Pré-análise"
              value={oragoLabel}
              description="Resultado original retornado pela pré-análise."
            />

            <TechnicalStatusItem
              label="Doculoc"
              value={doculocLabel}
              description="Decisão calculada pelas regras internas da Doculoc."
            />

            <TechnicalStatusItem
              label="Consulta"
              value={applicationLabel}
              description="Status operacional da consulta dentro do sistema."
            />

            <TechnicalStatusItem
              label="Contrato"
              value={contractLabel}
              description="Situação do arquivo de contrato gerado."
            />

            <TechnicalStatusItem
              label="Assinatura"
              value={signatureLabel}
              description={
                totalSigners > 0
                  ? `${signedCount}/${totalSigners} partes assinaram.`
                  : "Contrato ainda não possui signatários vinculados."
              }
            />

            {application.contract?.signatureError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {application.contract.signatureError}
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}