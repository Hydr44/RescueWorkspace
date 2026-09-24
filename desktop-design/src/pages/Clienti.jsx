import { useState } from 'react';
import { Button, Dropdown } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTabs from '../components/StatusTabs.jsx';
import ListTable, { Two } from '../components/ListTable.jsx';
import { CLIENTI } from '../data/demo.js';

const COLONNE = [
  { key: 'nome', label: 'Cliente', width: 220, render: (r) => <Two a={<b>{r.nome}</b>} b={r.tipo} /> },
  { key: 'codice', label: 'Codice', width: 100, render: (r) => <span className="rm-mono">{r.codice}</span> },
  { key: 'contatti', label: 'Contatti', width: 200, render: (r) => <Two a={r.tel} b={r.email || 'Nessuna email'} /> },
  { key: 'citta', label: 'Città', width: 100 },
  { key: 'pratiche', label: 'Pratiche', width: 90, render: (r) => <Two a={r.pratiche} b={'ultima ' + r.ultimo} /> },
];

export default function Clienti() {
  const nav = useNavigate();
  const [sel, setSel] = useState(null);
  return (
    <div className="rm-page">
      <PageHeader title="Clienti" count={CLIENTI.length} actions={<Button size="md" renderIcon={Add} onClick={() => nav('/clienti/nuovo')}>Nuovo cliente</Button>} />
      <StatusTabs items={[['Tutti', 6], ['Aziende', 2], ['Privati', 3], ['Convenzioni', 1]]} right={<Dropdown id="citta" size="sm" label="Città" items={['Tutte']} style={{ width: 120 }} />} />
      <ListTable columns={COLONNE} rows={CLIENTI} rowKey="codice" selectedKey={sel} onSelect={(r) => setSel(r.codice)} footer="6 clienti" />
    </div>
  );
}
