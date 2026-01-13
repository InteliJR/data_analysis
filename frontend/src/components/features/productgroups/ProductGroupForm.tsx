import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/common/Label";
import type { ProductGroup } from "@/types/productGroup";

const normalizeOptionalNumber = (value: unknown): number | undefined => {
  if (value === "" || value === null || typeof value === "undefined") {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const percentageSchema = z
  .number()
  .int("Deve ser um número inteiro")
  .min(0, "Mínimo 0%")
  .max(100, "Máximo 100%")
  .optional();

const volumeSchema = z
  .number()
  .int("Deve ser um número inteiro")
  .min(0, "Mínimo 0")
  .optional();

const productGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome muito longo (máximo 100 caracteres)")
    .refine((val) => val.trim().length > 0, {
      message: "Nome não pode conter apenas espaços",
    }),
  description: z
    .string()
    .max(500, "Descrição muito longa (máximo 500 caracteres)")
    .optional()
    .or(z.literal("")),
  porcentage: percentageSchema,
  volumevendasconsiderar: volumeSchema,
});

type ProductGroupFormData = z.infer<typeof productGroupSchema>;

interface ProductGroupFormProps {
  initialData?: ProductGroup;
  onSubmit: (data: ProductGroupFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductGroupForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProductGroupFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductGroupFormData>({
    resolver: zodResolver(productGroupSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      porcentage: initialData?.porcentage ?? undefined,
      volumevendasconsiderar: initialData?.volumevendasconsiderar ?? undefined,
    },
  });

  const nameValue = watch("name") || "";
  const descriptionValue = watch("description") || "";
  const porcentageValue = watch("porcentage");
  const volumeConsiderValue = watch("volumevendasconsiderar");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          label="Nome do Grupo"
          placeholder="Ex: Cloro, Hipo, Premium..."
          error={errors.name?.message}
          required
          {...register("name")}
        />
        <p className="mt-1 text-xs text-gray-500">
          {nameValue.length}/100 caracteres
        </p>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Adicione uma descrição opcional para o grupo..."
          className={
            errors.description
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : undefined
          }
          rows={4}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">
            {errors.description.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {descriptionValue.length}/500 caracteres
        </p>
      </div>

      <div>
        <Input
          label="Porcentagem"
          type="number"
          placeholder="0 - 100"
          min={0}
          max={100}
          error={errors.porcentage?.message}
          {...register("porcentage", {
            setValueAs: normalizeOptionalNumber,
          })}
        />
        {Number.isFinite(porcentageValue) && (
          <p className="mt-1 text-xs text-gray-500">{porcentageValue}%</p>
        )}
      </div>

      <div>
        <Input
          label="Volume de Vendas a Considerar"
          type="number"
          placeholder="Ex: 10000"
          min={0}
          error={errors.volumevendasconsiderar?.message}
          {...register("volumevendasconsiderar", {
            setValueAs: normalizeOptionalNumber,
          })}
        />
        {Number.isFinite(volumeConsiderValue) && (
          <p className="mt-1 text-xs text-gray-500">{volumeConsiderValue}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Salvar alterações" : "Criar grupo"}
        </Button>
      </div>
    </form>
  );
}
