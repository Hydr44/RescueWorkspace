import { IconButton } from '@carbon/react';
import { OverflowMenuHorizontal } from '@carbon/icons-react';

// Pannello di dettaglio a destra della lista: codice, nome, righe, due metriche, coppie, attivita', azioni.
export default function DetailPanel({ code, name, lines = [], metrics = [], pairs = [], activity = [], actions }) {
  return (
    <aside className="rm-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="rm-panel__code">{code}</div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {lines.map((l) => <div key={l} className="rm-muted">{l}</div>)}
        </div>
        <IconButton kind="ghost" size="sm" label="Altro"><OverflowMenuHorizontal /></IconButton>
      </div>
      {metrics.length > 0 && (
        <div className="rm-panel__metrics">
          {metrics.map(([lab, val, ctx]) => <div key={lab}><div className="rm-muted">{lab}</div><div className="rm-panel__metric">{val}</div><div className="rm-muted">{ctx}</div></div>)}
        </div>
      )}
      <div>{pairs.map(([k, v]) => <div key={k} className="rm-panel__kv"><span>{k}</span><span>{v}</span></div>)}</div>
      {activity.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div className="rm-muted" style={{ fontWeight: 600 }}>Attività</div>
          <div style={{ marginTop: 6 }}>{activity.map(([t, e]) => <div key={t + e} className="rm-panel__kv" style={{ gridTemplateColumns: '44px 1fr' }}><span>{t}</span><span>{e}</span></div>)}</div>
        </div>
      )}
      {actions && <div className="rm-panel__actions">{actions}</div>}
    </aside>
  );
}
