import { Button, IconButton, TextInput, Select } from '@carbon/react';
import { ArrowLeft } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';

// Pattern "datasheet" delle schede (preso da ClientNew.jsx e vestito con i token Carbon):
// testata, sezioni con barretta, righe a griglia con l'etichetta in cella, conferme neutre, pie' di pagina.

export function DtRoot({ children }) {
  return <div className="dt-root">{children}</div>;
}

// Testata: indietro, provenienza, titolo, descrizione e stato bozza, "Compilato" con barra, azioni.
export function DtHead({ crumb, title, sub, draft, pct, actions, back = -1 }) {
  const nav = useNavigate();
  return (
    <div className="dt-head">
      <IconButton kind="ghost" size="md" label="Indietro" onClick={() => nav(back)}><ArrowLeft /></IconButton>
      <div className="dt-titles">
        {crumb && <div className="rm-muted">{crumb}</div>}
        <h1>{title}</h1>
        <div className="dt-subrow"><span>{sub}</span>{draft && <span className="dt-draft">{draft}</span>}</div>
      </div>
      <div className="dt-actions">
        {pct != null && <div className="dt-pct"><span className="rm-muted">Compilato</span><div className="dt-pctbar"><i style={{ width: pct + '%' }} /></div><span className="rm-muted">{pct}%</span></div>}
        {actions}
      </div>
    </div>
  );
}

export function DtWrap({ children }) { return <div className="dt-wrap">{children}</div>; }

export function DtSection({ title, children }) {
  return <div className="dt-card"><div className="dt-sechead"><span className="dt-bar" /><h2>{title}</h2></div>{children}</div>;
}

// Riga: etichetta nella cella a sinistra (140 px), campo o campi a destra. req = obbligatorio.
export function DtRow({ label, req, wide, children }) {
  return <div className={'dt-row' + (wide ? ' dt-row--full' : '')}><label>{label}{req && <span className="dt-req"> *</span>}</label><div className="dt-fld">{children}</div></div>;
}

export function DtGrid({ children }) { return <div className="dt-grid">{children}</div>; }

// Conferma neutra a riga intera (niente verde). Per gli errori usare DtErr.
export function DtOk({ children }) { return <div className="dt-rowok">{children}</div>; }
export function DtErr({ children }) { return <div className="dt-rowok" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>{children}</div>; }

// Campo senza etichetta propria (l'etichetta e' nella cella).
export const DtInput = ({ mono, className = '', ...p }) => <TextInput hideLabel labelText="" size="md" className={(mono ? 'dt-mono ' : '') + className} {...p} />;
export const DtSelect = ({ children, ...p }) => <Select hideLabel labelText="" size="md" {...p}>{children}</Select>;
export const DtSuffix = ({ children }) => <span className="dt-suffix">{children}</span>;

// Pie' di pagina: scorciatoie a sinistra, le stesse azioni della testata a destra.
export function DtFooter({ hints = [['Ctrl S', 'salva'], ['Esc', 'esci']], actions }) {
  return (
    <div className="dt-footer">
      <div className="dt-hints"><span><span className="dt-req">*</span> obbligatori</span>{hints.map(([k, v]) => <span key={k}><kbd>{k}</kbd> {v}</span>)}</div>
      <div style={{ display: 'flex' }}>{actions}</div>
    </div>
  );
}
