// src/examples/ToastUsageExample.jsx
import { useToastContext } from '@/context/ToastContext';

export const ToastUsageExample = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToastContext();

  const handleSuccess = () => {
    showSuccess('Operazione completata con successo!');
  };

  const handleError = () => {
    showError('Si è verificato un errore durante l\'operazione');
  };

  const handleWarning = () => {
    showWarning('Attenzione: questa azione potrebbe avere conseguenze');
  };

  const handleInfo = () => {
    showInfo('Informazione: processo in corso...');
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Esempi di Notifiche Toast</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleSuccess}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Success Toast
        </button>
        
        <button 
          onClick={handleError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Error Toast
        </button>
        
        <button 
          onClick={handleWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Warning Toast
        </button>
        
        <button 
          onClick={handleInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Info Toast
        </button>
      </div>
    </div>
  );
};
