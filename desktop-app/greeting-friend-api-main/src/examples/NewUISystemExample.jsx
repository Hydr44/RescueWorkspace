// src/examples/NewUISystemExample.jsx
import { useState } from 'react';
import { useModal, useConfirmModal } from '@/components/ui/ModalProvider';
import { useFormValidation, validationRules } from '@/hooks/useFormValidation';
import LoadingButton from '@/components/ui/LoadingButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { useToastContext } from '@/context/ToastContext';

export const NewUISystemExample = () => {
  const { openModal } = useModal();
  const { confirm } = useConfirmModal();
  const { showSuccess, showError } = useToastContext();
  
  // Esempio form con validazione
  const { values, errors, touched, isValid, setValue, setTouchedField } = useFormValidation(
    { name: '', email: '', phone: '', category: '' },
    {
      name: [validationRules.required('Nome obbligatorio')],
      email: [
        validationRules.required('Email obbligatoria'),
        validationRules.email('Email non valida')
      ],
      phone: [validationRules.phone('Telefono non valido')],
      category: [validationRules.required('Categoria obbligatoria')]
    }
  );

  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Form salvato con successo!');
    } catch (error) {
      showError('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const openExampleModal = () => {
    openModal({
      title: 'Esempio Modal',
      size: 'lg',
      children: (
        <div className="space-y-4">
          <p>Questo è un esempio di modal usando il nuovo sistema unificato.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Campo 1"
              placeholder="Inserisci testo..."
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              onBlur={() => setTouchedField('name')}
              error={touched.name ? errors.name : ''}
            />
            <Select
              label="Categoria"
              options={[
                { value: 'cat1', label: 'Categoria 1' },
                { value: 'cat2', label: 'Categoria 2' },
                { value: 'cat3', label: 'Categoria 3' }
              ]}
              value={values.category}
              onChange={(e) => setValue('category', e.target.value)}
              onBlur={() => setTouchedField('category')}
              error={touched.category ? errors.category : ''}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-3">
          <button className="btn btn-outline">Annulla</button>
          <LoadingButton loading={loading} onClick={handleSubmit}>
            Salva
          </LoadingButton>
        </div>
      )
    });
  };

  const handleConfirm = () => {
    confirm({
      title: 'Conferma Eliminazione',
      message: 'Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      variant: 'danger',
      onConfirm: () => {
        showSuccess('Elemento eliminato!');
      },
      onCancel: () => {
        showError('Operazione annullata');
      }
    });
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Nuovo Sistema UI/UX</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Esempi dei nuovi componenti e sistemi implementati.
        </p>
      </div>

      {/* Form con Validazione */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Form con Validazione Inline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome"
            required
            placeholder="Inserisci il nome..."
            value={values.name}
            onChange={(e) => setValue('name', e.target.value)}
            onBlur={() => setTouchedField('name')}
            error={touched.name ? errors.name : ''}
            hint="Il nome sarà visibile pubblicamente"
          />
          <Input
            label="Email"
            required
            type="email"
            placeholder="email@esempio.com"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
            onBlur={() => setTouchedField('email')}
            error={touched.email ? errors.email : ''}
          />
          <Input
            label="Telefono"
            placeholder="+39 123 456 7890"
            value={values.phone}
            onChange={(e) => setValue('phone', e.target.value)}
            onBlur={() => setTouchedField('phone')}
            error={touched.phone ? errors.phone : ''}
          />
          <Select
            label="Categoria"
            required
            options={[
              { value: '', label: 'Seleziona categoria...' },
              { value: 'cat1', label: 'Categoria 1' },
              { value: 'cat2', label: 'Categoria 2' },
              { value: 'cat3', label: 'Categoria 3' }
            ]}
            value={values.category}
            onChange={(e) => setValue('category', e.target.value)}
            onBlur={() => setTouchedField('category')}
            error={touched.category ? errors.category : ''}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <LoadingButton
            loading={loading}
            loadingText="Salvando..."
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Salva Form
          </LoadingButton>
        </div>
      </div>

      {/* Loading States */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Loading States</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <LoadingSpinner size="sm" text="Caricamento..." />
          </div>
          <div className="text-center">
            <LoadingSpinner size="md" color="success" />
          </div>
          <div className="text-center">
            <LoadingSpinner size="lg" color="danger" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <LoadingButton loading={true}>Caricamento...</LoadingButton>
          <LoadingButton loading={false} variant="secondary">Normale</LoadingButton>
        </div>
      </div>

      {/* Skeleton Loading */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Skeleton Loading</h3>
        <div className="space-y-4">
          <Skeleton variant="title" />
          <Skeleton variant="text" lines={3} />
          <div className="flex gap-4">
            <Skeleton variant="avatar" width="40px" height="40px" />
            <div className="flex-1">
              <Skeleton variant="text" lines={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal System */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Sistema Modal</h3>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={openExampleModal}>
            Apri Modal Esempio
          </button>
          <button className="btn btn-danger" onClick={handleConfirm}>
            Conferma Eliminazione
          </button>
        </div>
      </div>
    </div>
  );
};
