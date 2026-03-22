/**
 * Componenti UI avanzati per sistema RVFU
 * Componenti riutilizzabili con validazione integrata
 */

import React, { useState, useEffect } from 'react';
import { 
  FiCheck, 
  FiX, 
  FiAlertCircle, 
  FiInfo, 
  FiUpload, 
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUser,
  FiTruck,
  FiFileText,
  FiShield,
  FiImage,
  FiFolder
} from 'react-icons/fi';
import PropTypes from 'prop-types';

// ============================================================================
// COMPONENTI BASE
// ============================================================================

/**
 * Input con validazione real-time
 */
export const ValidatedInput = React.forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const inputClasses = `
    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
    ${error 
      ? 'border-red-500 bg-red-500/10 text-red-900' 
      : success 
        ? 'border-green-500 bg-green-500/10 text-green-900'
        : isFocused 
          ? 'border-indigo-500 bg-[#1a2536] text-slate-200'
          : 'border-[#243044] bg-[#141c27] text-slate-200'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#243044]'}
    ${Icon ? 'pl-12' : ''}
    ${className}
  `.trim();

  const labelClasses = `
    block text-sm font-medium mb-2 transition-colors duration-200
    ${error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-300'}
  `.trim();

  return (
    <div className="relative">
      <label className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className={`
            absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5
            ${error ? 'text-red-500' : success ? 'text-green-500' : 'text-slate-500'}
          `} />
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {success && (
          <FiCheck className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
        
        {error && (
          <FiX className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <FiAlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <FiCheck className="h-4 w-4 mr-1" />
          {success}
        </div>
      )}
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';
ValidatedInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  success: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  icon: PropTypes.elementType,
  className: PropTypes.string
};

/**
 * Select con validazione
 */
export const ValidatedSelect = ({
  label,
  options,
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  placeholder = 'Seleziona...',
  icon: Icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const selectClasses = `
    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
    ${error 
      ? 'border-red-500 bg-red-500/10 text-red-900' 
      : success 
        ? 'border-green-500 bg-green-500/10 text-green-900'
        : isFocused 
          ? 'border-indigo-500 bg-[#1a2536] text-slate-200'
          : 'border-[#243044] bg-[#141c27] text-slate-200'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#243044]'}
    ${Icon ? 'pl-12' : ''}
    ${className}
  `.trim();

  const labelClasses = `
    block text-sm font-medium mb-2 transition-colors duration-200
    ${error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-300'}
  `.trim();

  return (
    <div className="relative">
      <label className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className={`
            absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5
            ${error ? 'text-red-500' : success ? 'text-green-500' : 'text-slate-500'}
          `} />
        )}
        
        <select
          value={value || ''}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={selectClasses}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {success && (
          <FiCheck className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
        
        {error && (
          <FiX className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <FiAlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <FiCheck className="h-4 w-4 mr-1" />
          {success}
        </div>
      )}
    </div>
  );
};

ValidatedSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  success: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string
};

/**
 * Textarea con validazione
 */
export const ValidatedTextarea = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  rows = 4,
  icon: Icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const textareaClasses = `
    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 resize-none
    ${error 
      ? 'border-red-500 bg-red-500/10 text-red-900' 
      : success 
        ? 'border-green-500 bg-green-500/10 text-green-900'
        : isFocused 
          ? 'border-indigo-500 bg-[#1a2536] text-slate-200'
          : 'border-[#243044] bg-[#141c27] text-slate-200'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#243044]'}
    ${Icon ? 'pl-12' : ''}
    ${className}
  `.trim();

  const labelClasses = `
    block text-sm font-medium mb-2 transition-colors duration-200
    ${error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-300'}
  `.trim();

  return (
    <div className="relative">
      <label className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className={`
            absolute left-4 top-4 h-5 w-5
            ${error ? 'text-red-500' : success ? 'text-green-500' : 'text-slate-500'}
          `} />
        )}
        
        <textarea
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          rows={rows}
          className={textareaClasses}
          {...props}
        />
        
        {success && (
          <FiCheck className="absolute right-4 top-4 h-5 w-5 text-green-500" />
        )}
        
        {error && (
          <FiX className="absolute right-4 top-4 h-5 w-5 text-red-500" />
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <FiAlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <FiCheck className="h-4 w-4 mr-1" />
          {success}
        </div>
      )}
    </div>
  );
};

ValidatedTextarea.propTypes = {
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  success: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  icon: PropTypes.elementType,
  className: PropTypes.string
};

// ============================================================================
// COMPONENTI SPECIALIZZATI
// ============================================================================

/**
 * Uploader di documenti con preview
 */
export const DocumentUploader = ({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024, // 10MB
  onUpload,
  onRemove,
  documents = [],
  error,
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    setUploadError('');
    
    files.forEach(file => {
      if (file.size > maxSize) {
        setUploadError(`File ${file.name} troppo grande (max ${maxSize / 1024 / 1024}MB)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const document = {
          id: Date.now().toString(),
          nome: file.name,
          tipo: file.type,
          dimensione: file.size,
          contenuto: e.target.result,
          dataCaricamento: new Date().toISOString()
        };
        
        onUpload?.(document);
      };
      reader.readAsDataURL(file);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FiFileText className="h-5 w-5 text-red-500" />;
    if (type.includes('image')) return <FiImage className="h-5 w-5 text-blue-500" />;
    return <FiFolder className="h-5 w-5 text-slate-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200
          ${isDragging 
            ? 'border-indigo-500 bg-blue-500/10' 
            : error 
              ? 'border-red-500/20 bg-red-500/10'
              : 'border-[#243044] bg-[#141c27] hover:border-[#243044]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <FiUpload className="mx-auto h-12 w-12 text-slate-500 mb-4" />
        <p className="text-sm text-slate-400">
          Trascina i file qui o{' '}
          <span className="text-indigo-600 font-medium">clicca per selezionare</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Formati supportati: PDF, JPG, PNG (max {maxSize / 1024 / 1024}MB)
        </p>
        
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
      
      {/* Error Messages */}
      {(error || uploadError) && (
        <div className="flex items-center text-sm text-red-600">
          <FiAlertCircle className="h-4 w-4 mr-1" />
          {error || uploadError}
        </div>
      )}
      
      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Documenti caricati:</h4>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-[#1a2536] border border-[#243044] rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">{getFileIcon(doc.tipo)}</div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{doc.nome}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(doc.dimensione)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onRemove?.(doc.id)}
                  className="p-1 text-red-500 hover:text-red-400 transition-colors"
                  disabled={disabled}
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

DocumentUploader.propTypes = {
  label: PropTypes.string.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  onUpload: PropTypes.func,
  onRemove: PropTypes.func,
  documents: PropTypes.array,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

/**
 * Card per stato VFU
 */
export const StatoVfuCard = ({
  stato,
  numeroVFU,
  targa,
  dataCreazione,
  centroRaccolta,
  onClick,
  className = ''
}) => {
  const getStatoColor = (stato) => {
    const colors = {
      'CONFERITO': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'TRASFERITO': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'PRESO_IN_CARICO': 'bg-green-500/10 text-green-400 border-green-500/20',
      'VALIDATO': 'bg-emerald-500/10 text-emerald-400 border-emerald-200',
      'DA_RADIARE': 'bg-orange-500/10 text-orange-400 border-orange-200',
      'INVIATO_A_STA': 'bg-purple-500/10 text-purple-400 border-purple-200',
      'RADIATO': 'bg-red-500/10 text-red-400 border-red-500/20',
      'DEMOLITO': 'bg-[#141c27] text-slate-200 border-[#243044]'
    };
    return colors[stato] || 'bg-[#141c27] text-slate-200 border-[#243044]';
  };

  const getStatoIcon = (stato) => {
    const icons = {
      'CONFERITO': FiInfo,
      'TRASFERITO': FiTruck,
      'PRESO_IN_CARICO': FiShield,
      'VALIDATO': FiCheck,
      'DA_RADIARE': FiAlertCircle,
      'INVIATO_A_STA': FiUpload,
      'RADIATO': FiX,
      'DEMOLITO': FiTrash2
    };
    return icons[stato] || FiInfo;
  };

  const StatoIcon = getStatoIcon(stato);

  return (
    <div
      className={`
        p-4 bg-[#1a2536] border border-[#243044] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200
        ${onClick ? 'cursor-pointer hover:border-indigo-300' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <StatoIcon className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-200">{numeroVFU}</h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-slate-400">
              <span className="font-medium">Targa:</span> {targa}
            </p>
            <p className="text-sm text-slate-400">
              <span className="font-medium">Centro:</span> {centroRaccolta}
            </p>
            <p className="text-sm text-slate-400">
              <span className="font-medium">Data:</span> {new Date(dataCreazione).toLocaleDateString('it-IT')}
            </p>
          </div>
        </div>
        
        <div className="ml-4">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
            ${getStatoColor(stato)}
          `}>
            {stato.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};

StatoVfuCard.propTypes = {
  stato: PropTypes.string.isRequired,
  numeroVFU: PropTypes.string.isRequired,
  targa: PropTypes.string.isRequired,
  dataCreazione: PropTypes.string.isRequired,
  centroRaccolta: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string
};

/**
 * Filtri di ricerca avanzati
 */
export const FiltriRicerca = ({
  filtri,
  onFiltriChange,
  onReset,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statiOptions = [
    { value: 'CONFERITO', label: 'Conferito' },
    { value: 'TRASFERITO', label: 'Trasferito' },
    { value: 'PRESO_IN_CARICO', label: 'Preso in carico' },
    { value: 'VALIDATO', label: 'Validato' },
    { value: 'DA_RADIARE', label: 'Da radiare' },
    { value: 'INVIATO_A_STA', label: 'Inviato a STA' },
    { value: 'RADIATO', label: 'Radiato' },
    { value: 'DEMOLITO', label: 'Demolito' }
  ];

  return (
    <div className={`bg-[#1a2536] border border-[#243044] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Filtri di ricerca</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-indigo-600 hover:text-blue-400"
        >
          <FiFilter className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isExpanded ? 'Nascondi' : 'Mostra'} filtri
          </span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Stato */}
            <ValidatedSelect
              label="Stato VFU"
              options={statiOptions}
              value={filtri.stato || ''}
              onChange={(e) => onFiltriChange({ ...filtri, stato: e.target.value })}
              placeholder="Tutti gli stati"
              icon={FiShield}
            />
            
            {/* Targa */}
            <ValidatedInput
              label="Targa"
              placeholder="es. AB123CD"
              value={filtri.targa || ''}
              onChange={(e) => onFiltriChange({ ...filtri, targa: e.target.value })}
              icon={FiTruck}
            />
            
            {/* Telaio */}
            <ValidatedInput
              label="Telaio"
              placeholder="es. 1HGBH41JXMN109186"
              value={filtri.telaio || ''}
              onChange={(e) => onFiltriChange({ ...filtri, telaio: e.target.value })}
              icon={FiTruck}
            />
            
            {/* Data Da */}
            <ValidatedInput
              label="Data da"
              type="date"
              value={filtri.dataDa || ''}
              onChange={(e) => onFiltriChange({ ...filtri, dataDa: e.target.value })}
              icon={FiCalendar}
            />
            
            {/* Data A */}
            <ValidatedInput
              label="Data a"
              type="date"
              value={filtri.dataA || ''}
              onChange={(e) => onFiltriChange({ ...filtri, dataA: e.target.value })}
              icon={FiCalendar}
            />
            
            {/* Centro Raccolta */}
            <ValidatedInput
              label="Centro Raccolta"
              placeholder="Codice centro"
              value={filtri.centroRaccolta || ''}
              onChange={(e) => onFiltriChange({ ...filtri, centroRaccolta: e.target.value })}
              icon={FiUser}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#141c27] transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Applica filtri
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

FiltriRicerca.propTypes = {
  filtri: PropTypes.object.isRequired,
  onFiltriChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  className: PropTypes.string
};
