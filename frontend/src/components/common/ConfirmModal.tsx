import { Modal } from "./Modal";
import { SecondaryButton } from "./SecondaryButton";
import { Text } from "./Text";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Excluir",
  cancelText = "Cancelar",
  isConfirming = false,
}: ConfirmModalProps) {
  const modalFooter = (
    <div className="flex space-x-3">
      <SecondaryButton
        variant="secondary"
        onClick={onClose}
        disabled={isConfirming}
        type="button"
      >
        {cancelText}
      </SecondaryButton>
      <SecondaryButton
        variant="danger"
        onClick={onConfirm}
        disabled={isConfirming}
        type="button"
      >
        {isConfirming ? "Processando..." : confirmText}
      </SecondaryButton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter}>
      <Text>{message}</Text>
    </Modal>
  );
}
