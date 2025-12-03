// src/components/features/rawMaterials/RawMaterialModal.tsx

import { toast } from "react-hot-toast";
import type { RawMaterial } from "@/types/rawMaterial";
import type { CreateRawMaterialDTO } from "@/api/rawMaterials";
import { Modal } from "@/components/common/Modal";
import { RawMaterialForm } from "./RawMaterialForm";
import { ChangeLogHistory } from "./ChangeLogHistory";
import { Button } from "@/components/common/Button";
import {
  useCreateRawMaterialMutation,
  useUpdateRawMaterialMutation,
} from "@/api/rawMaterials";

interface RawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterial?: RawMaterial | null;
  onOpenLocationModal?: () => void;
}

export function RawMaterialModal({
  isOpen,
  onClose,
  rawMaterial,
  onOpenLocationModal,
}: RawMaterialModalProps) {
  const createMutation = useCreateRawMaterialMutation();
  const updateMutation = useUpdateRawMaterialMutation();

  const isEditing = !!rawMaterial;
  const title = isEditing ? "Editar Produto" : "Adicionar Produto";

  const handleSubmit = async (data: CreateRawMaterialDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: rawMaterial.id,
          payload: data,
        });
        toast.success("Produto atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Produto criado com sucesso");
      }
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao salvar Produto";
      const status = error?.response?.status;

      // CORREÇÃO: Tratamento mais específico de erros
      if (status === 409) {
        // Conflict - pode ser código ou nome de imposto duplicado
        if (message.includes("código")) {
          toast.error("Já existe uma P com este código");
        } else if (message.includes("imposto")) {
          toast.error(message); // Mensagem específica do backend
        } else {
          toast.error(message);
        }
      } else if (status === 400) {
        // Bad Request - erros de validação
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
      } else if (status === 500) {
        // Internal Server Error
        toast.error(
          "Erro interno no servidor. Verifique os dados e tente novamente."
        );
        console.error("Erro 500:", error);
      } else {
        toast.error(message);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-6">
        {/* Formulário */}
        <RawMaterialForm
          rawMaterial={rawMaterial}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onOpenLocationModal={onOpenLocationModal}
        />

        {/* Histórico de mudanças (apenas em edição) */}
        {isEditing && (
          <div className="border-t pt-6">
            <ChangeLogHistory rawMaterialId={rawMaterial.id} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          form="raw-material-form"
          isLoading={isLoading}
        >
          {isEditing ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </Modal>
  );
}
