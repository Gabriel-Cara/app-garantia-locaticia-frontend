import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { forgotPassword } from "@/api/forgot-password";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const forgotPasswordFormSchema = z.object({
  email: z.email("Informe um email válido"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordFormSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: searchParams.get("email") || "",
    },
  });

  const { mutateAsync: requestPasswordReset } = useMutation({
    mutationFn: forgotPassword,
  });

  async function handleForgotPassword(data: ForgotPasswordForm) {
    const parsed = forgotPasswordFormSchema.safeParse(data);

    if (!parsed.success) {
      toast.error("Informe um email válido.");
      return;
    }

    try {
      await requestPasswordReset(parsed.data);
      toast.success("Se o email estiver cadastrado, enviaremos as instruções de recuperação.");
    } catch (error) {
      toast.error("Não foi possível solicitar a recuperação de senha.");
      console.error(error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleForgotPassword)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Informe seu email para receber o link de redefinição de senha
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              placeholder="Digite seu email"
              required
              {...register("email")}
            />
          </InputGroup>
        </Field>

        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </span>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
        </Field>

        <FieldSeparator />

        <Field>
          <FieldDescription className="text-center text-foreground">
            Lembrou sua senha?{" "}
            <Link to="/sign-in" className="underline underline-offset-4">
              Fazer login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
