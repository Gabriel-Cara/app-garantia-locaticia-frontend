import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/services/api";
import { updateRentalValues } from "@/services/rental-applications";
import type { RentalApplication, UpdateRentalValuesBody } from "@/types/doculoc";

type RentalValuesDialogProps = {
  application: RentalApplication;
};

export function RentalValuesDialog({ application }: RentalValuesDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateRentalValuesBody>({
    defaultValues: {
      rentValue: Number(application.rentValue ?? 0),
      condominiumValue: Number(application.condominiumValue ?? 0),
      feesValue: Number(application.feesValue ?? 0),
    },
  });

  useEffect(() => {
    form.reset({
      rentValue: Number(application.rentValue ?? 0),
      condominiumValue: Number(application.condominiumValue ?? 0),
      feesValue: Number(application.feesValue ?? 0),
    });
  }, [application, form]);

  const mutation = useMutation({
    mutationFn: (values: UpdateRentalValuesBody) =>
      updateRentalValues(application.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-application", application.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });

      toast.success("Valores atualizados com sucesso.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleSubmit(values: UpdateRentalValuesBody) {
    mutation.mutate({
      rentValue: Number(values.rentValue),
      condominiumValue: Number(values.condominiumValue),
      feesValue: Number(values.feesValue),
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="size-4" />
          Editar valores
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar valores do contrato</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="rentValue">Aluguel</Label>
            <Input
              id="rentValue"
              type="number"
              min="0"
              step="0.01"
              {...form.register("rentValue", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condominiumValue">Condomínio</Label>
            <Input
              id="condominiumValue"
              type="number"
              min="0"
              step="0.01"
              {...form.register("condominiumValue", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feesValue">IPTU</Label>
            <Input
              id="feesValue"
              type="number"
              min="0"
              step="0.01"
              {...form.register("feesValue", { valueAsNumber: true })}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Salvar valores
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}