// src/components/features/taxes/FreightTaxModal.tsx

import { toast } from "react-hot-toast";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { FreightTaxForm } from "./FreightTaxForm";
import type { FreightTax } from "@/types/taxes";
import type { CreateFreightTaxDTO } from "@/api/taxes";
import {
  useCreateFreightTaxMutation,
  useUpdateFreightTaxMutation,
} from "@/api/taxes";

interface FreightTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  tax?: FreightTax | null;
}

export function FreightTaxModal({
  isOpen,
  onClose,
  tax,
}: FreightTaxModalProps) {
  const createMutation = useCreateFreightTaxMutation();
  const updateMutation = useUpdateFreightTaxMutation();

  const isEditing = !!tax;
  const title = isEditing
    ? "Editar Imposto de Frete"
    : "Adicionar Imposto de Frete";

  const handleSubmit = async (data: CreateFreightTaxDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: tax.id,
          payload: data,
        });
        toast.success("Imposto de frete atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Imposto de frete criado com sucesso");
      }
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao salvar imposto de frete";
      const status = error?.response?.status;

      if (status === 409) {
        toast.error(message);
      } else if (status === 400) {
        if (error?.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          if (Array.isArray(validationErrors)) {
            validationErrors.forEach((err: any) => {
              toast.error(err.message || "Erro de validação");
            });
          } else {
            toast.error(message);
          }
        } else {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-6">
        <FreightTaxForm
          tax={tax}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="freight-tax-form"
            isLoading={isLoading}
          >
            {isEditing ? "Atualizar" : "Adicionar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
