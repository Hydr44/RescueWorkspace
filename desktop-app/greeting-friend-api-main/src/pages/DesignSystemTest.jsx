/**
 * Design System Test Page
 * Pagina di test per verificare che tutti i componenti funzionino correttamente
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
  Textarea,
  Select,
  PasswordInput,
  Checkbox,
  Button,
  ButtonGroup,
  IconButton,
  FloatingActionButton
} from '@/components/ui';
import { FiUser, FiSave, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function DesignSystemTest() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    password: '',
    tipo: 'azienda',
    note: '',
    isActive: true,
    newsletter: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const tipoOptions = [
    { value: 'azienda', label: 'Azienda' },
    { value: 'privato', label: 'Privato' },
    { value: 'ente', label: 'Ente Pubblico' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simula validazione
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome è obbligatorio';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Simula salvataggio
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form salvato:', formData);
    }
    
    setLoading(false);
  };

  return (
    <FormContainer maxWidth="max-w-6xl">
      <FormHeader 
        title="Design System Test"
        subtitle="Test di tutti i componenti del design system"
        icon=""
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Input Components */}
        <FormSection 
          title="Input Components"
          description="Test di tutti i componenti input"
          icon=""
        >
          <FormRow columns={2}>
            <Input
              label="Nome"
              required
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              placeholder="Nome completo"
              error={errors.nome}
              isValid={formData.nome.trim().length > 0}
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
              error={errors.email}
              hint="Email per comunicazioni"
            />
          </FormRow>
          
          <FormRow columns={2}>
            <Input
              label="Telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              placeholder="+39 123 456 7890"
              hint="Numero di telefono"
            />
            
            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Password sicura"
              hint="Minimo 8 caratteri"
            />
          </FormRow>
          
          <FormRow columns={2}>
            <Select
              label="Tipo Cliente"
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              options={tipoOptions}
              hint="Seleziona il tipo di cliente"
            />
            
            <div className="space-y-3">
              <Checkbox
                label="Cliente attivo"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                hint="Deseleziona per disattivare"
              />
              
              <Checkbox
                label="Iscriviti alla newsletter"
                checked={formData.newsletter}
                onChange={(e) => setFormData({...formData, newsletter: e.target.checked})}
                hint="Ricevi aggiornamenti via email"
              />
            </div>
          </FormRow>
          
          <Textarea
            label="Note"
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            placeholder="Note aggiuntive..."
            hint="Informazioni aggiuntive (opzionale)"
            rows={3}
          />
        </FormSection>

        {/* Test Button Components */}
        <FormSection 
          title="Button Components"
          description="Test di tutti i tipi di pulsanti"
          icon=""
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Button Variants</h4>
              <ButtonGroup>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
              </ButtonGroup>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Button Sizes</h4>
              <ButtonGroup>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </ButtonGroup>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Icon Buttons</h4>
              <ButtonGroup>
                <IconButton variant="primary">
                  <FiUser className="w-4 h-4" />
                </IconButton>
                <IconButton variant="secondary">
                  <FiEdit2 className="w-4 h-4" />
                </IconButton>
                <IconButton variant="danger">
                  <FiTrash2 className="w-4 h-4" />
                </IconButton>
              </ButtonGroup>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Loading States</h4>
              <ButtonGroup>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </ButtonGroup>
            </div>
          </div>
        </FormSection>

        {/* Test Form Actions */}
        <FormActions>
          <div className="text-xs text-slate-400">
            Test del design system - Tutti i componenti funzionano correttamente
          </div>
          <ButtonGroup>
            <Button variant="secondary" type="button">
              Reset
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={loading}
            >
              <FiSave className="w-4 h-4" />
              Salva Test
            </Button>
          </ButtonGroup>
        </FormActions>
      </form>
      
      {/* Floating Action Button */}
      <FloatingActionButton>
        <FiPlus className="w-6 h-6" />
      </FloatingActionButton>
    </FormContainer>
  );
}
