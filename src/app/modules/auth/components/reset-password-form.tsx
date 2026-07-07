import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { resetPassword } from "@/api/reset-password";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInputGroup } from "./password-input-group";

const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    passwordConfirmation: z.string().min(8, "Confirme sua nova senha"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não conferem",
  });

type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  });

  const { mutateAsync: submitPasswordReset } = useMutation({
    mutationFn: resetPassword,
  });

  async function handleResetPassword(data: ResetPasswordForm) {
    if (!token) {
      toast.error("Link de recuperação inválido.");
      return;
    }

    const parsed = resetPasswordFormSchema.safeParse(data);

    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Verifique os campos informados.",
      );
      return;
    }

    try {
      await submitPasswordReset({
        token,
        password: parsed.data.password,
        passwordConfirmation: parsed.data.passwordConfirmation,
      });

      toast.success(
        "Senha redefinida com sucesso! Faça login com sua nova senha.",
      );
      navigate("/sign-in");
    } catch (error) {
      toast.error("Link inválido, expirado ou senha não aceita.");
      console.error(error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleResetPassword)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Definir nova senha</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Digite e confirme sua nova senha para acessar sua conta
          </p>
        </div>

        {!token && (
          <FieldDescription className="rounded-md border border-rose-200 bg-rose-50 p-3 text-center text-rose-600">
            Link de recuperação inválido. Solicite um novo email de recuperação.
          </FieldDescription>
        )}

        <Field>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <PasswordInputGroup
            id="password"
            placeholder="Digite sua nova senha"
            required
            minLength={8}
            {...register("password")}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">
            Confirmar nova senha
          </FieldLabel>
          <PasswordInputGroup
            id="passwordConfirmation"
            placeholder="Confirme sua nova senha"
            required
            minLength={8}
            {...register("passwordConfirmation")}
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isSubmitting || !token}>
            {isSubmitting ? (
              <span className="inline-flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </span>
            ) : (
              "Salvar nova senha"
            )}
          </Button>
        </Field>

        <FieldSeparator />

        <Field>
          <FieldDescription className="text-center text-foreground">
            Precisa de outro link?{" "}
            <Link
              to="/forgot-password"
              className="underline underline-offset-4"
            >
              Recuperar senha
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
