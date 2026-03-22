// src/components/ExportTestPanel.jsx
import { useState } from 'react';
import { useOrg } from '@/context/OrgContext';
import { DocumentGenerationService } from '@/lib/services/documentGenerationService';
import { ExportTemplateService } from '@/lib/services/exportTemplateService';
import { FiDownload, FiEye, FiFileText, FiTable, FiFile } from 'react-icons/fi';

export default function ExportTestPanel() {
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [testData, setTestData] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Dati di test per ogni categoria
  const getTestData = (category) => {
    switch (category) {
      case 'transports':
        return [
          {
            id: 'T001',
            cliente: 'Mario Rossi',
            pickup_address: 'Via Roma 123, Milano',
            dropoff_address: 'Via Garibaldi 456, Roma',
            status: 'completato',
            created_at: '2025-01-29T10:00:00Z',
            price_cents: 5000,
            eta_minutes: 120
          },
          {
            id: 'T002',
            cliente: 'Giulia Bianchi',
            pickup_address: 'Corso Italia 789, Napoli',
            dropoff_address: 'Piazza Duomo 321, Firenze',
            status: 'in_corso',
            created_at: '2025-01-29T11:30:00Z',
            price_cents: 7500,
            eta_minutes: 180
          }
        ];
      case 'clients':
        return [
          {
            id: 'C001',
            nome: 'Mario Rossi',
            email: 'mario.rossi@email.it',
            phone: '+39 123 456 7890',
            address: 'Via Roma 123, 20100 Milano',
            created_at: '2025-01-15T09:00:00Z',
            vat_number: 'IT12345678901',
            tax_code: 'RSSMRA80A01H501U'
          },
          {
            id: 'C002',
            nome: 'Giulia Bianchi',
            email: 'giulia.bianchi@email.it',
            phone: '+39 098 765 4321',
            address: 'Corso Italia 456, 80100 Napoli',
            created_at: '2025-01-20T14:30:00Z',
            vat_number: 'IT98765432109',
            tax_code: 'BNCGLA85B42H501X'
          }
        ];
      case 'quotes':
        return [
          {
            id: 'Q001',
            cliente: 'Azienda ABC',
            numero: 'PREV-2025-001',
            data: '2025-01-29',
            importo: 1500.00,
            stato: 'bozza',
            valuta: 'EUR',
            note: 'Preventivo per servizio trasporto'
          },
          {
            id: 'Q002',
            cliente: 'Impresa XYZ',
            numero: 'PREV-2025-002',
            data: '2025-01-28',
            importo: 2300.50,
            stato: 'inviato',
            valuta: 'EUR',
            note: 'Preventivo per demolizione veicolo'
          }
        ];
      default:
        return [];
    }
  };

  const loadTemplates = async () => {
    if (!orgId) return;
    
    try {
      setLoading(true);
      const data = await ExportTemplateService.getAll(orgId);
      setTemplates(data);
      
      if (data.length > 0) {
        setSelectedTemplate(data[0].id);
        const category = data[0].category;
        setTestData(getTestData(category));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTestData(getTestData(template.category));
    }
  };

  const generateDocument = async () => {
    if (!orgId || !selectedTemplate) return;
    
    try {
      setLoading(true);
      
      const document = await DocumentGenerationService.generateDocument({
        templateId: selectedTemplate,
        orgId,
        data: testData,
        fileName: `test_export_${Date.now()}`,
        includeLogo: true,
        includeCompanyInfo: true,
        includeLegalNotes: false
      });
      
      // Scarica documento
      DocumentGenerationService.downloadDocument(document);
      
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Errore nella generazione del documento');
    } finally {
      setLoading(false);
    }
  };

  const previewDocument = async () => {
    if (!orgId || !selectedTemplate) return;
    
    try {
      setLoading(true);
      setPreviewMode(true);
      
      const document = await DocumentGenerationService.generateDocument({
        templateId: selectedTemplate,
        orgId,
        data: testData,
        fileName: `preview_${Date.now()}`,
        includeLogo: true,
        includeCompanyInfo: true,
        includeLegalNotes: false
      });
      
      // Crea URL per preview
      const url = URL.createObjectURL(document.blob);
      
      // Apri in nuova finestra
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Error previewing document:', error);
      alert('Errore nella generazione dell\'anteprima');
    } finally {
      setLoading(false);
      setPreviewMode(false);
    }
  };

  const getDocumentIcon = (documentType) => {
    switch (documentType) {
      case 'pdf':
        return <FiFileText className="w-4 h-4 text-red-600" />;
      case 'csv':
        return <FiTable className="w-4 h-4 text-green-600" />;
      case 'xlsx':
        return <FiFile className="w-4 h-4 text-blue-600" />;
      default:
        return <FiFile className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#1a2536] rounded-xl shadow-sm border border-[#243044] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">
            Test Export Documenti
          </h2>
          <p className="text-sm text-slate-400">
            Testa la generazione di documenti con i tuoi template personalizzati
          </p>
        </div>
        <button
          onClick={loadTemplates}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Caricamento...' : 'Carica Template'}
        </button>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-6">
          {/* Selezione Template */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Seleziona Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536]  text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.document_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Info Template Selezionato */}
          {selectedTemplate && (
            <div className="bg-[#141c27]  rounded-lg p-4">
              {(() => {
                const template = templates.find(t => t.id === selectedTemplate);
                return template ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(template.document_type)}
                      <span className="font-medium text-slate-200">
                        {template.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Categoria: {template.category}</span>
                      <span>Tipo: {template.document_type}</span>
                      <span>Versione: {template.version}</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Dati di Test */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dati di Test
            </label>
            <div className="bg-[#141c27]  rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">
                {testData.length} record di test per categoria "{templates.find(t => t.id === selectedTemplate)?.category}"
              </div>
              <div className="space-y-2">
                {testData.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    {Object.entries(item).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="mr-4">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </span>
                    ))}
                    {Object.keys(item).length > 3 && '...'}
                  </div>
                ))}
                {testData.length > 3 && (
                  <div className="text-sm text-slate-500">
                    ... e altri {testData.length - 3} record
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex gap-3">
            <button
              onClick={previewDocument}
              disabled={loading || !selectedTemplate}
              className="px-4 py-2 bg-[#243044] text-white rounded-lg hover:bg-[#1a2536] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <FiEye className="w-4 h-4" />
              {previewMode ? 'Generando...' : 'Anteprima'}
            </button>
            <button
              onClick={generateDocument}
              disabled={loading || !selectedTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              {loading ? 'Generando...' : 'Scarica Documento'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiFileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">
            Nessun template disponibile. Carica i template per iniziare il test.
          </p>
        </div>
      )}
    </div>
  );
}
