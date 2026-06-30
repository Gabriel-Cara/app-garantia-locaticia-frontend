import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  PenLine,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractSignatureStatus } from "@/services/contracts";
import type { Contract, ContractSigner } from "@/types/doculoc";
import { formatDate } from "@/lib/format";

type ContractSignaturePanelProps = {
  contract: Contract;
  isAdmin?: boolean;
};

const signatureStatusLabel: Record<string, string> = {
  NOT_SENT: "Não enviado",
  ENVELOPE_CREATED: "Envelope criado",
  SENT: "Enviado para assinatura",
  PARTIALLY_SIGNED: "Parcialmente assinado",
  SIGNED: "Assinado",
  REFUSED: "Recusado",
  CANCELLED: "Cancelado",
  ERROR: "Erro",
};

const signerRoleLabel: Record<string, string> = {
  TENANT: "Locatário",
  REAL_ESTATE: "Imobiliária",
  DOCULOC: "Doculoc",
};

const signerStatusLabel: Record<string, string> = {
  PENDING: "Pendente",
  SENT: "Enviado",
  SIGNED: "Assinado",
  REFUSED: "Recusado",
  CANCELLED: "Cancelado",
  ERROR: "Erro",
};

function SignatureStatusIcon({ status }: { status?: string | null }) {
  if (status === "SIGNED") {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }

  if (status === "REFUSED" || status === "CANCELLED" || status === "ERROR") {
    return <XCircle className="size-4 text-rose-600" />;
  }

  if (status === "PARTIALLY_SIGNED" || status === "SENT") {
    return <Clock3 className="size-4 text-amber-600" />;
  }

  return <PenLine className="size-4 text-muted-foreground" />;
}

function SignerRow({ signer }: { signer: ContractSigner }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-stone-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-foreground">{signer.name}</p>
        <p className="text-sm text-muted-foreground">{signer.email}</p>
        <p className="text-xs text-muted-foreground">
          {signerRoleLabel[signer.role] ?? signer.role}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <SignatureStatusIcon status={signer.status} />
        <span>{signerStatusLabel[signer.status] ?? signer.status}</span>
      </div>
    </div>
  );
}

export function ContractSignaturePanel({
  contract,
}: ContractSignaturePanelProps) {
  const signatureQuery = useQuery({
    queryKey: ["contract-signature", contract.id],
    queryFn: () => getContractSignatureStatus(contract.id),
    enabled: Boolean(contract.id) && contract.signatureStatus !== "NOT_SENT",
    refetchInterval:
      contract.signatureStatus &&
      ["SENT", "PARTIALLY_SIGNED", "ENVELOPE_CREATED"].includes(
        contract.signatureStatus,
      )
        ? 15000
        : false,
  });

  const currentContract = signatureQuery.data?.contract ?? contract;
  const signers = signatureQuery.data?.signers ?? contract.signers ?? [];

  const signatureStatus = currentContract.signatureStatus ?? "NOT_SENT";

  return (
    <Card className="bg-white/85 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <PenLine className="size-5 text-primary" />
            Assinatura eletrônica
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-stone-50/70 p-3 text-sm">
          <SignatureStatusIcon status={signatureStatus} />
          <span className="font-medium">
            {signatureStatusLabel[signatureStatus] ?? signatureStatus}
          </span>
        </div>

        {currentContract.signatureError ? (
          <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{currentContract.signatureError}</span>
          </div>
        ) : null}

        {currentContract.sentToSignatureAt ? (
          <p className="text-sm text-muted-foreground">
            Enviado em {formatDate(currentContract.sentToSignatureAt)}
          </p>
        ) : null}

        {currentContract.signedAt ? (
          <p className="text-sm text-muted-foreground">
            Assinado em {formatDate(currentContract.signedAt)}
          </p>
        ) : null}

        {signers.length > 0 ? (
          <div className="grid gap-3">
            {signers.map((signer) => (
              <SignerRow key={signer.id} signer={signer} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Os signatários aparecerão aqui após o envio para assinatura.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
