import { Button } from '@carbon/react';
import { Send, Download } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';
import ListTable from '../components/ListTable.jsx';

// MUD: riepilogo per codice EER dell'anno e stato della dichiarazione. Corrisponde a src/pages/RifiutiMud.jsx.
const RIGHE = [
  { c: '16 01 04*', d: 'Veicoli fuori uso', car: '412.300', sca: '0', gia: '0', filiera: 'Veicoli fuori uso' },
  { c: '16 01 06', d: 'Veicoli fuori uso bonificati', car: '318.900', sca: '309.400', gia: '9.480', filiera: 'Veicoli fuori uso' },
  { c: '13 02 05*', d: 'Oli minerali per motori', car: '1.420', sca: '1.210', gia: '210', filiera: 'Rifiuti' },
  { c: '16 06 01*', d: 'Batterie al piombo', car: '5.880', sca: '5.400', gia: '480', filiera: 'Rifiuti' },
  { c: '16 01 03', d: 'Pneumatici fuori uso', car: '11.200', sca: '10.800', gia: '400', filiera: 'Rifiuti' },
];
const COL = [{ key: 'c', label: 'Codice EER', width: 110, render: (r) => <span className="rm-mono">{r.c}</span> }, { key: 'd', label: 'Descrizione' }, { key: 'filiera', label: 'Sezione filiera', width: 150 }, { key: 'car', label: 'Carico, kg', width: 110 }, { key: 'sca', label: 'Scarico, kg', width: 110 }, { key: 'gia', label: 'Giacenza, kg', width: 110 }];
export default function Mud() {
  return (
    <div className="rm-page">
      <PageHeader title="MUD 2026" sub="Modello unico di dichiarazione ambientale, anno di riferimento 2025" actions={<><Button kind="tertiary" size="md" renderIcon={Download}>Scarica bozza</Button><Button size="md" renderIcon={Send}>Invia a MudComuni</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="Scadenza presentazione" value="30 aprile" context="tra 218 giorni" /><KpiTile label="Codici da dichiarare" value="12" context="5 pericolosi" /><KpiTile label="Quantità totale" value="749,7 t" context="carico dell'anno" /><KpiTile label="Stato" value="Bozza" context="2 modifiche richieste dallo staff" />
      </div>
      <Card title="Modifiche richieste dallo staff" extra="2" style={{ marginBottom: 12 }}>
        <div className="rm-row"><div><b>16 01 06, giacenza sopra il limite autorizzato</b><div className="rm-muted">9.480 kg su 9.000. Serve uno scarico o una correzione prima dell'invio.</div></div><span className="rm-status--late">da sistemare</span></div>
        <div className="rm-row"><div><b>Destinatario Ecoferro S.r.l. senza numero di autorizzazione</b><div className="rm-muted">Compare in 14 formulari.</div></div><span className="rm-status--late">da sistemare</span></div>
      </Card>
      <ListTable columns={COL} rows={RIGHE} rowKey="c" selectable={false} footer="12 codici, 5 pericolosi, 749,7 tonnellate in carico" />
    </div>
  );
}
