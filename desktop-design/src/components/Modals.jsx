import { ComposedModal, ModalHeader, ModalBody, ModalFooter, Button, IconButton, TextInput } from '@carbon/react';
import { Close, Search } from '@carbon/icons-react';
import { useState } from 'react';

// Le finestre dell'app sono di tre tipi, e basta:
// 1. Confirm: una domanda, una riga di conseguenze, eventualmente i dati di cosa si sta per fare, due pulsanti. Per eliminare, annullare, inviare.
// 2. Picker: cerca e scegli (un cliente, un articolo, un mezzo). Campo di ricerca in testa, elenco sotto, si sceglie con un clic.
// 3. Sheet: scheda laterale che si apre da destra per modificare o creare una cosa piccola (preset, indirizzo, zona, riga di listino).
//    Dentro c'e' il datasheet, come nelle schede grandi. Sostituisce le modali con i campi impilati.
// Corrisponde a src/components/Modal.jsx e alle 50 ComposedModal sparse nelle pagine.

// Conferma. danger = azione che non si annulla: il pulsante e' rosso a bordo, non pieno (niente rosso pieno nel sistema).
export function Confirm({ open, title, text, kv, confirm = 'Conferma', danger, onConfirm, onClose }) {
  return (
    <ComposedModal open={open} onClose={() => { onClose?.(); return true; }} size="sm" className="rm-confirm">
      <ModalHeader title={title} closeModal={onClose} iconDescription="Chiudi" />
      <ModalBody>
        {text && <p style={{ margin: 0, lineHeight: 1.5 }}>{text}</p>}
        {kv && <div className="rm-confirm__kv">{kv.map(([k, v]) => <div key={k}><span>{k}</span><span>{v}</span></div>)}</div>}
      </ModalBody>
      <ModalFooter><Button kind="secondary" onClick={onClose}>Annulla</Button><Button kind={danger ? 'danger--tertiary' : 'primary'} onClick={onConfirm}>{confirm}</Button></ModalFooter>
    </ComposedModal>
  );
}

// Scelta da un elenco con ricerca. rows: [{ id, a, b, right }]
export function Picker({ open, title, sub, placeholder = 'Cerca', rows = [], selected, onPick, onClose, onNew }) {
  const [q, setQ] = useState('');
  const vis = rows.filter((r) => !q || (r.a + ' ' + (r.b || '')).toLowerCase().includes(q.toLowerCase()));
  return (
    <ComposedModal open={open} onClose={() => { onClose?.(); return true; }} size="md" className="rm-picker">
      <ModalHeader title={title} label={sub} closeModal={onClose} iconDescription="Chiudi" />
      <ModalBody>
        <TextInput id="pk" labelText="" hideLabel placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="rm-picker__list">
          {vis.map((r) => <div key={r.id} className={'rm-picker__row' + (r.id === selected ? ' on' : '')} onClick={() => onPick?.(r)}><div><div>{r.a}</div>{r.b && <div className="rm-muted">{r.b}</div>}</div><div className="rm-muted" style={{ textAlign: 'right', fontSize: 12.5 }}>{r.right}</div></div>)}
          {vis.length === 0 && <div className="rm-muted" style={{ padding: 16 }}>Nessun risultato per "{q}".</div>}
        </div>
      </ModalBody>
      <ModalFooter>{onNew && <Button kind="secondary" onClick={onNew}>Nuovo</Button>}<Button kind="secondary" onClick={onClose}>Annulla</Button></ModalFooter>
    </ComposedModal>
  );
}

// Scheda laterale per modificare o creare. children = sezioni e righe del datasheet.
export function Sheet({ open, title, sub, children, actions, hints = [['Ctrl S', 'salva'], ['Esc', 'chiudi']], onClose }) {
  if (!open) return null;
  return (
    <div className="rm-sheet" onClick={onClose}>
      <div className="rm-sheet__panel dt-root" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="rm-sheet__head"><div style={{ flex: 1 }}><h2>{title}</h2>{sub && <div className="rm-muted">{sub}</div>}</div><IconButton kind="ghost" size="md" label="Chiudi" onClick={onClose}><Close /></IconButton></div>
        <div className="rm-sheet__body">{children}</div>
        <div className="rm-sheet__foot"><div className="dt-hints">{hints.map(([k, v]) => <span key={k}><kbd>{k}</kbd> {v}</span>)}</div><div style={{ display: 'flex' }}>{actions}</div></div>
      </div>
    </div>
  );
}
