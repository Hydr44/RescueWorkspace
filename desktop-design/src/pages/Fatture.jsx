import { useState } from 'react';
import { Button, IconButton, Dropdown } from '@carbon/react';
import { Add, OverflowMenuHorizontal, Send, Download, Email, Checkmark } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTabs from '../components/StatusTabs.jsx';
import ListTable, { Two, Stato } from '../components/ListTable.jsx';
import DetailPanel from '../components/DetailPanel.jsx';

// Fatture: una lista sola con i tab di stato al posto di sei pagine (elenco, pagamenti, scadenzario, storico, invio SDI).
// Il pannello a destra e' la fattura selezionata: stato SDI, incasso, documenti, azioni. Con piu' righe selezionate diventa la barra delle azioni di gruppo.
// Corrisponde a src/pages/Invoices.jsx, InvoicePayments.jsx, InvoiceScadenzario.jsx, SdiBulkSend.jsx.
const RIGHE = [
  { n: '2026/0142', data: '23 set', cliente: 'Autofficina Vella S.r.l.', per: 'Soccorso CT 118 MM, pratica TR0000', tot: '181,78', inc: 'Da incassare', incs: 'scade il 23 ottobre', tono: 'muted', sdi: 'Consegnata', sdit: 'muted' },
  { n: '2026/0141', data: '22 set', cliente: 'Europ Assistance', per: '6 soccorsi di settembre, convenzione', tot: '2.380,00', inc: 'Da incassare', incs: 'scade il 22 ottobre', tono: 'muted', sdi: 'In attesa di ricevuta', sdit: 'muted' },
  { n: '2026/0140', data: '22 set', cliente: 'Mario Bianchi', per: 'Soccorso GA 512 PM, pratica TR0001', tot: '103,16', inc: 'Incassata', incs: 'contanti, 22 settembre', tono: 'muted', sdi: 'Scartata', sdit: 'late', sdis: 'codice fiscale errato' },
  { n: '2026/0139', data: '20 set', cliente: 'Carrozzeria Di Dio', per: 'Trasporto DA 331 HG', tot: '366,00', inc: 'Da incassare', incs: 'scade domani', tono: 'new', sdi: 'Consegnata', sdit: 'muted' },
  { n: '2026/0131', data: '8 set', cliente: 'Carrozzeria Di Dio', per: '2 trasporti di agosto', tot: '366,00', inc: 'Da incassare', incs: 'scade domani', tono: 'new', sdi: 'Consegnata', sdit: 'muted' },
  { n: '2026/0104', data: '12 ago', cliente: 'Europ Assistance', per: 'Pratica PR-104', tot: '1.240,00', inc: 'Scaduta da 12 giorni', incs: 'sollecito inviato oggi', tono: 'late', sdi: 'Consegnata', sdit: 'muted' },
  { n: 'Bozza', data: 'oggi', cliente: 'Autofficina Vella S.r.l.', per: 'Custodia settembre', tot: '121,46', inc: 'Non emessa', incs: '', tono: 'muted', sdi: 'Da inviare', sdit: 'muted' },
];
const COL = [
  { key: 'n', label: 'Numero', width: 96, render: (r) => <Two a={<b>{r.n}</b>} b={r.data} /> },
  { key: 'cliente', label: 'Cliente', width: 170, render: (r) => <Two a={r.cliente} b={r.per} /> },
  { key: 'tot', label: 'Totale', width: 96, render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.tot} euro</span> },
  { key: 'inc', label: 'Incasso', width: 150, render: (r) => <Stato testo={r.inc} sotto={r.incs} tono={r.tono} /> },
  { key: 'sdi', label: 'Sistema di interscambio', width: 150, render: (r) => <Stato testo={r.sdi} sotto={r.sdis} tono={r.sdit} /> },
];
export default function Fatture() {
  const nav = useNavigate();
  const [sel, setSel] = useState('2026/0104');
  const [tab, setTab] = useState(0);
  const r = RIGHE.find((x) => x.n === sel);
  return (
    <div className="rm-split">
      <div className="rm-split__list">
        <PageHeader title="Fatture" count={41} date={<><b>Settembre</b> 2026</>} actions={<><Button size="md" renderIcon={Add} onClick={() => nav('/fatture/nuova')}>Nuova fattura</Button><IconButton kind="secondary" size="md" label="Altro"><OverflowMenuHorizontal /></IconButton></>} />
        <StatusTabs items={[['Emesse', 41], ['Da incassare', 11], ['Scadute', 1], ['Bozze', 1], ['Ricevute', 9]]} selected={tab} onChange={setTab}
          right={<><Dropdown id="cl" size="sm" label="Cliente" items={['Tutti']} style={{ width: 130 }} /><Dropdown id="sdi" size="sm" label="Stato SDI" items={['Tutti']} style={{ width: 120 }} /></>} />
        <ListTable columns={COL} rows={RIGHE} rowKey="n" selectedKey={sel} onSelect={(x) => setSel(x.n)} footer="41 fatture emesse a settembre, 14.620 euro. Sintesi, chiusura IVA e registri in Contabilità." />
      </div>
      <DetailPanel code={'Fattura ' + r.n} name={r.cliente} lines={[r.per, r.data === 'oggi' ? 'Bozza di oggi' : 'Emessa il ' + r.data + ' 2026']}
        metrics={[['Totale', r.tot + ' euro', 'IVA compresa'], ['Incasso', r.tono === 'late' ? 'Scaduta' : r.inc === 'Incassata' ? 'Fatta' : 'Aperta', r.incs || 'da emettere']]}
        pairs={[['Sistema di interscambio', r.sdi + (r.sdis ? ', ' + r.sdis : '')], ['Pagamento', 'Bonifico a 30 giorni'], ['Documenti', 'PDF e XML'], ['Etichette', r.tono === 'late' ? 'Paga in ritardo' : 'Nessuna']]}
        activity={r.tono === 'late' ? [['Oggi 14:43', 'Sollecito inviato via email'], ['12 set', 'Scaduta'], ['12 ago', 'Consegnata al Sistema di interscambio'], ['12 ago', 'Emessa']] : [['22 set', 'Consegnata al Sistema di interscambio'], [r.data, 'Emessa e inviata']]}
        actions={r.sdit === 'late' ? <><Button kind="secondary" size="md">Correggi</Button><Button size="md" renderIcon={Send}>Reinvia a SDI</Button></> : r.tono === 'late' ? <><Button kind="secondary" size="md" renderIcon={Email}>Sollecito</Button><Button size="md" renderIcon={Checkmark}>Registra incasso</Button></> : <><Button kind="secondary" size="md" renderIcon={Download}>PDF</Button><Button kind="secondary" size="md">XML</Button><Button size="md" renderIcon={Checkmark}>Incasso</Button></>} />
    </div>
  );
}
