// React
import { useEffect, useState } from "react";

// Libs
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { z } from "zod";

// Icons
import { ArrowLeft, Home, Loader2, Plus, Save, Trash2 } from "lucide-react";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/app/modules/_components/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Utils
import {
  formatDocument,
  formatDocumentInput,
  formatPhoneInput,
  formatCepInput,
  onlyDigits,
} from "@/lib/format";
import type { ContractDataBody } from "@/types/doculoc";

// Services
import { getApiErrorMessage } from "@/services/api";
import { fetchAddressByCep } from "@/services/cep";
import {
  fillContractData,
  getRentalApplication,
} from "@/services/rental-applications";

const tenantSchema = z.object({
  name: z.string().min(3, "Informe o nome completo."),
  document: z
    .string()
    .refine(
      (value) => [11, 14].includes(onlyDigits(value).length),
      "Informe um CPF ou CNPJ válido.",
    ),
  email: z.string().email("Informe um e-mail válido."),
  phone: z.string().min(10, "Informe um telefone válido."),
});

const contractDataSchema = z.object({
  tenants: z
    .array(tenantSchema)
    .min(1, "Informe pelo menos um locatário.")
    .max(3, "É permitido adicionar no máximo 3 locatários."),
  propertyZipCode: z.string().min(8, "Informe o CEP."),
  propertyStreet: z.string().min(3, "Informe a rua."),
  propertyNumber: z.string().min(1, "Informe o número."),
  propertyComplement: z.string().optional(),
  propertyNeighborhood: z.string().min(2, "Informe o bairro."),
  propertyCity: z.string().min(2, "Informe a cidade."),
  propertyState: z
    .string()
    .min(2, "UF obrigatória.")
    .max(2, "Use a UF com 2 letras."),
  adhesionFee: z.number().min(0, "Informe uma taxa de adesão válida."),
});

type ContractDataForm = z.infer<typeof contractDataSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-rose-600">{message}</p> : null;
}

export function ContractDataPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    watch,
    reset,
    control,
    setValue,
    getValues,
    setFocus,
    clearErrors,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ContractDataForm>({
    resolver: zodResolver(contractDataSchema),
    defaultValues: {
      tenants: [
        {
          name: "",
          document: "",
          email: "",
          phone: "",
        },
      ],
      propertyZipCode: "",
      propertyStreet: "",
      propertyNumber: "",
      propertyComplement: "",
      propertyNeighborhood: "",
      propertyCity: "",
      propertyState: "",
      adhesionFee: 0,
    },
  });

  const tenantsFieldArray = useFieldArray({
    control: control,
    name: "tenants",
  });

  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const propertyZipCode = watch("propertyZipCode") ?? "";
  const tenants = watch("tenants") ?? [];

  const { data: application } = useQuery({
    queryKey: ["rental-application", applicationId],
    queryFn: () => getRentalApplication(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });

  useEffect(() => {
    if (!application) return;

    const tenants =
      application.tenants && application.tenants.length > 0
        ? application.tenants.map((tenant) => ({
            name: tenant.name,
            document: formatDocumentInput(tenant.document),
            email: tenant.email,
            phone: formatPhoneInput(tenant.phone ?? ""),
          }))
        : [
            {
              name: application.tenantName ?? "",
              document: formatDocumentInput(
                application.tenantDocument ?? application.document ?? "",
              ),
              email: application.tenantEmail ?? "",
              phone: formatPhoneInput(application.tenantPhone ?? ""),
            },
          ];

    reset({
      tenants,
      propertyZipCode: formatCepInput(application.propertyZipCode ?? ""),
      propertyStreet: application.propertyStreet ?? "",
      propertyNumber: application.propertyNumber ?? "",
      propertyComplement: application.propertyComplement ?? "",
      propertyNeighborhood: application.propertyNeighborhood ?? "",
      propertyCity: application.propertyCity ?? "",
      propertyState: application.propertyState ?? "",
      adhesionFee: Number(application.adhesionFee ?? 0),
    });
  }, [application, reset]);

  useEffect(() => {
    const cleanZipCode = onlyDigits(propertyZipCode);

    if (!cleanZipCode || cleanZipCode.length !== 8) return;

    const timeout = window.setTimeout(async () => {
      try {
        setIsFetchingCep(true);

        const address = await fetchAddressByCep(cleanZipCode);

        setValue("propertyStreet", address.street, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("propertyNeighborhood", address.neighborhood, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("propertyCity", address.city, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("propertyState", address.state, {
          shouldValidate: true,
          shouldDirty: true,
        });

        const currentComplement = getValues("propertyComplement");

        if (!currentComplement && address.complement) {
          setValue("propertyComplement", address.complement, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        setFocus("propertyNumber");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível consulta o CEP.",
        );
      } finally {
        setIsFetchingCep(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [propertyZipCode, setValue, getValues, setFocus]);

  const mutation = useMutation({
    mutationFn: (values: ContractDataBody) =>
      fillContractData(applicationId ?? "", values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
      toast.success(
        "Dados enviados. Aguardando geração do contrato pelo admin.",
      );
      navigate(`/real_estate/consultas/${applicationId}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function handleContractData(values: ContractDataForm) {
    mutation.mutate({
      ...values,
      propertyZipCode: onlyDigits(values.propertyZipCode),
      tenants: values.tenants.map((tenant) => ({
        ...tenant,
        document: onlyDigits(tenant.document),
        phone: onlyDigits(tenant.phone),
      })),
    });
  }

  function handleTenantDocumentChange(index: number, value: string) {
    setValue(`tenants.${index}.document`, formatDocumentInput(value), {
      shouldDirty: true,
    });
    clearErrors(`tenants.${index}.document`);
  }

  function handleTenantPhoneChange(index: number, value: string) {
    setValue(`tenants.${index}.phone`, formatPhoneInput(value), {
      shouldDirty: true,
      shouldValidate: true,
    });

    clearErrors(`tenants.${index}.phone`);
  }

  function handlePropertyZipCodeChange(value: string) {
    setValue("propertyZipCode", formatCepInput(value), {
      shouldDirty: true,
      shouldValidate: true,
    });

    clearErrors("propertyZipCode");
  }

  const isAllowed = application?.status === "WAITING_CONTRACT_DATA";

  return (
    <PageShell>
      <Helmet title="Dados para contrato" />

      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`/real_estate/consultas/${applicationId}`}>
            <ArrowLeft className="size-4" />
            Voltar para consulta
          </Link>
        </Button>
        <PageHeader
          eyebrow="Contrato"
          title="Preencher dados para contrato"
          description="Complete os dados do locatário e do imóvel. Depois disso, o caso segue para geração do contrato pelo admin."
        />
      </div>

      {application ? (
        <Alert className="border-primary/20 bg-primary/5">
          <Home className="size-4" />
          <AlertTitle>
            Consulta{" "}
            {formatDocument(application.document, application.documentType)}
          </AlertTitle>
          <AlertDescription>
            {isAllowed
              ? "Os dados serão vinculados a essa análise recomendada."
              : "Esta consulta não está no status liberado para preenchimento de contrato."}
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(handleContractData)} className="grid gap-5">
        <Card className="bg-white/85 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Dados do(s) locatário(s)</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                O primeiro locatário deve ser o CPF/CNPJ consultado. Os demais
                entram apenas no contrato e não consomem novas consultas.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={tenantsFieldArray.fields.length >= 3}
              onClick={() =>
                tenantsFieldArray.append({
                  name: "",
                  document: "",
                  email: "",
                  phone: "",
                })
              }
            >
              <Plus className="size-4" />
              Adicionar locatário
            </Button>
          </CardHeader>

          <CardContent className="grid gap-5">
            {tenantsFieldArray.fields.map((field, index) => {
              const tenantDocument = watch(`tenants.${index}.document`);

              return (
                <div
                  key={field.id}
                  className="grid gap-4 rounded-3xl border bg-stone-50/70 p-4 md:grid-cols-2"
                >
                  <div className="flex items-center justify-between gap-3 md:col-span-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Locatário {index + 1}
                      </h3>
                      {index === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Deve ser o documento principal consultado.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Locatário adicional para constar no contrato.
                        </p>
                      )}
                    </div>

                    {tenantsFieldArray.fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => tenantsFieldArray.remove(index)}
                      >
                        <Trash2 className="size-4" />
                        Remover
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`tenants.${index}.name`}>
                      Nome completo
                    </Label>
                    <Input
                      id={`tenants.${index}.name`}
                      className="h-11 rounded-2xl"
                      placeholder="Digite o nome completo"
                      {...register(`tenants.${index}.name`)}
                    />
                    <FieldError
                      message={errors.tenants?.[index]?.name?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tenants.${index}.document`}>
                      CPF ou CNPJ
                    </Label>
                    <Input
                      id={`tenants.${index}.document`}
                      className="h-11 rounded-2xl"
                      inputMode="numeric"
                      maxLength={18}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      {...register(`tenants.${index}.document`)}
                      value={tenantDocument ?? ""}
                      onChange={(event) =>
                        handleTenantDocumentChange(index, event.target.value)
                      }
                    />
                    <FieldError
                      message={errors.tenants?.[index]?.document?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tenants.${index}.phone`}>Telefone</Label>
                    <Input
                      id={`tenants.${index}.phone`}
                      className="h-11 rounded-2xl"
                      inputMode="numeric"
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      {...register(`tenants.${index}.phone`)}
                      value={tenants[index]?.phone ?? ""}
                      onChange={(event) =>
                        handleTenantPhoneChange(index, event.target.value)
                      }
                    />
                    <FieldError
                      message={errors.tenants?.[index]?.phone?.message}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`tenants.${index}.email`}>E-mail</Label>
                    <Input
                      id={`tenants.${index}.email`}
                      type="email"
                      className="h-11 rounded-2xl"
                      placeholder="Digite o e-mail"
                      {...register(`tenants.${index}.email`)}
                    />
                    <FieldError
                      message={errors.tenants?.[index]?.email?.message}
                    />
                  </div>
                </div>
              );
            })}

            {tenantsFieldArray.fields.length >= 3 ? (
              <p className="text-sm text-muted-foreground">
                Limite de 3 locatários por contrato atingido.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>Dados do imóvel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyZipCode">CEP</Label>
              <Input
                id="propertyZipCode"
                className="h-11 rounded-2xl"
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
                {...register("propertyZipCode")}
                value={propertyZipCode}
                onChange={(event) =>
                  handlePropertyZipCodeChange(event.target.value)
                }
              />
              <FieldError message={errors.propertyZipCode?.message} />
              {isFetchingCep ? (
                <p className="text-xs text-muted-foreground">
                  Buscando endereço...
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="propertyStreet">Rua/Avenida</Label>
              <Input
                id="propertyStreet"
                className="h-11 rounded-2xl"
                placeholder="Digite o nome da rua ou avenida"
                {...register("propertyStreet")}
              />
              <FieldError message={errors.propertyStreet?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyNumber">Número</Label>
              <Input
                id="propertyNumber"
                className="h-11 rounded-2xl"
                placeholder="Digite o número do imóvel"
                {...register("propertyNumber")}
              />
              <FieldError message={errors.propertyNumber?.message} />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="propertyComplement">Complemento</Label>
              <Input
                id="propertyComplement"
                className="h-11 rounded-2xl"
                placeholder="Digite o complemento"
                {...register("propertyComplement")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyNeighborhood">Bairro</Label>
              <Input
                id="propertyNeighborhood"
                className="h-11 rounded-2xl"
                placeholder="Digite o nome do bairro"
                {...register("propertyNeighborhood")}
              />
              <FieldError message={errors.propertyNeighborhood?.message} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="propertyCity">Cidade</Label>
              <Input
                id="propertyCity"
                className="h-11 rounded-2xl"
                placeholder="Digite o nome da cidade"
                {...register("propertyCity")}
              />
              <FieldError message={errors.propertyCity?.message} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="propertyState">UF</Label>
              <Input
                id="propertyState"
                className="h-11 rounded-2xl uppercase"
                maxLength={2}
                placeholder="Digite a sigla do estado"
                {...register("propertyState")}
              />
              <FieldError message={errors.propertyState?.message} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end" />
        <Card className="bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>Dados econômicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adhesionFee">Taxa de adesão</Label>
              <Input
                id="adhesionFee"
                type="number"
                min="0"
                step="0.01"
                className="h-11 rounded-2xl"
                {...register("adhesionFee", { valueAsNumber: true })}
              />
              <FieldError message={errors.adhesionFee?.message} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link to={`/real_estate/consultas/${applicationId}`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !isAllowed}
            className="beam-button"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enviar dados
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
