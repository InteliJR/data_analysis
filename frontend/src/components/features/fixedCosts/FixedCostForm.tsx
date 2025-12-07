// src/components/features/fixedCosts/FixedCostForm.tsx

import { useForm } from "react-hook-form";
import type { FixedCost, FixedCostFormData } from "@/types/fixed_costs";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { formatCurrency } from "@/lib/utils";
import { Text } from "@/components/common/Text";

interface FixedCostFormProps {
  cost?: FixedCost | null;
  onSubmit: (data: FixedCostFormData) => void;
  isLoading?: boolean;
}

export function FixedCostForm({ cost, onSubmit }: FixedCostFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FixedCostFormData>({
    defaultValues: cost
      ? {
          description: cost.description,
          code: cost.code || "",
          personnelExpenses: cost.personnelExpenses,
          generalExpenses: cost.generalExpenses,
          proLabore: cost.proLabore,
          depreciation: cost.depreciation,
          considerationPercentage: cost.considerationPercentage,
        }
      : {
          description: "",
          code: "",
          personnelExpenses: 0,
          generalExpenses: 0,
          proLabore: 0,
          depreciation: 0,
          considerationPercentage: 100,
        },
  });

  // Watch dos valores para cálculos em tempo real
  const personnelExpenses = watch("personnelExpenses") || 0;
  const generalExpenses = watch("generalExpenses") || 0;
  const proLabore = watch("proLabore") || 0;
  const depreciation = watch("depreciation") || 0;
  const considerationPercentage = watch("considerationPercentage") || 0;

  // Cálculos automáticos
  const totalCost =
    personnelExpenses + generalExpenses + proLabore + depreciation;
  const overheadToConsider = totalCost * (considerationPercentage / 100);

  return (
    <form
      id="fixed-cost-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Seção 1: Informações Básicas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="description">
            Descrição <span className="text-red-500">*</span>
          </Label>
          <Input
            id="description"
            placeholder="Ex: DESPESAS COM PESSOAL"
            {...register("description", {
              required: "Descrição é obrigatória",
              minLength: { value: 3, message: "Mínimo de 3 caracteres" },
            })}
            error={errors.description?.message}
          />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="code">Código (Opcional)</Label>
          <Input id="code" placeholder="Ex: FC-001" {...register("code")} />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="considerationPercentage">
            % Gastos a Considerar <span className="text-red-500">*</span>
          </Label>
          <Input
            id="considerationPercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="100"
            {...register("considerationPercentage", {
              required: "Percentual é obrigatório",
              min: { value: 0, message: "Mínimo: 0%" },
              max: { value: 100, message: "Máximo: 100%" },
              valueAsNumber: true,
            })}
            error={errors.considerationPercentage?.message}
          />
          <p className="text-xs text-gray-500 mt-1">
            Percentual entre 0% e 100%
          </p>
        </div>
      </div>

      {/* Seção 2: Custos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Custos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="personnelExpenses">
              Pessoal <span className="text-red-500">*</span>
            </Label>
            <CurrencyInput
              id="personnelExpenses"
              currency="BRL"
              value={personnelExpenses}
              onChange={(value) => setValue("personnelExpenses", value)}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="generalExpenses">
              Outros <span className="text-red-500">*</span>
            </Label>
            <CurrencyInput
              id="generalExpenses"
              currency="BRL"
              value={generalExpenses}
              onChange={(value) => setValue("generalExpenses", value)}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="proLabore">Pró-Labore</Label>
            <CurrencyInput
              id="proLabore"
              currency="BRL"
              value={proLabore}
              onChange={(value) => setValue("proLabore", value)}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="depreciation">Depreciação</Label>
            <CurrencyInput
              id="depreciation"
              currency="BRL"
              value={depreciation}
              onChange={(value) => setValue("depreciation", value)}
              placeholder="R$ 0,00"
            />
          </div>
        </div>
      </div>

      {/* Seção 3 removida: Volume de Vendas (agora o overhead é por Grupo) */}

      {/* Preview dos Cálculos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <Text className="font-semibold text-blue-900">Preview de Cálculo</Text>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <Text className="text-gray-600">Total de Custos:</Text>
            <Text className="font-semibold">{formatCurrency(totalCost)}</Text>
          </div>
          <div>
            <Text className="text-gray-600">Overhead a Considerar:</Text>
            <Text className="font-semibold">
              {formatCurrency(overheadToConsider)}
            </Text>
          </div>
          {/* Overhead por unidade agora é calculado por Grupo de Produto */}
        </div>
      </div>

      {/* Nota sobre campos obrigatórios */}
      <p className="text-xs text-gray-500">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}
