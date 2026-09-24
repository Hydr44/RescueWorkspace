import { useState } from 'react';
import { Button, IconButton } from '@carbon/react';
import { Send, Stop, CheckmarkOutline, InProgress, WarningAlt, ArrowUpRight } from '@carbon/icons-react';
import mark from '../logos/solo-logo-bianco.svg';

// Pezzi della messaggistica di RescueAI, comuni al pannello e alla pagina del consulente ambientale.
// Regole: le risposte dell'assistente sono testo su fondo, senza fumetto; i messaggi dell'utente in un blocco layer-3;
// le attività sugli strumenti e le azioni proposte sono righe e schede neutre, niente animazioni colorate.

export const UserMsg = ({ children }) => <div className="ai-user">{children}</div>;

export function AsstMsg({ children, time }) {
  return (
    <div className="ai-asst">
      <span className="ai-asst__mark"><img src={mark} alt="" /></span>
      <div className="ai-asst__body">{children}{time && <div className="ai-time">{time}</div>}</div>
    </div>
  );
}

// Attività sugli strumenti: "Consultando clienti", con stato a destra come testo.
export function ToolRows({ rows }) {
  return (
    <div className="ai-tools">
      {rows.map(([label, state, summary]) => {
        const Icon = state === 'run' ? InProgress : state === 'err' ? WarningAlt : CheckmarkOutline;
        return <div key={label} className={'ai-tool ' + state}><Icon size={14} /><b>{label}</b>{summary && <span>{summary}</span>}<span className="ai-tool__state">{state === 'run' ? 'in corso' : state === 'err' ? 'non riuscito' : 'fatto'}</span></div>;
      })}
    </div>
  );
}

// Azione proposta: scheda con barretta brand, coppie, Conferma e Annulla. Dopo, stato come testo.
export function Proposal({ title, kv = [], state = 'pending', confirm = 'Conferma', result, onConfirm, onReject }) {
  const done = state !== 'pending';
  return (
    <div className={'ai-prop' + (done ? ' ai-prop--done' : '')}>
      <div className="ai-prop__head">Azione proposta</div>
      <div className="ai-prop__title">{title}</div>
      {kv.length > 0 && <div className="ai-prop__kv">{kv.map(([k, v]) => <><span key={k + 'k'}>{k}</span><span key={k + 'v'}>{v}</span></>)}</div>}
      {state === 'pending' && <div className="ai-prop__acts"><Button size="sm" onClick={onConfirm}>{confirm}</Button><Button kind="tertiary" size="sm" onClick={onReject}>Annulla</Button></div>}
      {state === 'executing' && <div className="ai-prop__state">In corso</div>}
      {state === 'done' && <div className="ai-prop__state">{result || 'Fatto'}</div>}
      {state === 'rejected' && <div className="ai-prop__state">Annullata</div>}
      {state === 'error' && <div className="ai-prop__state" style={{ color: 'var(--danger)' }}>{result || 'Non riuscita'}</div>}
    </div>
  );
}

// Fonti del consulente: titolo, ente e data, una per riga.
export function Sources({ items }) {
  return <div className="ai-src"><div className="ai-src__t">Fonti</div>{items.map(([t, s, href]) => <a key={t} href={href || '#'}>{t}<span>{s}</span></a>)}</div>;
}

// Dati dell'azienda usati per rispondere.
export function DataUsed({ rows }) {
  return <div className="ai-data">{rows.map(([k, v]) => <><span key={k + 'k'}>{k}</span><span key={k + 'v'}>{v}</span></>)}</div>;
}

export function Suggestions({ items, onPick }) {
  return <div className="ai-sugg">{items.map((s) => <button key={s} type="button" onClick={() => onPick?.(s)}>{s}</button>)}</div>;
}

// Campo di scrittura: area di testo che cresce, invio con Invio, a capo con Maiusc Invio; Stop mentre risponde.
export function ChatInput({ placeholder, streaming, onSend, onStop, foot }) {
  const [v, setV] = useState('');
  const send = () => { if (v.trim()) { onSend?.(v.trim()); setV(''); } };
  return (
    <div className="ai-input">
      <div className="ai-input__row">
        <textarea rows={1} value={v} placeholder={placeholder} disabled={streaming} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        {streaming ? <IconButton kind="secondary" size="md" label="Ferma" onClick={onStop} style={{ height: 'auto' }}><Stop /></IconButton> : <IconButton kind="primary" size="md" label="Invia" onClick={send} disabled={!v.trim()} style={{ height: 'auto' }}><Send /></IconButton>}
      </div>
      <div className="ai-input__foot"><span>{streaming ? 'Sta rispondendo. Premi Stop per interrompere.' : 'Invio per mandare, Maiusc Invio per andare a capo'}</span><span>{foot}</span></div>
    </div>
  );
}
