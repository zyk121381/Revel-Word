import { useState } from 'react';
import { CustomModal } from './CustomModal';

export function useModal() {
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });

  const showConfirm = ({ title, message, onConfirm, onCancel, type = 'warning', confirmText = '确定' }: any) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      isAlert: false,
      onConfirm: () => {
        setModalConfig({ isOpen: false });
        onConfirm();
      },
      onCancel: () => {
        setModalConfig({ isOpen: false });
        if (onCancel) onCancel();
      }
    });
  };

  const showAlert = ({ title, message, type = 'info', onConfirm }: any) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      isAlert: true,
      confirmText: '我知道了',
      onConfirm: () => {
        setModalConfig({ isOpen: false });
        if (onConfirm) onConfirm();
      }
    });
  };

  const ModalComponent = () => <CustomModal {...modalConfig} />;

  return { showConfirm, showAlert, ModalComponent };
}
