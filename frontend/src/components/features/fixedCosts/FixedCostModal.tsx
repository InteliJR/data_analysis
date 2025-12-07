// src/components/features/fixedCosts/FixedCostModal.tsx

import { toast } from 'react-hot-toast';
import type { FixedCost, FixedCostFormData } from '@/types/fixed_costs';
import { Modal } from '@/components/common/Modal';
import { FixedCostForm } from './FixedCostForm';
import { Button } from '@/components/common/Button';
import { 
  useCreateFixedCostMutation, 
  useUpdateFixedCostMutation 
} from '@/api/fixedCosts';

interface FixedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  cost?: FixedCost | null;
}

export function FixedCostModal({ 
  isOpen, 
  onClose, 
  cost 
}: FixedCostModalProps) {
  
  const createMutation = useCreateFixedCostMutation();
  const updateMutation = useUpdateFixedCostMutation();

  const isEditing = !!cost;
  const title = isEditing ? 'Editar Custo Fixo' : 'Adicionar Custo Fixo';

  const handleSubmit = async (data: FixedCostFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: cost.id, 
          payload: data 
        });
        toast.success('Custo fixo atualizado com sucesso');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Custo fixo criado com sucesso');
      }
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao salvar custo fixo';
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
      <FixedCostForm 
        cost={cost} 
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
          form="fixed-cost-form"
          isLoading={isLoading}
        >
          {isEditing ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </Modal>
  );
}