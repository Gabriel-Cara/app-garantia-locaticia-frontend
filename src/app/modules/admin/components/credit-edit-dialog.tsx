import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Loader2, Settings2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/services/api";
import { getWallet, setUserCredits, setUserVip } from "@/services/credits";

const creditsSchema = z.object({
  credits: z.number().int("Use um número inteiro.").min(0, "Créditos não podem ser negativos."),
  isVip: z.boolean(),
  reason: z.string().min(8, "Informe o motivo da alteração."),
});

type CreditsForm = z.infer<typeof creditsSchema>;

export function CreditEditDialog({ userId, realEstateName }: { userId: string; realEstateName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet", userId],
    queryFn: () => getWallet(userId),
    enabled: open,
  });

  const form = useForm<CreditsForm>({
    resolver: zodResolver(creditsSchema),
    defaultValues: {
      credits: 0,
      isVip: false,
      reason: "Ajuste manual realizado pelo admin.",
    },
  });

  useEffect(() => {
    if (!wallet) return;

    form.reset({
      credits: wallet.availableCredits,
      isVip: wallet.isVip,
      reason: "Ajuste manual realizado pelo admin.",
    });
  }, [form, wallet]);

  const mutation = useMutation({
    mutationFn: async (values: CreditsForm) => {
      const vipChanged = values.isVip !== wallet?.isVip;
      const creditsChanged = values.credits !== wallet?.availableCredits;

      if (vipChanged) {
        await setUserVip(userId, values.isVip, values.reason);
      }

      if (!values.isVip && creditsChanged) {
        await setUserCredits(userId, values.credits, values.reason);
      }

      return getWallet(userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
      toast.success("Carteira atualizada com sucesso.");
      setOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleSubmit(values: CreditsForm) {
    mutation.mutate(values);
  }

  const isVip = form.watch("isVip");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Settings2 className="size-4" />
          Editar créditos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar carteira</DialogTitle>
          <DialogDescription>
            Defina créditos ou marque {realEstateName} como VIP para remover o limite de consultas.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-stone-100" />
        ) : (
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="rounded-3xl border bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`vip-${userId}`}
                  checked={isVip}
                  onCheckedChange={(checked) => form.setValue("isVip", checked === true)}
                />
                <Label htmlFor={`vip-${userId}`} className="flex cursor-pointer items-center gap-2">
                  <Crown className="size-4 text-primary" />
                  Imobiliária VIP
                </Label>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Quando VIP estiver ativo, o campo de limite de consultas fica desabilitado.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`credits-${userId}`}>Créditos disponíveis</Label>
              <Input
                id={`credits-${userId}`}
                type="number"
                min="0"
                disabled={isVip}
                className="h-11 rounded-2xl"
                {...form.register("credits", { valueAsNumber: true })}
              />
              {form.formState.errors.credits ? (
                <p className="text-sm text-rose-600">{form.formState.errors.credits.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reason-${userId}`}>Motivo</Label>
              <Textarea id={`reason-${userId}`} rows={4} {...form.register("reason")} />
              {form.formState.errors.reason ? (
                <p className="text-sm text-rose-600">{form.formState.errors.reason.message}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
