// src/components/TemplateEditor.jsx
import { useState, useEffect } from 'react';
import { useExportTemplates } from '@/hooks/useExportTemplates';
import { FiSave, FiEye, FiCopy, FiTrash2, FiSettings, FiFileText, FiTable } from 'react-icons/fi';

export default function TemplateEditor({ templateId, onSave, onCancel }) {
  const { templates, updateTemplate, duplicateTemplate, deleteTemplate } = useExportTemplates();
  const [template, setTemplate] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const foundTemplate = templates.find(t => t.id === templateId);
      if (foundTemplate) {
        setTemplate(foundTemplate);
      }
    }
  }, [templateId, templates]);

  const handleSave = async () => {
    if (!template) return;
    
    try {
      setSaving(true);
      await updateTemplate(template.id, {
        name: template.name,
        description: template.description,
        template_config: template.template_config,
        fields_config: template.fields_config,
        styling_config: template.styling_config,
        layout_config: template.layout_config
      });
      
      if (onSave) {
        onSave(template);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Errore nel salvare il template');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    
    try {
      const newName = `${template.name} (Copia)`;
      await duplicateTemplate(template.id, newName);
      alert('Template duplicato con successo!');
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Errore nella duplicazione del template');
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    
    if (confirm('Sei sicuro di voler eliminare questo template?')) {
      try {
        await deleteTemplate(template.id);
        if (onCancel) {
          onCancel();
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Errore nell\'eliminazione del template');
      }
    }
  };

  const updateTemplateConfig = (section, updates) => {
    setTemplate(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  };

  const getDocumentIcon = (documentType) => {
    switch (documentType) {
      case 'pdf':
        return <FiFileText className="w-5 h-5 text-red-600" />;
      case 'csv':
        return <FiTable className="w-5 h-5 text-green-600" />;
      default:
        return <FiFileText className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Template non trovato</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2536] rounded-xl shadow-sm border border-[#243044]">
      {/* Header */}
      <div className="p-6 border-b border-[#243044]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getDocumentIcon(template.document_type)}
            <div>
              <h2 className="text-lg font-semibold text-slate-200">
                {template.name}
              </h2>
              <p className="text-sm text-slate-400">
                {template.description || 'Nessuna descrizione'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDuplicate}
              className="px-3 py-2 text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors flex items-center gap-2"
            >
              <FiCopy className="w-4 h-4" />
              Duplica
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/10/15 transition-colors flex items-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              Elimina
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-[#243044]">
        <div className="flex gap-1">
          {[
            { id: 'config', label: 'Configurazione', icon: FiSettings },
            { id: 'fields', label: 'Campi', icon: FiFileText },
            { id: 'styling', label: 'Stile', icon: FiEye },
            { id: 'layout', label: 'Layout', icon: FiSettings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'config' && (
          <TemplateConfigPanel
            template={template}
            onUpdate={(updates) => updateTemplateConfig('template_config', updates)}
          />
        )}
        
        {activeTab === 'fields' && (
          <FieldsConfigPanel
            template={template}
            onUpdate={(updates) => updateTemplateConfig('fields_config', updates)}
          />
        )}
        
        {activeTab === 'styling' && (
          <StylingConfigPanel
            template={template}
            onUpdate={(updates) => updateTemplateConfig('styling_config', updates)}
          />
        )}
        
        {activeTab === 'layout' && (
          <LayoutConfigPanel
            template={template}
            onUpdate={(updates) => updateTemplateConfig('layout_config', updates)}
          />
        )}
      </div>
    </div>
  );
}

// Componenti per le diverse sezioni di configurazione
function TemplateConfigPanel({ template, onUpdate }) {
  const [config, setConfig] = useState(template.template_config || {});

  useEffect(() => {
    setConfig(template.template_config || {});
  }, [template.template_config]);

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Nome Template
        </label>
        <input
          value={template.name}
          onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536]  text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Descrizione
        </label>
        <textarea
          value={template.description || ''}
          onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536]  text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Configurazione Header */}
      <div className="bg-[#141c27]  rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-200 mb-3">
          Configurazione Header
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.header?.logo?.enabled || false}
              onChange={(e) => updateConfig({
                header: {
                  ...config.header,
                  logo: {
                    ...config.header?.logo,
                    enabled: e.target.checked
                  }
                }
              })}
              className="rounded"
            />
            <label className="text-sm text-slate-300">
              Includi logo aziendale
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.header?.companyInfo?.enabled || false}
              onChange={(e) => updateConfig({
                header: {
                  ...config.header,
                  companyInfo: {
                    ...config.header?.companyInfo,
                    enabled: e.target.checked
                  }
                }
              })}
              className="rounded"
            />
            <label className="text-sm text-slate-300">
              Includi informazioni azienda
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Titolo Documento
            </label>
            <input
              value={config.header?.title?.text || ''}
              onChange={(e) => updateConfig({
                header: {
                  ...config.header,
                  title: {
                    ...config.header?.title,
                    text: e.target.value
                  }
                }
              })}
              className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536]  text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Titolo del documento"
            />
          </div>
        </div>
      </div>

      {/* Configurazione Footer */}
      <div className="bg-[#141c27]  rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-200 mb-3">
          Configurazione Footer
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.footer?.pageNumbers || false}
              onChange={(e) => updateConfig({
                footer: {
                  ...config.footer,
                  pageNumbers: e.target.checked
                }
              })}
              className="rounded"
            />
            <label className="text-sm text-slate-300">
              Includi numeri pagina
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.footer?.legalNotes?.enabled || false}
              onChange={(e) => updateConfig({
                footer: {
                  ...config.footer,
                  legalNotes: {
                    ...config.footer?.legalNotes,
                    enabled: e.target.checked
                  }
                }
              })}
              className="rounded"
            />
            <label className="text-sm text-slate-300">
              Includi note legali
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldsConfigPanel({ template, onUpdate }) {
  const [fieldsConfig, setFieldsConfig] = useState(template.fields_config || {});

  useEffect(() => {
    setFieldsConfig(template.fields_config || {});
  }, [template.fields_config]);

  const updateFieldsConfig = (updates) => {
    const newConfig = { ...fieldsConfig, ...updates };
    setFieldsConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-3">
          Campi Disponibili
        </h3>
        <div className="bg-[#141c27]  rounded-lg p-4">
          <p className="text-sm text-slate-400">
            Configurazione campi per categoria: {template.category}
          </p>
          <div className="mt-3 text-sm text-slate-300">
            {JSON.stringify(fieldsConfig, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function StylingConfigPanel({ template, onUpdate }) {
  const [stylingConfig, setStylingConfig] = useState(template.styling_config || {});

  useEffect(() => {
    setStylingConfig(template.styling_config || {});
  }, [template.styling_config]);

  const updateStylingConfig = (updates) => {
    const newConfig = { ...stylingConfig, ...updates };
    setStylingConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-3">
          Configurazione Stile
        </h3>
        <div className="bg-[#141c27]  rounded-lg p-4">
          <p className="text-sm text-slate-400">
            Configurazione stile per tipo documento: {template.document_type}
          </p>
          <div className="mt-3 text-sm text-slate-300">
            {JSON.stringify(stylingConfig, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutConfigPanel({ template, onUpdate }) {
  const [layoutConfig, setLayoutConfig] = useState(template.layout_config || {});

  useEffect(() => {
    setLayoutConfig(template.layout_config || {});
  }, [template.layout_config]);

  const updateLayoutConfig = (updates) => {
    const newConfig = { ...layoutConfig, ...updates };
    setLayoutConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-200 mb-3">
          Configurazione Layout
        </h3>
        <div className="bg-[#141c27]  rounded-lg p-4">
          <p className="text-sm text-slate-400">
            Configurazione layout per tipo documento: {template.document_type}
          </p>
          <div className="mt-3 text-sm text-slate-300">
            {JSON.stringify(layoutConfig, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}
