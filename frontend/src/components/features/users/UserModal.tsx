import type { User } from '@/types/user';
import { Modal } from '@/components/common/Modal';
import { UserForm } from './UserForm';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: User;
  onSuccess: () => void;
}

export function UserModal({
  isOpen,
  onClose,
  mode,
  user,
  onSuccess,
}: UserModalProps) {
  const title = mode === 'create' ? 'Adicionar Usuário' : 'Editar Usuário';

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <UserForm
        user={user}
        mode={mode}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}