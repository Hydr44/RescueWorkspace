# 🎨 Nuovo Sistema UI/UX - Guida all'Utilizzo

## 📋 Panoramica

Il nuovo sistema UI/UX include:
- **Sistema Modal Unificato** con provider globale
- **Componenti Loading** con stati integrati
- **Validazione Form Inline** con feedback visivo
- **Componenti UI** riutilizzabili e accessibili

## 🚀 Modal System

### Utilizzo Base

```jsx
import { useModal } from '@/components/ui/ModalProvider';

const MyComponent = () => {
  const { openModal } = useModal();

  const openMyModal = () => {
    openModal({
      title: 'Titolo Modal',
      size: 'lg', // sm, md, lg, xl, full
      children: <div>Contenuto del modal</div>,
      footer: <div>Footer del modal</div>
    });
  };

  return <button onClick={openMyModal}>Apri Modal</button>;
};
```

### Modal di Conferma

```jsx
import { useConfirmModal } from '@/components/ui/ModalProvider';

const MyComponent = () => {
  const { confirm } = useConfirmModal();

  const handleDelete = () => {
    confirm({
      title: 'Conferma Eliminazione',
      message: 'Sei sicuro di voler eliminare questo elemento?',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      variant: 'danger',
      onConfirm: () => {
        // Logica di eliminazione
      }
    });
  };

  return <button onClick={handleDelete}>Elimina</button>;
};
```

## 📝 Form Validation

### Hook useFormValidation

```jsx
import { useFormValidation, validationRules } from '@/hooks/useFormValidation';

const MyForm = () => {
  const { values, errors, touched, isValid, setValue, setTouchedField } = useFormValidation(
    { name: '', email: '' },
    {
      name: [validationRules.required('Nome obbligatorio')],
      email: [
        validationRules.required('Email obbligatoria'),
        validationRules.email('Email non valida')
      ]
    }
  );

  return (
    <form>
      <Input
        label="Nome"
        required
        value={values.name}
        onChange={(e) => setValue('name', e.target.value)}
        onBlur={() => setTouchedField('name')}
        error={touched.name ? errors.name : ''}
      />
    </form>
  );
};
```

### Regole di Validazione Disponibili

- `validationRules.required(message)` - Campo obbligatorio
- `validationRules.email(message)` - Email valida
- `validationRules.phone(message)` - Telefono valido
- `validationRules.cap(message)` - CAP italiano (5 cifre)
- `validationRules.provincia(message)` - Provincia italiana (2 lettere)
- `validationRules.piva(message)` - Partita IVA italiana (11 cifre)
- `validationRules.targa(message)` - Targa italiana
- `validationRules.minLength(min, message)` - Lunghezza minima
- `validationRules.maxLength(max, message)` - Lunghezza massima
- `validationRules.pattern(regex, message)` - Pattern personalizzato

## 🔄 Loading States

### LoadingButton

```jsx
import LoadingButton from '@/components/ui/LoadingButton';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingButton
      loading={loading}
      loadingText="Salvando..."
      onClick={async () => {
        setLoading(true);
        try {
          await saveData();
        } finally {
          setLoading(false);
        }
      }}
    >
      Salva
    </LoadingButton>
  );
};
```

### LoadingSpinner

```jsx
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Diversi formati
<LoadingSpinner size="sm" text="Caricamento..." />
<LoadingSpinner size="md" color="success" />
<LoadingSpinner size="lg" color="danger" />
```

### Skeleton Loading

```jsx
import Skeleton from '@/components/ui/Skeleton';

// Placeholder per contenuti in caricamento
<Skeleton variant="title" />
<Skeleton variant="text" lines={3} />
<Skeleton variant="card" />
```

## 🎯 Componenti UI

### Input con Validazione

```jsx
import Input from '@/components/ui/Input';

<Input
  label="Nome"
  required
  placeholder="Inserisci nome..."
  error={error}
  hint="Il nome sarà visibile pubblicamente"
/>
```

### Select con Validazione

```jsx
import Select from '@/components/ui/Select';

<Select
  label="Categoria"
  options={[
    { value: 'cat1', label: 'Categoria 1' },
    { value: 'cat2', label: 'Categoria 2' }
  ]}
  error={error}
/>
```

## 🔧 Migrazione da Sistema Precedente

### Da Modal Vecchi

**Prima:**
```jsx
const [openModal, setOpenModal] = useState(false);

return (
  <>
    <button onClick={() => setOpenModal(true)}>Apri</button>
    {openModal && (
      <div className="fixed inset-0 z-50">
        {/* Modal implementation */}
      </div>
    )}
  </>
);
```

**Dopo:**
```jsx
const { openModal } = useModal();

const handleOpen = () => {
  openModal({
    title: 'Titolo',
    children: <div>Contenuto</div>
  });
};

return <button onClick={handleOpen}>Apri</button>;
```

### Da Form senza Validazione

**Prima:**
```jsx
const [form, setForm] = useState({ name: '' });
const [errors, setErrors] = useState({});

const validate = () => {
  const newErrors = {};
  if (!form.name) newErrors.name = 'Nome obbligatorio';
  setErrors(newErrors);
};
```

**Dopo:**
```jsx
const { values, errors, touched, setValue, setTouchedField } = useFormValidation(
  { name: '' },
  { name: [validationRules.required('Nome obbligatorio')] }
);
```

## 🎨 Personalizzazione

### Temi e Stili

I componenti utilizzano le classi Tailwind esistenti e sono compatibili con il sistema di dark mode già implementato.

### Estensione Regole Validazione

```jsx
// Aggiungere regole personalizzate
const customRules = {
  ...validationRules,
  customRule: (message) => (value) => {
    // Logica personalizzata
    return value.includes('test') ? message : '';
  }
};
```

## 📱 Responsive Design

Tutti i componenti sono responsive e si adattano automaticamente a diverse dimensioni di schermo.

## ♿ Accessibilità

- Focus management automatico nei modal
- ARIA labels completi
- Navigazione da tastiera
- Supporto screen reader
- Contrasti ottimizzati

## 🚀 Prossimi Passi

1. Migrare gradualmente i modal esistenti
2. Implementare validazione in tutti i form
3. Aggiungere loading states alle operazioni async
4. Utilizzare skeleton loading per migliorare la percezione delle performance
