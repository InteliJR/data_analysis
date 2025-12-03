// src/components/features/products/ProductModal.tsx

import { toast } from 'react-hot-toast';
import type { Product } from '@/types/products';
import type { CreateProductDTO } from '@/api/products';
import { Modal } from '@/components/common/Modal';
import { ProductForm } from './ProductForm';
import { Button } from '@/components/common/Button';
import { 
  useCreateProductMutation, 
  useUpdateProductMutation 
} from '@/api/products';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductModal({ 
  isOpen, 
  onClose, 
  product 
}: ProductModalProps) {
  
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();

  const isEditing = !!product;
  const title = isEditing ? 'Editar Estrutura' : 'Adicionar Estrutura';

  const handleSubmit = async (data: CreateProductDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: product.id, 
          payload: data 
        });
        toast.success('Estrutura atualizada com sucesso');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Estrutura criada com sucesso');
      }
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao salvar estrutura';
      toast.error(message);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <ProductForm 
        product={product} 
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          variant="primary"
          form="product-form"
          isLoading={isLoading}
        >
          {isEditing ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </Modal>
  );
}