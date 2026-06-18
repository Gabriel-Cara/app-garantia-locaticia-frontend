// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Icons
import { Building2, FileText, Loader2, Mail, SquareUser } from "lucide-react";

// API
import { signUp } from "@/api/sign-up";

// Libs
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { fetchAddressByCep } from "@/services/cep";
import { formatDocumentInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect, useState } from "react";

const signUpForm = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["REAL_ESTATE", "ADMIN"]),
  realEstateProfile: z
    .object({
      name: z.string(),
      cnpj: z.string(),
      phone: z.string(),
      responsibleName: z.string(),

      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    })
    .optional(),
});

type SignUpForm = z.infer<typeof signUpForm>;

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setFocus,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<SignUpForm>({
    defaultValues: {
      email: "",
      password: "",
      role: "REAL_ESTATE",
      realEstateProfile: {
        name: "",
        cnpj: "",
        phone: "",
        responsibleName: "",

        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
  });

  const realEstateZipCode = watch("realEstateProfile.zipCode");
  const realEstateCnpj = watch("realEstateProfile.cnpj") ?? "";

  useEffect(() => {
    const cleanZipCode = realEstateZipCode?.replace(/\D/g, "");

    if (cleanZipCode && cleanZipCode.length !== 8) return;

    const timeout = window.setTimeout(async () => {
      try {
        setIsFetchingCep(true);

        const address = await fetchAddressByCep(cleanZipCode!);

        setValue("realEstateProfile.street", address.street);
        setValue("realEstateProfile.neighborhood", address.neighborhood);
        setValue("realEstateProfile.city", address.city);
        setValue("realEstateProfile.state", address.state);

        const currentComplement = getValues("realEstateProfile.complement");

        if (!currentComplement && address.complement) {
          setValue("realEstateProfile.complement", address.complement);
        }

        setFocus("realEstateProfile.number");
      } catch (error) {
        console.log(error);
      } finally {
        setIsFetchingCep(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [realEstateZipCode]);

  const { mutateAsync: createUser } = useMutation({
    mutationFn: signUp,
  });

  async function handleSignUp(data: SignUpForm) {
    try {
      await createUser(data);

      toast.success("Cadastro realizado com sucesso!", {
        action: {
          label: "Fazer login",
          onClick: () => navigate("/sign-in?email=" + data.email),
        },
      });
    } catch (error) {
      toast.error("Erro ao cadastrar usuário!");
      console.log(error);
    }
  }

  function handleCnpjChange(value: string) {
    setValue("realEstateProfile.cnpj", formatDocumentInput(value, "CNPJ"), {
      shouldDirty: true,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(handleSignUp)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Cadastrar na plataforma</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Preencha os campos para fazer seu cadastro
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="real-estate-name">
            Nome da imobiliária
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-name"
              type="text"
              placeholder="Imobiliária Demo"
              required
              {...register("realEstateProfile.name")}
            />
          </InputGroup>
        </Field>
        {errors.realEstateProfile?.name && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.name.message}
          </FieldDescription>
        )}
        <Field>
          <div className="flex justify-between">
            <FieldLabel htmlFor="real-estate-cnpj">CNPJ</FieldLabel>
            <FieldDescription>&#40;Opcional&#41;</FieldDescription>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <FileText />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-cnpj"
              type="text"
              inputMode="numeric"
              maxLength={18}
              placeholder="00.000.000/0000-00"
              {...register("realEstateProfile.cnpj")}
              value={realEstateCnpj}
              onChange={(event) => handleCnpjChange(event.target.value)}
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="responsible-name">
            Nome do responsável
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SquareUser />
            </InputGroupAddon>
            <InputGroupInput
              id="responsible-name"
              type="text"
              placeholder="João da Silva"
              required
              {...register("realEstateProfile.responsibleName")}
            />
          </InputGroup>
        </Field>
        {errors.realEstateProfile?.responsibleName && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.responsibleName.message}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="phone">Telefone</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SquareUser />
            </InputGroupAddon>
            <InputGroupInput
              id="phone"
              type="text"
              placeholder="(00) 00000-0000"
              required
              {...register("realEstateProfile.phone")}
            />
          </InputGroup>
        </Field>
        {errors.realEstateProfile?.phone && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.phone.message}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="real-estate-zipcode">
            CEP da imobiliária
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-zipcode"
              type="text"
              placeholder="00000-000"
              {...register("realEstateProfile.zipCode")}
            />
          </InputGroup>
        </Field>
        {isFetchingCep ? (
          <p className="text-xs text-muted-foreground">Buscando endereço...</p>
        ) : null}

        <Field>
          <FieldLabel htmlFor="real-estate-street">
            Endereço da imobiliária
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-street"
              type="text"
              placeholder="Avenida Paulista"
              {...register("realEstateProfile.street")}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="real-estate-number">Número</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-number"
              type="text"
              placeholder="1471"
              {...register("realEstateProfile.number")}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="real-estate-complement">Complemento</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-complement"
              type="text"
              placeholder="Conjunto 511"
              {...register("realEstateProfile.complement")}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="real-estate-neighborhood">Bairro</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-neighborhood"
              type="text"
              placeholder="Bela Vista"
              {...register("realEstateProfile.neighborhood")}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="real-estate-city">Cidade</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-city"
              type="text"
              placeholder="São Paulo"
              {...register("realEstateProfile.city")}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="real-estate-state">UF</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-state"
              type="text"
              placeholder="SP"
              maxLength={2}
              {...register("realEstateProfile.state")}
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              placeholder="example@email.com"
              required
              {...register("email")}
            />
          </InputGroup>
        </Field>
        {errors.email && (
          <FieldDescription className="text-rose-500">
            {errors.email.message}
          </FieldDescription>
        )}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="********"
            required
            {...register("password")}
          />
        </Field>
        {errors.password && (
          <FieldDescription className="text-rose-500">
            {errors.password.message}
          </FieldDescription>
        )}
        <Field>
          <Button type="submit">
            {isSubmitting ? (
              <span>
                <Loader2 className="animate-spin" /> Cadastrando...
              </span>
            ) : (
              "Cadastrar"
            )}
          </Button>
        </Field>
        <FieldSeparator />
        <Field>
          <FieldDescription className="text-center text-foreground">
            Já possui uma conta?{" "}
            <Link to="/sign-in" className="underline underline-offset-4">
              Fazer login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
