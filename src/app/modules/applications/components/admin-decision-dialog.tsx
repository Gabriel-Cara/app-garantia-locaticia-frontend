import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { decideRentalApplication } from "@/services/rental-applications";
import { getApiErrorMessage } from "@/services/api";
import type { AdminDecision } from "@/types/doculoc";

const adminDecisionSchema = z.object({
  reason: z.string().min(12, "Explique a decisão com pelo menos 12 caracteres."),
});

type AdminDecisionForm = z.infer<typeof adminDecisionSchema>;

export function AdminDecisionDialog({
  applicationId,
  decision,
}: {
  applicationId: string;
  decision: AdminDecision;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const approve = decision === "APPROVED";
  const form = useForm<AdminDecisionForm>({
    resolver: zodResolver(adminDecisionSchema),
    defaultValues: {
      reason: approve
        ? "Aprovado manualmente após análise dos documentos complementares."
        : "Documentação complementar insuficiente para aprovação.",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AdminDecisionForm) =>
      decideRentalApplication(applicationId, decision, values.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["rental-applications"] });
      toast.success(approve ? "Consulta aprovada manualmente." : "Consulta reprovada manualmente.");
      setOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleSubmit(values: AdminDecisionForm) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={approve ? "default" : "destructive"} className="w-full sm:w-auto">
          {approve ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {approve ? "Aprovar manualmente" : "Reprovar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approve ? "Aprovar consulta" : "Reprovar consulta"}</DialogTitle>
          <DialogDescription>
            Registre uma justificativa clara. Essa observação ficará associada à decisão administrativa.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <Label htmlFor={`reason-${decision}`}>Justificativa</Label>
            <Textarea id={`reason-${decision}`} rows={5} {...form.register("reason")} />
            {form.formState.errors.reason ? (
              <p className="text-sm text-rose-600">{form.formState.errors.reason.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar decisão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
