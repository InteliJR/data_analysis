import { Modal } from "@/components/common/Modal";
import { ProductGroupForm } from "./ProductGroupForm";
import type {
  ProductGroup,
  CreateProductGroupDTO,
  UpdateProductGroupDTO,
} from "@/types/productGroup";

interface ProductGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductGroupDTO | UpdateProductGroupDTO) => void;
  initialData?: ProductGroup;
  isLoading?: boolean;
}

export function ProductGroupModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: ProductGroupModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData ? "Editar Grupo de Estruturas" : "Novo Grupo de Estruturas"
      }
    >
      <ProductGroupForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
