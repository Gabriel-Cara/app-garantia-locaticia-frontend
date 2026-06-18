import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Download, FileSearch, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { listRentalApplications } from "@/services/rental-applications";
import { downloadContract } from "@/services/contracts";
import { getApiErrorMessage } from "@/services/api";
import type { RentalApplication, RentalApplicationStatus } from "@/types/doculoc";
import { statusOptions } from "@/lib/status";
import { formatDocument, formatDocumentInput, onlyDigits } from "@/lib/format";
import { ApplicationsTable } from "../components/applications-table";

function normalizeSearchText(value?: string | number | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isDocumentSearchValue(value: string) {
  return onlyDigits(value).length > 0 && !/[^\d\s./-]/.test(value);
}

function formatSearchValue(value: string) {
  return isDocumentSearchValue(value) ? formatDocumentInput(value) : value;
}

function applicationMatchesSearch(application: RentalApplication, search: string) {
  const normalizedSearch = normalizeSearchText(search.trim());
  const searchDigits = onlyDigits(search);

  if (!normalizedSearch && !searchDigits) return true;

  const searchableText = normalizeSearchText(
    [
      application.tenantName,
      application.requester?.realEstateProfile?.name,
      application.requester?.name,
      application.requester?.email,
      formatDocument(application.document, application.documentType),
      formatDocument(application.tenantDocument),
      application.document,
      application.tenantDocument,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const searchableDigits = onlyDigits(
    `${application.document ?? ""} ${application.tenantDocument ?? ""}`,
  );

  return (
    searchableText.includes(normalizedSearch) ||
    (searchDigits.length > 0 && searchableDigits.includes(searchDigits))
  );
}

export function ApplicationsPage({
  isAdmin = false,
  forcedStatus,
  title,
  description,
  eyebrow,
}: {
  isAdmin?: boolean;
  forcedStatus?: RentalApplicationStatus;
  title?: string;
  description?: string;
  eyebrow?: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RentalApplicationStatus | "ALL">(forcedStatus ?? "ALL");
  const basePath = isAdmin ? "/admin" : "/real_estate";
  const trimmedSearch = search.trim();
  const documentSearch = isDocumentSearchValue(trimmedSearch)
    ? trimmedSearch
    : undefined;

  const effectiveStatus = forcedStatus ?? status;
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["rental-applications", effectiveStatus, documentSearch, isAdmin],
    queryFn: () =>
      listRentalApplications({
        status: effectiveStatus,
        document: documentSearch,
        page: 1,
        perPage: 50,
      }),
  });

  async function handleDownload(application: RentalApplication) {
    if (!application.contract?.id) return;

    try {
      await downloadContract(application.contract.id, application.contract.fileName ?? undefined);
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const applications = useMemo(
    () =>
      (data?.applications ?? []).filter((application) =>
        applicationMatchesSearch(application, search),
      ),
    [data?.applications, search],
  );
  const totalRecords = trimmedSearch ? applications.length : (data?.meta.total ?? 0);

  return (
    <PageShell>
      <Helmet title={title ?? (isAdmin ? "Consultas" : "Minhas consultas")} />

      <PageHeader
        eyebrow={eyebrow ?? (isAdmin ? "Operação Admin" : "Carteira de consultas")}
        title={title ?? (isAdmin ? "Consultas" : "Minhas consultas")}
        description={
          description ??
          "Acompanhe o ciclo completo de análise, contestação, preenchimento de dados e geração do contrato."
        }
        action={
          !isAdmin ? (
            <Button asChild size="lg" className="beam-button shadow-lg shadow-primary/15">
              <Link to="/real_estate/nova-consulta">
                <Plus className="size-4" />
                Nova consulta
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-2xl bg-white pl-10"
              placeholder="Buscar por nome, CPF ou CNPJ"
              value={search}
              onChange={(event) =>
                setSearch(formatSearchValue(event.target.value))
              }
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {!forcedStatus ? (
              <Select value={status} onValueChange={(value) => setStatus(value as RentalApplicationStatus | "ALL")}>
                <SelectTrigger className="h-11 w-full rounded-2xl bg-white sm:w-64">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="flex w-full items-center justify-center gap-2 rounded-full border bg-stone-50 px-3 py-2 text-sm text-muted-foreground sm:w-auto">
              <Download className="size-4" />
              {totalRecords} registros
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl border bg-white/70" />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <ApplicationsTable
          applications={applications}
          basePath={basePath}
          isAdmin={isAdmin}
          onDownloadContract={handleDownload}
        />
      ) : (
        <EmptyState
          icon={<FileSearch className="size-7" />}
          title="Nenhuma consulta encontrada"
          description="Ajuste os filtros ou crie uma nova consulta para iniciar o fluxo de garantia locatícia."
          action={
            !isAdmin ? (
              <Button asChild>
                <Link to="/real_estate/nova-consulta">Criar primeira consulta</Link>
              </Button>
            ) : null
          }
        />
      )}

      {isFetching && !isLoading ? (
        <p className="text-center text-xs text-muted-foreground">Atualizando lista...</p>
      ) : null}
    </PageShell>
  );
}
