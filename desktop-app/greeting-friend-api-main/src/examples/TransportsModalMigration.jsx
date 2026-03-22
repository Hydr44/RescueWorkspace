// src/examples/TransportsModalMigration.jsx
import { useState } from 'react';
import { useModal } from '@/components/ui/ModalProvider';
import { useFormValidation, validationRules } from '@/hooks/useFormValidation';
import LoadingButton from '@/components/ui/LoadingButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToastContext } from '@/context/ToastContext';

export const TransportsModalMigration = () => {
  const { openModal } = useModal();
  const { showSuccess, showError } = useToastContext();
  
  // Form validation usando il nuovo sistema
  const { values, errors, touched, isValid, setValue, setTouchedField } = useFormValidation(
    {
      cliente: '',
      via: '',
      citta: '',
      cap: '',
      provincia: '',
      stato: 'da fare',
      orario: '',
      autista: '',
      mezzo: '',
      note: ''
    },
    {
      cliente: [validationRules.required('Cliente obbligatorio')],
      via: [validationRules.required('Via obbligatoria')],
      citta: [validationRules.required('Città obbligatoria')],
      cap: [validationRules.cap('CAP non valido')],
      provincia: [validationRules.provincia('Provincia non valida')],
      stato: [validationRules.required('Stato obbligatorio')]
    }
  );

  const [submitting, setSubmitting] = useState(false);

  const openTransportModal = () => {
    openModal({
      title: 'Nuovo Trasporto',
      size: 'lg',
      children: (
        <div className="space-y-4">
          {/* Informazioni Cliente */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Informazioni Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cliente"
                required
                placeholder="Nome cliente..."
                value={values.cliente}
                onChange={(e) => setValue('cliente', e.target.value)}
                onBlur={() => setTouchedField('cliente')}
                error={touched.cliente ? errors.cliente : ''}
              />
            </div>
          </div>

          {/* Indirizzo */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Indirizzo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Via"
                required
                placeholder="Via e numero civico..."
                value={values.via}
                onChange={(e) => setValue('via', e.target.value)}
                onBlur={() => setTouchedField('via')}
                error={touched.via ? errors.via : ''}
              />
              <Input
                label="Città"
                required
                placeholder="Città..."
                value={values.citta}
                onChange={(e) => setValue('citta', e.target.value)}
                onBlur={() => setTouchedField('citta')}
                error={touched.citta ? errors.citta : ''}
              />
              <Input
                label="CAP"
                required
                placeholder="12345"
                value={values.cap}
                onChange={(e) => setValue('cap', e.target.value)}
                onBlur={() => setTouchedField('cap')}
                error={touched.cap ? errors.cap : ''}
                hint="5 cifre"
              />
              <Input
                label="Provincia"
                required
                placeholder="RM"
                value={values.provincia}
                onChange={(e) => setValue('provincia', e.target.value.toUpperCase())}
                onBlur={() => setTouchedField('provincia')}
                error={touched.provincia ? errors.provincia : ''}
                hint="2 lettere"
              />
            </div>
          </div>

          {/* Dettagli Trasporto */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Dettagli Trasporto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Stato"
                required
                options={[
                  { value: 'da fare', label: 'Da fare' },
                  { value: 'in corso', label: 'In corso' },
                  { value: 'completato', label: 'Completato' }
                ]}
                value={values.stato}
                onChange={(e) => setValue('stato', e.target.value)}
                onBlur={() => setTouchedField('stato')}
                error={touched.stato ? errors.stato : ''}
              />
              <Input
                label="Orario"
                type="datetime-local"
                value={values.orario}
                onChange={(e) => setValue('orario', e.target.value)}
              />
              <Input
                label="Autista"
                placeholder="Nome autista..."
                value={values.autista}
                onChange={(e) => setValue('autista', e.target.value)}
              />
              <Input
                label="Mezzo"
                placeholder="Targa o identificativo mezzo..."
                value={values.mezzo}
                onChange={(e) => setValue('mezzo', e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Note"
                placeholder="Note aggiuntive..."
                value={values.note}
                onChange={(e) => setValue('note', e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-3">
          <button 
            className="btn btn-outline"
            onClick={() => {
              // Il modal si chiude automaticamente
              showError('Operazione annullata');
            }}
          >
            Annulla
          </button>
          <LoadingButton
            loading={submitting}
            loadingText="Salvando..."
            onClick={async () => {
              if (!isValid) {
                showError('Compila tutti i campi obbligatori');
                return;
              }
              
              setSubmitting(true);
              try {
                // Simula chiamata API
                await new Promise(resolve => setTimeout(resolve, 2000));
                showSuccess('Trasporto salvato con successo!');
                // Il modal si chiude automaticamente
              } catch (error) {
                showError('Errore durante il salvataggio');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!isValid}
          >
            Salva Trasporto
          </LoadingButton>
        </div>
      )
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Esempio Migrazione Modal Trasporti</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Questo esempio mostra come il modal di trasporti può essere migrato al nuovo sistema unificato.
      </p>
      
      <button 
        className="btn btn-primary"
        onClick={openTransportModal}
      >
        Apri Modal Trasporti (Nuovo Sistema)
      </button>
    </div>
  );
};
