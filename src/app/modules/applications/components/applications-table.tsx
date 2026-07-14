// React
import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";

// Icons
import { Eye, Download, FileText, Building2, Trash2 } from "lucide-react";

// Libs
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

// Components
import { FlowStatusBadge, FlowStatusSummary } from "./flow-status-badge";
import { DeleteApplicationDialog } from "./delete-application-dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Utils
import { formatCurrency, formatDate, formatDocument } from "@/lib/format";
import type { RentalApplication } from "@/types/doculoc";
import { cn } from "@/lib/utils";

interface IApplicationMobileCard {
  application: RentalApplication;
  basePath: string;
  isAdmin: boolean;
  tableMode?: ApplicationsTableMode;
  onDownloadContract?: (application: RentalApplication) => void;
  onDeleteApplication?: (application: RentalApplication) => void;
  deletingApplicationId?: string | null;
}

interface IApplicationsTable {
  applications: RentalApplication[];
  basePath: string;
  isAdmin?: boolean;
  tableMode?: ApplicationsTableMode;
  onDownloadContract?: (application: RentalApplication) => void;
  onDeleteApplication?: (application: RentalApplication) => void;
  deletingApplicationId?: string | null;
}

type ApplicationsTableMode = "default" | "contracts";

function MobileInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-stone-50/80 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 wrap-break-word text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

function getApplicationSubjectName(application: RentalApplication) {
  return application.tenantName?.trim() || "Nome não informado";
}

function getSignatureProgress(application: RentalApplication) {
  const contract = application.contract;
  const signers = contract?.signers ?? [];
  const totalSigners = signers.length;
  const signedSigners = signers.filter(
    (signer) => signer.status === "SIGNED",
  ).length;

  if (contract?.signatureStatus === "ACTION_REQUIRED") {
    const value =
      totalSigners > 0 ? Math.round((signedSigners / totalSigners) * 100) : 0;

    return {
      value,
      signedSigners,
      totalSigners,
      label: "Ação necessária",
      description:
        totalSigners > 0
          ? `${signedSigners}/${totalSigners} assinaram`
          : "Verifique a assinatura",
    };
  }

  if (contract?.signatureStatus === "SIGNED") {
    return {
      value: 100,
      signedSigners: totalSigners,
      totalSigners,
      label: "100% concluído",
      description:
        totalSigners > 0
          ? `${totalSigners}/${totalSigners} assinaram`
          : "Contrato assinado",
    };
  }

  if (
    !contract ||
    contract.signatureStatus === "NOT_SENT" ||
    totalSigners === 0
  ) {
    return {
      value: 0,
      signedSigners: 0,
      totalSigners,
      label: "Não enviado",
      description: "Aguardando envio para assinatura",
    };
  }

  const value = Math.round((signedSigners / totalSigners) * 100);

  return {
    value,
    signedSigners,
    totalSigners,
    label: `${value}% concluído`,
    description: `${signedSigners}/${totalSigners} assinaram`,
  };
}

function getSignatureProgressColor(value: number, status?: string | null) {
  if (
    status === "ACTION_REQUIRED" ||
    status === "ERROR" ||
    status === "REFUSED"
  ) {
    return "bg-rose-500";
  }

  if (value >= 100) {
    return "bg-emerald-500";
  }

  if (value >= 75) {
    return "bg-blue-500";
  }

  if (value >= 33) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

function ContractSignatureProgress({
  application,
}: {
  application: RentalApplication;
}) {
  const progress = getSignatureProgress(application);

  return (
    <div className="min-w-44 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          {progress.label}
        </span>
        {progress.totalSigners > 0 ? (
          <span className="text-xs text-muted-foreground">
            {progress.signedSigners}/{progress.totalSigners}
          </span>
        ) : null}
      </div>

      <Progress
        value={progress.value}
        className="h-2 bg-zinc-200"
        indicatorClassName={getSignatureProgressColor(
          progress.value,
          application.contract?.signatureStatus,
        )}
      />

      <p className="text-xs text-muted-foreground">{progress.description}</p>
    </div>
  );
}

function FlowStatusWithSignatureProgress({
  application,
}: {
  application: RentalApplication;
}) {
  const signatureStatus = application.contract?.signatureStatus;

  const shouldShowSignatureProgress = [
    "ENVELOPE_CREATED",
    "SENT",
    "PARTIALLY_SIGNED",
    "SIGNED",
    "ACTION_REQUIRED",
    "ERROR",
    "REFUSED",
    "CANCELLED",
  ].includes(signatureStatus ?? "");

  return (
    <div className="min-w-48 space-y-2">
      <FlowStatusBadge application={application} />

      {shouldShowSignatureProgress ? (
        <ContractSignatureProgress application={application} />
      ) : null}
    </div>
  );
}

function ApplicationMobileCard({
  application,
  basePath,
  isAdmin,
  tableMode = "default",
  onDownloadContract,
  onDeleteApplication,
  deletingApplicationId,
}: IApplicationMobileCard) {
  const hasContract =
    application.status === "CONTRACT_GENERATED" && application.contract?.id;
  const requester = application.requester;
  const requesterName =
    requester?.realEstateProfile?.name ?? requester?.name ?? "-";

  return (
    <article className="rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 rounded-2xl border bg-primary/5 p-2 text-primary">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="wrap-break-word text-base font-semibold text-foreground">
            {formatDocument(application.document, application.documentType)}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {getApplicationSubjectName(application)}
          </p>
          {tableMode === "contracts" ? null : (
            <div className="mt-2">
              <FlowStatusBadge application={application} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {isAdmin ? (
          <MobileInfo
            label="Imobiliária"
            value={
              <span className="block min-w-0">
                <span className="block truncate">{requesterName}</span>
                <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                  {requester?.email ?? "Sem e-mail"}
                </span>
              </span>
            }
          />
        ) : null}
        <MobileInfo
          label="Pacote"
          value={formatCurrency(application.requestedExpense)}
        />
        {tableMode === "contracts" ? (
          <MobileInfo
            label="Status atual"
            value={
              <FlowStatusWithSignatureProgress application={application} />
            }
          />
        ) : null}
        {tableMode !== "contracts" ? (
          <>
            <MobileInfo
              label="Criada em"
              value={formatDate(application.createdAt)}
            />
            <MobileInfo label="Tipo" value={application.documentType} />
          </>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:flex sm:justify-end">
        {hasContract && onDownloadContract ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onDownloadContract(application)}
          >
            <Download className="size-4" />
            Baixar contrato
          </Button>
        ) : null}
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to={`${basePath}/consultas/${application.id}`}>
            <Eye className="size-4" />
            Ver detalhes
          </Link>
        </Button>
        {onDeleteApplication ? (
          <DeleteApplicationDialog
            application={application}
            isDeleting={deletingApplicationId === application.id}
            onConfirm={onDeleteApplication}
            trigger={
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Excluir
              </Button>
            }
          />
        ) : null}
      </div>
    </article>
  );
}

export function ApplicationsTable({
  applications,
  basePath,
  isAdmin = false,
  tableMode = "default",
  onDownloadContract,
  onDeleteApplication,
  deletingApplicationId,
}: IApplicationsTable) {
  const columns = useMemo<ColumnDef<RentalApplication>[]>(() => {
    if (tableMode === "contracts") {
      const contractColumns: ColumnDef<RentalApplication>[] = [
        {
          accessorKey: "document",
          header: "Consulta",
          cell: ({ row }) => {
            const application = row.original;

            return (
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-2xl border bg-primary/5 p-2 text-primary">
                  <FileText className="size-4" />
                </div>

                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">
                    {formatDocument(
                      application.document,
                      application.documentType,
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {getApplicationSubjectName(application)}
                  </div>
                </div>
              </div>
            );
          },
        },
        {
          id: "requester",
          header: "Imobiliária",
          cell: ({ row }) => {
            const requester = row.original.requester;
            const profileName =
              requester?.realEstateProfile?.name ?? requester?.name ?? "-";

            return (
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-2xl bg-stone-100 p-2 text-stone-600">
                  <Building2 className="size-4" />
                </div>

                <div className="min-w-0 max-w-56">
                  <div className="truncate font-medium text-foreground">
                    {profileName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {requester?.email ?? "Sem e-mail"}
                  </div>
                </div>
              </div>
            );
          },
        },
        {
          accessorKey: "requestedExpense",
          header: "Pacote",
          cell: ({ row }) => (
            <div>
              <div className="font-medium">
                {formatCurrency(row.original.requestedExpense)}
              </div>
              <div className="text-xs text-muted-foreground">
                Aluguel + condomínio + IPTU
              </div>
            </div>
          ),
        },
        {
          id: "flowStatus",
          header: "Status atual",
          cell: ({ row }) => (
            <FlowStatusWithSignatureProgress application={row.original} />
          ),
        },
        {
          id: "actions",
          header: "Ações",
          cell: ({ row }) => {
            const application = row.original;
            const hasContract = Boolean(application.contract?.id);

            return (
              <div className="flex justify-end gap-2">
                {hasContract && onDownloadContract ? (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    title="Baixar contrato"
                    onClick={() => onDownloadContract(application)}
                  >
                    <Download className="size-4" />
                  </Button>
                ) : null}

                <Button asChild variant="outline" size="sm">
                  <Link to={`${basePath}/consultas/${application.id}`}>
                    <Eye className="size-4" />
                    Ver
                  </Link>
                </Button>

                {onDeleteApplication ? (
                  <DeleteApplicationDialog
                    application={application}
                    isDeleting={deletingApplicationId === application.id}
                    onConfirm={onDeleteApplication}
                    trigger={
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        title="Excluir consulta"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    }
                  />
                ) : null}
              </div>
            );
          },
        },
      ];

      return contractColumns;
    }

    const baseColumns: ColumnDef<RentalApplication>[] = [
      {
        accessorKey: "document",
        header: "Consulta",
        cell: ({ row }) => {
          const application = row.original;

          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-2xl border bg-primary/5 p-2 text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {formatDocument(
                    application.document,
                    application.documentType,
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {getApplicationSubjectName(application)}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "requestedExpense",
        header: "Pacote",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {formatCurrency(row.original.requestedExpense)}
            </div>
            <div className="text-xs text-muted-foreground">
              Aluguel + condomínio + IPTU
            </div>
          </div>
        ),
      },
      {
        id: "flowStatus",
        header: "Status atual",
        cell: ({ row }) => <FlowStatusSummary application={row.original} />,
      },
      {
        accessorKey: "createdAt",
        header: "Criada em",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const application = row.original;
          const hasContract =
            application.status === "CONTRACT_GENERATED" &&
            application.contract?.id;

          return (
            <div className="flex justify-end gap-2">
              {hasContract && onDownloadContract && isAdmin ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="Baixar contrato"
                  onClick={() => onDownloadContract(application)}
                >
                  <Download className="size-4" />
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link to={`${basePath}/consultas/${application.id}`}>
                  <Eye className="size-4" />
                  Ver
                </Link>
              </Button>
              {onDeleteApplication ? (
                <DeleteApplicationDialog
                  application={application}
                  isDeleting={deletingApplicationId === application.id}
                  onConfirm={onDeleteApplication}
                  trigger={
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      title="Excluir consulta"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              ) : null}
            </div>
          );
        },
      },
    ];

    if (!isAdmin) return baseColumns;

    baseColumns.splice(1, 0, {
      id: "requester",
      header: "Imobiliária",
      cell: ({ row }) => {
        const requester = row.original.requester;
        const profileName =
          requester?.realEstateProfile?.name ?? requester?.name ?? "-";

        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-2xl bg-stone-100 p-2 text-stone-600">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 max-w-56">
              <div className="truncate font-medium text-foreground">
                {profileName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {requester?.email ?? "Sem e-mail"}
              </div>
            </div>
          </div>
        );
      },
    });

    return baseColumns;
  }, [
    basePath,
    isAdmin,
    tableMode,
    onDownloadContract,
    onDeleteApplication,
    deletingApplicationId,
  ]);

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {applications.map((application) => (
          <ApplicationMobileCard
            key={application.id}
            application={application}
            basePath={basePath}
            isAdmin={isAdmin}
            tableMode={tableMode}
            onDownloadContract={onDownloadContract}
            onDeleteApplication={onDeleteApplication}
            deletingApplicationId={deletingApplicationId}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border bg-white/85 shadow-sm backdrop-blur lg:block">
        <Table
          className={cn(
            "min-w-190",
            isAdmin && "min-w-245",
            tableMode === "contracts" && "min-w-230",
          )}
        >
          <TableHeader className="bg-stone-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="bg-white/70">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
