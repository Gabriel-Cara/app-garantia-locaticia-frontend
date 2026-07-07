// React Query
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Icons
import {
  Ban,
  CheckCircle2,
  Clock3,
  PenLine,
  RotateCcw,
  Send,
  TriangleAlert,
  Wrench,
  XCircle,
} from "lucide-react";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Services
import {
  cancelContractSignature,
  getContractSignatureStatus,
  reopenContractDataFromSignature,
  resendContractSignatureNotification,
  restartContractSignature,
} from "@/services/contracts";
import { getApiErrorMessage } from "@/services/api";

// Types
import type { Contract, ContractSigner } from "@/types/doculoc";

// Libs
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

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
  ACTION_REQUIRED: "Ação necessária",
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
  ACTION_REQUIRED: "Ação necessária",
  AUTHENTICATION_FAILED: "Falha na autenticação/biometria",
  REFUSED: "Recusado",
  CANCELLED: "Cancelado",
  ERROR: "Erro",
};

function SignatureStatusIcon({ status }: { status?: string | null }) {
  if (status === "SIGNED") {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }

  if (
    status === "REFUSED" ||
    status === "CANCELLED" ||
    status === "ERROR" ||
    status === "ACTION_REQUIRED" ||
    status === "AUTHENTICATION_FAILED"
  ) {
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
  isAdmin = false,
}: ContractSignaturePanelProps) {
  const queryClient = useQueryClient();
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

  async function invalidateSignature() {
    await queryClient.invalidateQueries({
      queryKey: ["contract-signature", contract.id],
    });

    await queryClient.invalidateQueries({
      queryKey: ["rental-applications"],
    });
  }

  const resendMutation = useMutation({
    mutationFn: () => resendContractSignatureNotification(contract.id),
    onSuccess: async () => {
      await invalidateSignature();
      toast.success("Notificação reenviada.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelContractSignature(contract.id),
    onSuccess: async () => {
      await invalidateSignature();
      toast.success("Assinatura cancelada.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const restartMutation = useMutation({
    mutationFn: () => restartContractSignature(contract.id),
    onSuccess: async () => {
      await invalidateSignature();
      toast.success("Novo envio de assinatura criado.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const reopenDataMutation = useMutation({
    mutationFn: () => reopenContractDataFromSignature(contract.id),
    onSuccess: async () => {
      await invalidateSignature();
      toast.success("Dados do contrato reabertos para correção.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const hasActionRequired =
    signatureStatus === "ACTION_REQUIRED" ||
    signers.some((signer) =>
      ["ACTION_REQUIRED", "AUTHENTICATION_FAILED", "REFUSED", "ERROR"].includes(
        signer.status,
      ),
    );

  const canManageSignature =
    isAdmin &&
    [
      "SENT",
      "PARTIALLY_SIGNED",
      "ACTION_REQUIRED",
      "ERROR",
      "REFUSED",
      "CANCELLED",
    ].includes(signatureStatus);

  const isMutating =
    resendMutation.isPending ||
    cancelMutation.isPending ||
    restartMutation.isPending ||
    reopenDataMutation.isPending;

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

        {hasActionRequired ? (
          <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Ação necessária na assinatura</p>
              <p>
                Algum signatário teve falha, recusa ou autenticação não
                concluída. Você pode reenviar o e-mail, cancelar, refazer o
                envio ou reabrir os dados do contrato para correção.
              </p>
            </div>
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

        {canManageSignature ? (
          <div className="grid gap-2 border-t pt-4 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              disabled={isMutating}
              onClick={() => resendMutation.mutate()}
            >
              <Send className="size-4" />
              Reenviar e-mail
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isMutating}
              onClick={() => restartMutation.mutate()}
            >
              <RotateCcw className="size-4" />
              Refazer envio
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isMutating}
              onClick={() => reopenDataMutation.mutate()}
            >
              <Wrench className="size-4" />
              Corrigir dados
            </Button>

            <Button
              type="button"
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              disabled={isMutating}
              onClick={() => cancelMutation.mutate()}
            >
              <Ban className="size-4" />
              Cancelar assinatura
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
