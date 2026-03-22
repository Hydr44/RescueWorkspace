/**
 * Form Migration Example
 * Esempio di migrazione da form vecchio a nuovo design system
 * 
 * @author haxies
 * @created 2025
 */

import React, { useState } from 'react';
import { 
  FormContainer, 
  FormSection, 
  FormRow, 
  FormActions, 
  FormHeader,
  Input, 
  Select, 
  Textarea, 
  Button,
  Checkbox 
} from '@/components/ui';

// ===== PRIMA (Form Vecchio) =====
function OldClientForm() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefono: '',
    tipo: 'azienda'
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Nuovo Cliente</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome *
            </label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.nome}
              onChange={(e) => setForm({...form, nome: e.target.value})}
              placeholder="Nome cliente"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="email@example.com"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Annulla
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== DOPO (Form Nuovo con Design System) =====
function NewClientForm() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefono: '',
    tipo: 'azienda',
    note: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validazione
    const newErrors = {};
    if (!form.nome.trim()) newErrors.nome = 'Nome è obbligatorio';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email non valida';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Salva cliente
      console.log('Saving client:', form);
    }
    
    setLoading(false);
  };

  const tipoOptions = [
    { value: 'azienda', label: 'Azienda' },
    { value: 'privato', label: 'Privato' },
    { value: 'ente', label: 'Ente Pubblico' }
  ];

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormHeader 
          title="Nuovo Cliente"
          subtitle="Aggiungi un nuovo cliente al sistema"
          icon="👤"
        />
        
        <FormSection 
          title="Informazioni Base"
          description="Dati principali del cliente"
          icon="📋"
        >
          <FormRow columns={2}>
            <Input
              label="Nome Cliente"
              required
              value={form.nome}
              onChange={(e) => setForm({...form, nome: e.target.value})}
              placeholder="Ragione sociale o nome completo"
              error={errors.nome}
              isValid={form.nome.trim().length > 0}
            />
            
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="email@example.com"
              error={errors.email}
              hint="Email per comunicazioni"
            />
          </FormRow>
          
          <FormRow columns={2}>
            <Input
              label="Telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({...form, telefono: e.target.value})}
              placeholder="+39 123 456 7890"
              hint="Numero di telefono principale"
            />
            
            <Select
              label="Tipo Cliente"
              value={form.tipo}
              onChange={(e) => setForm({...form, tipo: e.target.value})}
              options={tipoOptions}
              hint="Categoria del cliente"
            />
          </FormRow>
          
          <Textarea
            label="Note"
            value={form.note}
            onChange={(e) => setForm({...form, note: e.target.value})}
            placeholder="Note aggiuntive sul cliente..."
            hint="Informazioni aggiuntive (opzionale)"
          />
          
          <Checkbox
            label="Cliente attivo"
            checked={form.isActive}
            onChange={(e) => setForm({...form, isActive: e.target.checked})}
            hint="Deseleziona per disattivare il cliente"
          />
        </FormSection>
        
        <FormActions>
          <Button variant="secondary" type="button">
            Annulla
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            loading={loading}
          >
            Salva Cliente
          </Button>
        </FormActions>
      </form>
    </FormContainer>
  );
}

// ===== VANTAGGI DEL NUOVO DESIGN SYSTEM =====
/*
✅ CONSISTENZA: Tutti i form hanno lo stesso aspetto
✅ ACCESSIBILITÀ: Label, hint, errori standardizzati
✅ RIUTILIZZABILITÀ: Componenti riutilizzabili
✅ MANUTENIBILITÀ: Un solo posto per modificare stili
✅ UX MIGLIORE: Feedback visivo coerente
✅ DARK MODE: Supporto automatico
✅ RESPONSIVE: Layout adattivo
✅ VALIDAZIONE: Stati di validazione integrati
✅ ICONE: Icone coerenti per sezioni
✅ SPACING: Spacing standardizzato
*/

export { OldClientForm, NewClientForm };
