import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Building2, Crown, Search, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { formatDocument } from "@/lib/format";
import { getWallet } from "@/services/credits";
import { listRentalApplications } from "@/services/rental-applications";
import type { ApplicationRequester } from "@/types/doculoc";
import { CreditEditDialog } from "../components/credit-edit-dialog";

type RealEstateWithCount = ApplicationRequester & { applicationsCount: number };

function WalletStatus({ userId }: { userId: string }) {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet", userId],
    queryFn: () => getWallet(userId),
  });

  if (isLoading) return <span className="text-sm text-muted-foreground">Carregando...</span>;

  if (!wallet) return <span className="text-sm text-muted-foreground">Sem carteira</span>;

  if (wallet.isVip) {
    return (
      <Badge className="h-7 rounded-full bg-primary text-primary-foreground">
        <Crown className="size-3" />
        VIP
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="h-7 rounded-full border-stone-200 bg-stone-50 px-3">
      {wallet.availableCredits} créditos
    </Badge>
  );
}

function RealEstateInfoCard({ realEstate }: { realEstate: RealEstateWithCount }) {
  const profile = realEstate.realEstateProfile;
  const name = profile?.name ?? realEstate.name;

  return (
    <article className="rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 rounded-2xl bg-primary/10 p-2 text-primary">
          <Building2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{realEstate.email}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Responsável
          </p>
          <p className="mt-1 wrap-break-word text-sm font-medium text-foreground">
            {profile?.responsibleName ?? realEstate.name}
          </p>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            CNPJ
          </p>
          <p className="mt-1 wrap-break-word text-sm font-medium text-foreground">
            {formatDocument(profile?.cnpj ?? undefined, "CNPJ")}
          </p>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Consultas
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{realEstate.applicationsCount}</p>
        </div>
        <div className="rounded-2xl border bg-stone-50/80 p-3">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Carteira
          </p>
          <WalletStatus userId={realEstate.id} />
        </div>
      </div>

      <div className="mt-4">
        <CreditEditDialog userId={realEstate.id} realEstateName={name} />
      </div>
    </article>
  );
}

export function RealEstatesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-real-estates-source"],
    queryFn: () => listRentalApplications({ page: 1, perPage: 100 }),
  });

  const realEstates = useMemo(() => {
    const map = new Map<string, RealEstateWithCount>();

    for (const application of data?.applications ?? []) {
      if (!application.requester?.id) continue;

      const current = map.get(application.requester.id);
      map.set(application.requester.id, {
        ...application.requester,
        applicationsCount: (current?.applicationsCount ?? 0) + 1,
      });
    }

    return Array.from(map.values()).filter((requester) => {
      const normalized = `${requester.name} ${requester.email} ${requester.realEstateProfile?.name ?? ""}`.toLowerCase();
      return normalized.includes(search.toLowerCase());
    });
  }, [data?.applications, search]);

  return (
    <PageShell>
      <Helmet title="Imobiliárias" />

      <PageHeader
        eyebrow="Créditos e VIP"
        title="Imobiliárias"
        description="Gerencie créditos e status VIP das imobiliárias que já aparecem nas consultas retornadas pelo backend."
      />

      <div className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-2xl bg-white pl-10"
            placeholder="Buscar imobiliária"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl border bg-white/70" />
      ) : realEstates.length > 0 ? (
        <>
          <div className="grid gap-3 lg:hidden">
            {realEstates.map((realEstate) => (
              <RealEstateInfoCard key={realEstate.id} realEstate={realEstate} />
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border bg-white/85 shadow-sm backdrop-blur lg:block">
            <Table className="min-w-235">
              <TableHeader className="bg-stone-50/80">
                <TableRow>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Consultas</TableHead>
                  <TableHead>Carteira</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realEstates.map((realEstate) => {
                  const profile = realEstate.realEstateProfile;
                  const name = profile?.name ?? realEstate.name;

                  return (
                    <TableRow key={realEstate.id}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="shrink-0 rounded-2xl bg-primary/10 p-2 text-primary">
                            <Building2 className="size-4" />
                          </div>
                          <div className="min-w-0 max-w-64">
                            <div className="truncate font-medium">{name}</div>
                            <div className="truncate text-xs text-muted-foreground">{realEstate.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{profile?.responsibleName ?? realEstate.name}</TableCell>
                      <TableCell>{formatDocument(profile?.cnpj ?? undefined, "CNPJ")}</TableCell>
                      <TableCell>{realEstate.applicationsCount}</TableCell>
                      <TableCell>
                        <WalletStatus userId={realEstate.id} />
                      </TableCell>
                      <TableCell className="text-right">
                        <CreditEditDialog userId={realEstate.id} realEstateName={name} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<WalletCards className="size-7" />}
          title="Nenhuma imobiliária encontrada"
          description="A documentação fornecida não expõe uma rota universal de listagem de usuários. Por isso, esta tela usa as imobiliárias presentes nas consultas retornadas pela API."
        />
      )}
    </PageShell>
  );
}
