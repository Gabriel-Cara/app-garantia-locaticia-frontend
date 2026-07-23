// React
import { useEffect, useState } from "react";

// Components
import { PasswordInputGroup } from "./password-input-group";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  Building2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  SquareUser,
  UserRound,
} from "lucide-react";

// API
import { signUp } from "@/api/sign-up";

// Libs
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  formatCepInput,
  formatDocumentInput,
  formatPhoneInput,
} from "@/lib/format";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";

// Services
import { getApiErrorCode, getApiErrorMessage } from "@/services/api";
import { fetchAddressByCep } from "@/services/cep";

const signUpForm = z.object({
  email: z.email("Informe um e-mail válido."),

  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),

  role: z.enum(["REAL_ESTATE", "ADMIN"]),

  realEstateProfile: z
    .object({
      profileType: z.enum(["COMPANY", "AUTONOMOUS_BROKER"]),

      name: z.string().min(3, "Informe o nome."),

      document: z.string().min(1, "Informe o documento."),

      phone: z.string().min(8, "Informe um telefone válido."),

      responsibleName: z.string().min(3, "Informe o nome do responsável."),

      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    })
    .superRefine((data, context) => {
      const digits = data.document.replace(/\D/g, "");

      if (data.profileType === "COMPANY" && digits.length !== 14) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["document"],
          message: "Informe um CNPJ válido.",
        });
      }

      if (data.profileType === "AUTONOMOUS_BROKER" && digits.length !== 11) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["document"],
          message: "Informe um CPF válido.",
        });
      }
    }),
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
    setError,
    clearErrors,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpForm),
    defaultValues: {
      email: "",
      password: "",
      role: "REAL_ESTATE",
      realEstateProfile: {
        profileType: "COMPANY",
        name: "",
        document: "",
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

  const realEstateZipCode = watch("realEstateProfile.zipCode") ?? "";
  const profileType = watch("realEstateProfile.profileType") ?? "COMPANY";
  const realEstateDocument = watch("realEstateProfile.document") ?? "";
  const realEstatePhone = watch("realEstateProfile.phone") ?? "";

  const isCompany = profileType === "COMPANY";
  const documentType = isCompany ? "CNPJ" : "CPF";
  const documentLabel = isCompany ? "CNPJ" : "CPF";
  const documentPlaceholder = isCompany
    ? "00.000.000/0000-00"
    : "000.000.000-00";
  const documentMaxLength = isCompany ? 18 : 14;

  useEffect(() => {
    const cleanZipCode = realEstateZipCode?.replace(/\D/g, "");

    if (!cleanZipCode || cleanZipCode.length !== 8) return;

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
      const payload = {
        ...data,
        realEstateProfile: {
          ...data.realEstateProfile,
          document: data.realEstateProfile.document,
          cnpj:
            data.realEstateProfile.profileType === "COMPANY"
              ? data.realEstateProfile.document
              : undefined,
        },
      };

      await createUser(payload as any);

      toast.success("Cadastro realizado com sucesso!", {
        action: {
          label: "Fazer login",
          onClick: () => navigate("/sign-in?email=" + data.email),
        },
      });
    } catch (error) {
      const code = getApiErrorCode(error);
      const message = getApiErrorMessage(error);

      if (code === "EMAIL_ALREADY_USED") {
        setError("email", {
          type: "server",
          message: "Este e-mail já está cadastrado.",
        });

        toast.error("Este e-mail já está cadastrado.");
        return;
      }

      if (code === "DOCUMENT_ALREADY_USED" || code === "CNPJ_ALREADY_USED") {
        const documentName = documentType === "CPF" ? "CPF" : "CNPJ";

        setError("realEstateProfile.document", {
          type: "server",
          message: `Este ${documentName} já está cadastrado.`,
        });

        toast.error(`Este ${documentName} já está cadastrado.`);
        return;
      }

      toast.error(message || "Não foi possível realizar o cadastro.");
    }
  }

  function handleProfileTypeChange(value: string) {
    const nextProfileType = value as "COMPANY" | "AUTONOMOUS_BROKER";

    setValue("realEstateProfile.profileType", nextProfileType, {
      shouldDirty: true,
      shouldValidate: false,
    });

    setValue("realEstateProfile.document", "", {
      shouldDirty: true,
      shouldValidate: false,
    });

    clearErrors("realEstateProfile.document");
  }

  function handleDocumentChange(value: string) {
    setValue(
      "realEstateProfile.document",
      formatDocumentInput(value, documentType),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  function handlePhoneChange(value: string) {
    setValue("realEstateProfile.phone", formatPhoneInput(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleZipCodeChange(value: string) {
    setValue("realEstateProfile.zipCode", formatCepInput(value), {
      shouldDirty: true,
      shouldValidate: true,
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
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background ">
          <Tabs
            value={profileType}
            onValueChange={handleProfileTypeChange}
            className="w-full"
          >
            <TabsList className="w-full">
              {/* className="rounded-xl p-2" */}
              <TabsTrigger value="COMPANY">
                <Building2 className="size-4" />
                Imobiliária PJ
              </TabsTrigger>

              {/* className="rounded-xl p-2" */}
              <TabsTrigger value="AUTONOMOUS_BROKER">
                <UserRound className="size-4" />
                Corretor autônomo
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-4 px-2 pb-3">
            <Field>
              <FieldLabel htmlFor="real-estate-name">
                {isCompany
                  ? "Nome da imobiliária"
                  : "Nome profissional/comercial"}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Building2 />
                </InputGroupAddon>
                <InputGroupInput
                  id="real-estate-name"
                  type="text"
                  placeholder={
                    isCompany ? "Imobiliária Demo" : "João Silva Corretor"
                  }
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
              <FieldLabel htmlFor="real-estate-document">
                {documentLabel}
              </FieldLabel>

              <InputGroup>
                <InputGroupAddon>
                  <FileText />
                </InputGroupAddon>
                <InputGroupInput
                  id="real-estate-document"
                  type="text"
                  inputMode="numeric"
                  maxLength={documentMaxLength}
                  placeholder={documentPlaceholder}
                  required
                  {...register("realEstateProfile.document")}
                  value={realEstateDocument}
                  onChange={(event) => handleDocumentChange(event.target.value)}
                />
              </InputGroup>
            </Field>
            {errors.realEstateProfile?.document ? (
              <FieldDescription className="text-rose-500">
                {errors.realEstateProfile.document.message}
              </FieldDescription>
            ) : null}

            <Field>
              <FieldLabel htmlFor="responsible-name">
                {isCompany ? "Nome do responsável" : "Nome completo"}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <SquareUser />
                </InputGroupAddon>
                <InputGroupInput
                  id="responsible-name"
                  type="text"
                  placeholder={
                    isCompany ? "João da Silva" : "Nome completo do corretor"
                  }
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
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  required
                  {...register("realEstateProfile.phone")}
                  value={realEstatePhone}
                  onChange={(event) => handlePhoneChange(event.target.value)}
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
                {isCompany ? "CEP da imobiliária" : "CEP de atendimento"}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Building2 />
                </InputGroupAddon>
                <InputGroupInput
                  id="real-estate-zipcode"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  {...register("realEstateProfile.zipCode")}
                  value={realEstateZipCode}
                  onChange={(event) => handleZipCodeChange(event.target.value)}
                />
              </InputGroup>
            </Field>
            {isFetchingCep ? (
              <p className="text-xs text-muted-foreground">
                Buscando endereço...
              </p>
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
              <FieldLabel htmlFor="real-estate-complement">
                Complemento
              </FieldLabel>
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
              <PasswordInputGroup
                id="password"
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
          </div>
        </div>

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
