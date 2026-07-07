// Icons
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Home,
  Loader2,
  MessageSquareWarning,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

// Libs
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractSignaturePanel } from "../components/contract-signature-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminDecisionDialog } from "../components/admin-decision-dialog";
import { RentalValuesDialog } from "../components/rental-values-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ApplicationStatusBadge,
  RecommendationBadge,
} from "../components/application-status-badge";
import {
  EmptyState,
  PageHeader,
  PageShell,
} from "@/app/modules/_components/page-shell";

// Utils
import {
  formatCurrency,
  formatDate,
  formatDocument,
  normalizeReasons,
} from "@/lib/format";
import {
  applicationStatusDescriptions,
  applicationStatusLabels,
} from "@/lib/status";

// Services
import { DeleteApplicationDialog } from "../components/delete-application-dialog";
import {
  downloadContract,
  generateContract,
  sendContractToSignature,
} from "@/services/contracts";
import { getApiErrorMessage } from "@/services/api";
import {
  getRentalApplication,
  deleteRentalApplication,
} from "@/services/rental-applications";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 wrap-break-word font-medium text-foreground">
        {value || "-"}
      </p>
    </div>
  );
}

export function ApplicationDetailPage({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const basePath = isAdmin ? "/admin" : "/real_estate";

  const { data: application, isLoading } = useQuery({
    queryKey: ["rental-application", applicationId],
    queryFn: () => getRentalApplication(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateContract(applicationId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
      toast.success("Contrato gerado com sucesso.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (applicationId: string) =>
      deleteRentalApplication(applicationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });

      toast.success("Consulta excluída com sucesso.");

      navigate(`${basePath}/consultas`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const sendSignatureMutation = useMutation({
    mutationFn: (contractId: string) => sendContractToSignature(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });

      toast.success("Contrato enviado para assinatura.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  async function handleDownload() {
    if (!application?.contract?.id) return;

    try {
      await downloadContract(
        application.contract.id,
        application.contract.fileName ?? undefined,
      );
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-3xl border bg-white/70"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!application) {
    return (
      <PageShell>
        <EmptyState
          icon={<FileText className="size-7" />}
          title="Consulta não encontrada"
          description="Verifique se o identificador está correto ou retorne para a lista de consultas."
          action={
            <Button onClick={() => navigate(`${basePath}/consultas`)}>
              Voltar para consultas
            </Button>
          }
        />
      </PageShell>
    );
  }

  const reasons = normalizeReasons(application.decisionReasons);
  const canContest = !isAdmin && application.status === "REJECTED";
  const canFillContract =
    !isAdmin && application.status === "WAITING_CONTRACT_DATA";
  const canGenerateContract =
    isAdmin && application.status === "WAITING_ADMIN_CONTRACT";
  const canEditRentalValues =
    isAdmin && application.status === "WAITING_ADMIN_CONTRACT";
  const canAdminDecide =
    isAdmin &&
    ["REJECTED", "CONTESTED", "CONSULTED", "ADMIN_REJECTED"].includes(
      application.status,
    );
  const canDownload =
    application.status === "CONTRACT_GENERATED" &&
    application.contract?.id &&
    isAdmin;

  const signatureStatus = application.contract?.signatureStatus ?? "NOT_SENT";

  const canSendSignature =
    isAdmin &&
    application.contract?.id &&
    application.contract?.status === "GENERATED" &&
    ["NOT_SENT"].includes(signatureStatus);

  const requesterName =
    application.requester?.realEstateProfile?.name ??
    application.requester?.name ??
    "Imobiliária";

  return (
    <PageShell>
      <Helmet title="Detalhes da Consulta" />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`${basePath}/consultas`}>
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
        <PageHeader
          eyebrow={isAdmin ? "Detalhe administrativo" : "Detalhe da consulta"}
          title={formatDocument(application.document, application.documentType)}
          description={applicationStatusDescriptions[application.status]}
          action={
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              {canFillContract ? (
                <Button
                  asChild
                  className="beam-button shadow-lg shadow-primary/15"
                >
                  <Link to={`${basePath}/consultas/${application.id}/contrato`}>
                    <Home className="size-4" />
                    Preencher contrato
                  </Link>
                </Button>
              ) : null}
              {canContest ? (
                <Button asChild variant="outline">
                  <Link
                    to={`${basePath}/consultas/${application.id}/contestar`}
                  >
                    <MessageSquareWarning className="size-4" />
                    Contestar decisão
                  </Link>
                </Button>
              ) : null}
              {canAdminDecide ? (
                <>
                  <AdminDecisionDialog
                    applicationId={application.id}
                    decision="APPROVED"
                  />
                  <AdminDecisionDialog
                    applicationId={application.id}
                    decision="REJECTED"
                  />
                </>
              ) : null}
              {canEditRentalValues ? (
                <RentalValuesDialog application={application} />
              ) : null}
              {canGenerateContract ? (
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Gerar contrato
                </Button>
              ) : null}
              {canDownload ? (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="size-4" />
                  Baixar contrato
                </Button>
              ) : null}
              {canSendSignature ? (
                <Button
                  onClick={() =>
                    sendSignatureMutation.mutate(application.contract!.id)
                  }
                  disabled={sendSignatureMutation.isPending}
                  className="beam-button shadow-lg shadow-primary/15"
                >
                  {sendSignatureMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Enviar para assinatura
                </Button>
              ) : null}
              <DeleteApplicationDialog
                application={application}
                isDeleting={deleteMutation.isPending}
                onConfirm={(application) =>
                  deleteMutation.mutate(application.id)
                }
              />
            </div>
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="flashlight-card bg-white/85 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="size-5 text-primary" />
                Resultado da análise
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <RecommendationBadge
                  recommendation={application.recommendation}
                />
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailItem
                label="Aluguel"
                value={formatCurrency(application.rentValue)}
              />
              <DetailItem
                label="Condomínio"
                value={formatCurrency(application.condominiumValue)}
              />
              <DetailItem
                label="IPTU"
                value={formatCurrency(application.feesValue)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailItem
                label="Pacote solicitado"
                value={formatCurrency(application.requestedExpense)}
              />
              <DetailItem
                label="Capacidade mínima"
                value={formatCurrency(application.housingExpenseMin)}
              />
              <DetailItem
                label="Capacidade máxima"
                value={formatCurrency(application.housingExpenseMax)}
              />
            </div>
            <Separator />
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Motivos da decisão
              </h3>
              {reasons.length > 0 ? (
                <ul className="grid gap-2">
                  {reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex gap-3 rounded-2xl bg-stone-50 p-3 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum motivo detalhado retornado pela análise.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5 text-primary" />
                Linha do tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem
                label="Status atual"
                value={applicationStatusLabels[application.status]}
              />
              <DetailItem
                label="Criada em"
                value={formatDate(application.createdAt)}
              />
              <DetailItem
                label="Atualizada em"
                value={formatDate(application.updatedAt)}
              />
              {application.adminDecisionReason ? (
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertTitle>Decisão administrativa</AlertTitle>
                  <AlertDescription>
                    {application.adminDecisionReason}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card className="bg-white/85 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  Imobiliária
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailItem label="Nome" value={requesterName} />
                <DetailItem
                  label="E-mail"
                  value={application.requester?.email}
                />
                <DetailItem
                  label="CNPJ"
                  value={formatDocument(
                    application.requester?.realEstateProfile?.cnpj ?? undefined,
                    "CNPJ",
                  )}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Dados para contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-3 sm:col-span-2">
              {(application.tenants && application.tenants.length > 0
                ? application.tenants
                : [
                    {
                      id: "legacy-main-tenant",
                      order: 1,
                      name: application.tenantName ?? "-",
                      document:
                        application.tenantDocument ?? application.document,
                      email: application.tenantEmail ?? "-",
                      phone: application.tenantPhone ?? "-",
                    },
                  ]
              ).map((tenant) => (
                <div
                  key={tenant.id}
                  className="grid gap-3 rounded-2xl border bg-stone-50/70 p-3 sm:grid-cols-2"
                >
                  <DetailItem
                    label={`Locatário ${tenant.order}`}
                    value={tenant.name}
                  />
                  <DetailItem
                    label="Documento"
                    value={formatDocument(tenant.document)}
                  />
                  <DetailItem label="E-mail" value={tenant.email} />
                  <DetailItem label="Telefone" value={tenant.phone} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {application.contract ? (
          <ContractSignaturePanel
            contract={application.contract}
            isAdmin={isAdmin}
          />
        ) : null}

        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="size-5 text-primary" />
              Contestações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.contests?.length ? (
              <div className="space-y-3">
                {application.contests.map((contest) => (
                  <div
                    key={contest.id}
                    className="rounded-2xl border bg-stone-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm">{contest.status}</strong>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(contest.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 wrap-break-word text-sm text-muted-foreground">
                      {contest.reason}
                    </p>
                    {contest.adminNote ? (
                      <p className="mt-3 wrap-break-word rounded-xl bg-white p-3 text-sm">
                        Admin: {contest.adminNote}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma contestação enviada para esta consulta.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
