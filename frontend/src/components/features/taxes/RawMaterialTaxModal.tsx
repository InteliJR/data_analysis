// src/components/features/taxes/RawMaterialTaxModal.tsx

import { toast } from "react-hot-toast";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { RawMaterialTaxForm } from "./RawMaterialTaxForm";
import type { RawMaterialTax } from "@/types/taxes";
import type { CreateRawMaterialTaxDTO } from "@/api/taxes";
import {
  useCreateRawMaterialTaxMutation,
  useUpdateRawMaterialTaxMutation,
} from "@/api/taxes";

interface RawMaterialTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  tax?: RawMaterialTax | null;
}

export function RawMaterialTaxModal({
  isOpen,
  onClose,
  tax,
}: RawMaterialTaxModalProps) {
  const createMutation = useCreateRawMaterialTaxMutation();
  const updateMutation = useUpdateRawMaterialTaxMutation();

  const isEditing = !!tax;
  const title = isEditing
    ? "Editar Imposto de Produto"
    : "Adicionar Imposto de Produto";

  const handleSubmit = async (data: CreateRawMaterialTaxDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: tax.id,
          payload: data,
        });
        toast.success("Imposto de produto atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Imposto de produto criado com sucesso");
      }
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Erro ao salvar imposto de produto";
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
        <RawMaterialTaxForm
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
            form="raw-material-tax-form"
            isLoading={isLoading}
          >
            {isEditing ? "Atualizar" : "Adicionar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
