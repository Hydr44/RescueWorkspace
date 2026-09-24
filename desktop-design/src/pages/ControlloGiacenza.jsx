import { useState } from 'react';
import { Button } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import StatusTabs from '../components/StatusTabs.jsx';
import ListTable, { Two } from '../components/ListTable.jsx';
import DetailPanel from '../components/DetailPanel.jsx';
import Card from '../components/Card.jsx';

// Controllo giacenza: giacenza per codice a sinistra, movimenti del codice selezionato a destra. Corrisponde a src/pages/ControlloGiacenza.jsx.
const COD = [{ c: '16 01 06', d: 'Veicoli fuori uso bonificati', g: '9.480', lim: '9.000', ult: 'oggi', st: 'late', s: 'Sopra il limite' }, { c: '16 01 04*', d: 'Veicoli fuori uso', g: '0', lim: '5.000', ult: 'oggi', st: 'muted', s: 'In regola' }, { c: '16 06 01*', d: 'Batterie al piombo', g: '480', lim: '600', ult: 'ieri', st: 'muted', s: 'In regola' }, { c: '13 02 05*', d: 'Oli minerali per motori', g: '210', lim: '500', ult: 'ieri', st: 'muted', s: 'In regola' }, { c: '16 01 03', d: 'Pneumatici fuori uso', g: '400', lim: '2.000', ult: '19 set', st: 'muted', s: 'In regola' }, { c: '16 01 19', d: 'Plastica', g: '1.240', lim: '1.500', ult: '18 set', st: 'muted', s: 'In regola' }];
const COL = [{ key: 'c', label: 'Codice', width: 100, render: (r) => <span className="rm-mono">{r.c}</span> }, { key: 'd', label: 'Descrizione', render: (r) => <Two a={r.d} b={'ultimo movimento ' + r.ult} /> }, { key: 'g', label: 'Giacenza, kg', width: 110, render: (r) => <Two a={r.g} b={'limite ' + r.lim} /> }, { key: 's', label: 'Stato', width: 120, render: (r) => <span className={'rm-status--' + r.st}>{r.s}</span> }];
export default function ControlloGiacenza() {
  const [sel, setSel] = useState('16 01 06');
  return (
    <div className="rm-split">
      <div className="rm-split__list">
        <PageHeader title="Controllo giacenza" count={12} sub="Ricostruita da tutti i movimenti, aggiornata alle 15:20" actions={<Button size="md" renderIcon={Add}>Nuovo movimento</Button>} />
        <StatusTabs items={[['Tutti', 12], ['Da sistemare', 1], ['Pericolosi', 5]]} />
        <ListTable columns={COL} rows={COD} rowKey="c" selectedKey={sel} onSelect={(r) => setSel(r.c)} selectable={false} footer="Giacenza netta totale 18.640 kg" />
      </div>
      <DetailPanel code="16 01 06" name="Veicoli fuori uso bonificati" lines={['Non pericoloso', 'Limite autorizzato 9.000 kg']}
        metrics={[['Giacenza', '9.480 kg', '480 sopra il limite'], ['Ultimo scarico', '23 set', '4.200 kg a Ecoferro']]}
        pairs={[['Come sistemare', 'Uno scarico di almeno 480 kg o una correzione del carico del 24 settembre'], ['Carichi del mese', '31.200 kg'], ['Scarichi del mese', '30.100 kg']]}
        activity={[['Oggi', 'Carico 1.090 kg, AB 123 CD'], ['23 set', 'Scarico 4.200 kg, FIR 2026-00415'], ['22 set', 'Carico 980 kg, CD 456 EF']]}
        actions={<><Button kind="secondary" size="md">Tutti i movimenti</Button><Button size="md">Nuovo scarico</Button></>} />
    </div>
  );
}
