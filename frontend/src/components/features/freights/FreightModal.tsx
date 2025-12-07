// src/components/features/freights/FreightModal.tsx

import { toast } from 'react-hot-toast';
import type { Freight } from '@/types/freights';
import type { CreateFreightDTO } from '@/api/freights';
import { Modal } from '@/components/common/Modal';
import { FreightForm } from './FreightForm';
import { Button } from '@/components/common/Button';
import { 
  useCreateFreightMutation, 
  useUpdateFreightMutation 
} from '@/api/freights';

interface FreightModalProps {
  isOpen: boolean;
  onClose: () => void;
  freight?: Freight | null;
}

export function FreightModal({ 
  isOpen, 
  onClose, 
  freight 
}: FreightModalProps) {
  
  const createMutation = useCreateFreightMutation();
  const updateMutation = useUpdateFreightMutation();

  const isEditing = !!freight;
  const title = isEditing ? 'Editar Frete' : 'Adicionar Frete';

  const handleSubmit = async (data: CreateFreightDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: freight.id, 
          payload: data 
        });
        toast.success('Frete atualizado com sucesso');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Frete criado com sucesso');
      }
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao salvar frete';
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
      <FreightForm 
        freight={freight} 
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
          form="freight-form"
          isLoading={isLoading}
        >
          {isEditing ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </Modal>
  );
}