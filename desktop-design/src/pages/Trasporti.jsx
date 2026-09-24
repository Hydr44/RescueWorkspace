import { useState } from 'react';
import { Button, IconButton, Dropdown } from '@carbon/react';
import { Add, OverflowMenuHorizontal, Phone } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTabs from '../components/StatusTabs.jsx';
import ListTable, { Two, Stato } from '../components/ListTable.jsx';
import DetailPanel from '../components/DetailPanel.jsx';
import { TRASPORTI, STATI, DETTAGLIO } from '../data/demo.js';

const COLONNE = [
  { key: 'ora', label: 'Ora', width: 78, render: (r) => <span className="rm-status--muted">{r.ora}</span> },
  { key: 'targa', label: 'Targa', width: 96, render: (r) => <b>{r.targa}</b> },
  { key: 'cliente', label: 'Cliente', width: 128, render: (r) => <Two a={r.cliente} b={r.tipo} /> },
  { key: 'percorso', label: 'Percorso', width: 148, render: (r) => <Two a={r.da} b={'a ' + r.a} /> },
  { key: 'autista', label: 'Autista', width: 96, render: (r) => r.autista ? <Two a={r.autista} b={r.mezzo} /> : <span className="rm-status--muted">Nessuno</span> },
  { key: 'stato', label: 'Stato', width: 148, render: (r) => <Stato testo={r.stato} sotto={r.sotto} tono={r.tono} /> },
];

export default function Trasporti() {
  const nav = useNavigate();
  const [sel, setSel] = useState('TR0000');
  const [tab, setTab] = useState(0);
  return (
    <div className="rm-split">
      <div className="rm-split__list">
        <PageHeader title="Trasporti" count={TRASPORTI.length + 1} date={<><b>Oggi</b>, mercoledì 24 settembre</>}
          actions={<><Button size="md" renderIcon={Add} onClick={() => nav('/trasporti/nuovo')}>Nuovo trasporto</Button><IconButton kind="secondary" size="md" label="Altro"><OverflowMenuHorizontal /></IconButton></>} />
        <StatusTabs items={STATI} selected={tab} onChange={setTab}
          right={<><Dropdown id="autista" size="sm" label="Autista" items={['Tutti']} style={{ width: 120 }} /><Dropdown id="mezzo" size="sm" label="Mezzo" items={['Tutti']} style={{ width: 110 }} /></>} />
        <ListTable columns={COLONNE} rows={TRASPORTI} selectedKey={sel} onSelect={(r) => setSel(r.id)} footer="7 trasporti, aggiornato alle 14:41" />
      </div>
      <DetailPanel code={DETTAGLIO.targa} name={DETTAGLIO.cliente} lines={DETTAGLIO.righe} metrics={DETTAGLIO.metriche} pairs={DETTAGLIO.coppie} activity={DETTAGLIO.attivita}
        actions={<><Button kind="secondary" size="md" renderIcon={Phone}>Chiama</Button><Button kind="secondary" size="md">WhatsApp</Button><Button size="md">Pratica</Button></>} />
    </div>
  );
}
