import type { ReactNode } from "react";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDocument } from "@/lib/format";
import type { RentalApplication } from "@/types/doculoc";

type DeleteApplicationDialogProps = {
  application: RentalApplication;
  isDeleting?: boolean;
  trigger?: ReactNode;
  onConfirm: (application: RentalApplication) => void;
};

export function DeleteApplicationDialog({
  application,
  isDeleting = false,
  trigger,
  onConfirm,
}: DeleteApplicationDialogProps) {
  const subjectName =
    application.tenantName?.trim() ||
    (application.documentType === "CNPJ"
      ? "Empresa não identificada"
      : "Locatário não identificado");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <TriangleAlert className="size-6" />
          </div>

          <DialogTitle>Excluir consulta?</DialogTitle>

          <DialogDescription>
            Essa ação remove o caso do sistema em qualquer status e não poderá
            ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-stone-50 p-4 text-sm">
          <p className="font-semibold text-foreground">{subjectName}</p>
          <p className="mt-1 text-muted-foreground">
            {formatDocument(application.document, application.documentType)}
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>

          <Button
            className="bg-rose-600 text-white hover:bg-rose-700"
            disabled={isDeleting}
            onClick={() => onConfirm(application)}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Excluir consulta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}