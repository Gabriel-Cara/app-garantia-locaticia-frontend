// Components
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

// Libs
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, SquareAsterisk } from "lucide-react";
import { signIn } from "@/api/sign-in";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";

// Hooks
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";


const signInForm = z.object({
  email: z.email(),
  password: z.string().min(8),
})

type SignInForm = z.infer<typeof signInForm>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { save } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SignInForm>({
    defaultValues: {
      email: searchParams.get('email') || '',
      password: ''
    }
  })

  const { mutateAsync: login,  } = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      toast.success('Login realizado com sucesso!')
    },
    onError: (error) => {
      console.log(error.message)
    }
  })

  async function handleSignIn(data: SignInForm) {
    try {
      const response = await login({
        email: data.email,
        password: data.password
      })

      save(response.data);

      const role = response.data.user.role.toLowerCase();

      navigate(`/${role}/dashboard`);
    } catch (error) {
      toast.error("Email ou senha incorretos.")
    }
  }


  return (
    <form onSubmit={handleSubmit(handleSignIn)} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Faça login em sua conta</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Digite seu email e senha para acessar sua conta
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
              {...register('email')}
            />
          </InputGroup>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              to="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <SquareAsterisk />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type="password"
              placeholder="Digite sua senha"
              required
              {...register('password')}
            />
          </InputGroup>
        </Field>
        <Field>
          <Button type="submit">{isSubmitting ? <span><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</span> : 'Entrar'}</Button>
        </Field>
        <FieldSeparator></FieldSeparator>
        <Field>
          <FieldDescription className="text-foreground text-center">
            Não possui uma conta?{" "}
            <Link to="/sign-up" className="underline underline-offset-4">
              Cadastrar
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
