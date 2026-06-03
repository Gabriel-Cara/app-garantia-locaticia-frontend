import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageSquareWarning, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { formatDocument } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { contestRentalApplication, getRentalApplication } from "@/services/rental-applications";

const contestSchema = z.object({
  reason: z
    .string()
    .min(20, "Descreva a contestação com pelo menos 20 caracteres.")
    .max(1200, "A contestação deve ter no máximo 1200 caracteres."),
});

type ContestForm = z.infer<typeof contestSchema>;

export function ContestApplicationPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<ContestForm>({
    resolver: zodResolver(contestSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { data: application } = useQuery({
    queryKey: ["rental-application", applicationId],
    queryFn: () => getRentalApplication(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });

  const mutation = useMutation({
    mutationFn: (values: ContestForm) => contestRentalApplication(applicationId ?? "", values.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success("Contestação enviada para análise do admin.");
      navigate(`/real_estate/consultas/${applicationId}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleSubmit(values: ContestForm) {
    mutation.mutate(values);
  }

  const isAllowed = application?.status === "REJECTED";

  return (
    <PageShell>
      <Helmet title="Contestar Análise" />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`/real_estate/consultas/${applicationId}`}>
            <ArrowLeft className="size-4" />
            Voltar para consulta
          </Link>
        </Button>
        <PageHeader
          eyebrow="Contestação"
          title="Contestar decisão automática"
          description="Explique com clareza por que a análise deve ser revista. O admin poderá aprovar ou reprovar manualmente."
        />
      </div>

      {application ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <MessageSquareWarning className="size-4" />
          <AlertTitle>Consulta {formatDocument(application.document, application.documentType)}</AlertTitle>
          <AlertDescription>
            {isAllowed
              ? "Inclua contexto, documentos complementares e qualquer informação que ajude a revisão."
              : "Somente consultas reprovadas automaticamente podem ser contestadas."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle>Justificativa da contestação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                rows={8}
                placeholder="Ex.: Cliente apresentou documentação complementar, comprovante de renda atualizado e fiador adicional."
                {...form.register("reason")}
              />
              {form.formState.errors.reason ? (
                <p className="text-sm text-rose-600">{form.formState.errors.reason.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline">
                <Link to={`/real_estate/consultas/${applicationId}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={mutation.isPending || !isAllowed}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar contestação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
