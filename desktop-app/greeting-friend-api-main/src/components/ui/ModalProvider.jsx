// src/components/ui/ModalProvider.jsx
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import Modal from './Modal';
import PropTypes from 'prop-types';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  const openModal = useCallback((modalConfig) => {
    const id = Math.random().toString(36).substr(2, 9);
    const modal = {
      id,
      isOpen: true,
      ...modalConfig,
    };
    
    setModals(prev => [...prev, modal]);
    return id;
  }, []);

  const closeModal = useCallback((id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const value = useMemo(() => ({
    openModal,
    closeModal,
    closeAllModals,
    modals,
  }), [openModal, closeModal, closeAllModals, modals]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map(modal => (
        <Modal
          key={modal.id}
          {...modal}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </ModalContext.Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Hook semplificato per modal comuni
export const useConfirmModal = () => {
  const { openModal } = useModal();

  const confirm = useCallback(({
    title = 'Conferma',
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    onConfirm,
    onCancel,
    variant = 'danger'
  }) => {
    return openModal({
      title,
      size: 'sm',
      children: (
        <div className="space-y-4">
          <p className="text-slate-400 ">{message}</p>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              onCancel?.();
              // Il modal si chiude automaticamente
            }}
            className="btn btn-outline"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm?.();
              // Il modal si chiude automaticamente
            }}
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      ),
    });
  }, [openModal]);

  return { confirm };
};
