import { useState } from 'react';

interface UseModalOptions {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<UseModalOptions>({
    message: '',
  });

  const openModal = (options: UseModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    modalOptions,
    openModal,
    closeModal,
  };
}

