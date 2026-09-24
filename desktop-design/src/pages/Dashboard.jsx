import { Button } from '@carbon/react';
import { Add, ChevronDown } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';
import { KPI, DA_SISTEMARE, SCADENZE, DETTAGLIO, ANDAMENTO } from '../data/demo.js';

// Pagina iniziale: si intitola con la data, mai "Dashboard".
export default function Dashboard() {
  const nav = useNavigate();
  const mx = Math.max(...ANDAMENTO);
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="rm-page">
      <PageHeader title={'Oggi, ' + oggi} sub="7 trasporti, 2 da assegnare, 1 in ritardo"
        actions={<><Button kind="tertiary" size="md" renderIcon={ChevronDown}>Ultimi 14 giorni</Button><Button size="md" renderIcon={Add} onClick={() => nav('/trasporti/nuovo')}>Nuovo trasporto</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>{KPI.map(([l, v, c]) => <KpiTile key={l} label={l} value={v} context={c} />)}</div>
      <Card title="Trasporti per giorno" extra="ultimi 14 giorni, media 60" style={{ marginBottom: 12 }}>
        <div className="rm-bars">{ANDAMENTO.map((v, i) => <i key={i} className={i === ANDAMENTO.length - 1 ? 'on' : ''} style={{ height: (v / mx) * 100 + '%' }} />)}</div>
        <div className="rm-bars__lab">{ANDAMENTO.map((_, i) => <span key={i}>{11 + i}</span>)}</div>
      </Card>
      <div style={{ display: 'flex', gap: 1, paddingBottom: 16 }}>
        <Card title="Da sistemare" extra={DA_SISTEMARE.length} style={{ flex: 1 }}>
          {DA_SISTEMARE.map(([a, b, c, k]) => <div key={a} className="rm-row"><div><b>{a}</b><div className="rm-muted">{b}</div></div><span className={'rm-status--' + k}>{c}</span></div>)}
        </Card>
        <Card title="Attività recente" extra="oggi" style={{ flex: 1 }}>
          {DETTAGLIO.attivita.map(([t, e]) => <div key={t} className="rm-row"><span>{e}</span><span className="rm-muted">{t}</span></div>)}
        </Card>
        <Card title="Scadenze" extra="7 giorni" style={{ flex: 1 }}>
          {SCADENZE.map(([a, b, c, k]) => <div key={a} className="rm-row"><div><b>{a}</b><div className="rm-muted">{b}</div></div><span className={'rm-status--' + k}>{c}</span></div>)}
        </Card>
      </div>
    </div>
  );
}
