import { Button, ContentSwitcher, Switch, SelectItem, TextInput, IconButton } from '@carbon/react';
import { Save, Send, Add, TrashCan, Search } from '@carbon/icons-react';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtInput, DtSelect, DtSuffix, DtFooter } from '../components/Datasheet.jsx';

// Nuova fattura: testata e cliente nel pattern datasheet, righe in una tabella modificabile, totali a destra.
// Corrisponde a src/pages/InvoiceNew.jsx e InvoiceForm.jsx dell'app.
const RIGHE = [
  ['Soccorso stradale classe 1, pratica TR0000, del 23 settembre', '1', '45,00', '22', '45,00'],
  ['Chilometri a carico, SS 117bis a deposito', '9,8', '2,20', '22', '21,56'],
  ['Custodia veicolo, dal 23 al 24 settembre', '1', '15,00', '22', '15,00'],
  ['Fermo macchina', '20', '0,90', '22', '18,00'],
];
const In = ({ v, num, ph }) => <TextInput hideLabel labelText="" size="sm" defaultValue={v} placeholder={ph} className={num ? 'num' : ''} />;

export default function FatturaNuova() {
  const azioni = <><Button kind="secondary" size="md" renderIcon={Save}>Salva bozza</Button><Button size="md" renderIcon={Send}>Emetti e invia a SDI</Button></>;
  return (
    <DtRoot>
      <DtHead crumb="Fatture" title="Nuova fattura" sub="Fattura elettronica, TD01" draft="Bozza salvata alle 15:02" pct={80} actions={azioni} />
      <DtWrap>
        <DtSection title="Documento">
          <DtGrid>
            <DtRow label="Numero"><DtInput id="n" defaultValue="2026/0143" mono style={{ maxWidth: 140 }} /><DtSuffix>sezionale unico</DtSuffix></DtRow>
            <DtRow label="Data"><DtInput id="d" defaultValue="24 settembre 2026" style={{ maxWidth: 200 }} /></DtRow>
          </DtGrid>
          <DtGrid>
            <DtRow label="Tipo documento"><DtSelect id="td" defaultValue="td01"><SelectItem value="td01" text="TD01, fattura" /><SelectItem value="td04" text="TD04, nota di credito" /><SelectItem value="td24" text="TD24, fattura differita" /></DtSelect></DtRow>
            <DtRow label="Pratiche collegate"><DtInput id="pr" defaultValue="TR0000" mono /><Button kind="tertiary" size="md" renderIcon={Search}>Aggiungi</Button></DtRow>
          </DtGrid>
        </DtSection>
        <DtSection title="Cliente">
          <DtRow label="Tipo" wide><div style={{ width: 260 }}><ContentSwitcher selectedIndex={0} size="md" onChange={() => {}}><Switch name="a" text="Azienda" /><Switch name="p" text="Privato" /></ContentSwitcher></div></DtRow>
          <DtRow label="Cliente" req wide><DtInput id="c" defaultValue="Autofficina Vella S.r.l." /><Button kind="tertiary" size="md" renderIcon={Search}>Cerca</Button></DtRow>
          <DtOk>Partita IVA IT01234567890, codice destinatario M5UXCR1, Via dello Smeraldo 18, 93012 Gela. Pagamento abituale: bonifico a 30 giorni.</DtOk>
        </DtSection>
        <DtSection title="Righe">
          <div className="rm-table rm-lines">
            <table className="cds--data-table cds--data-table--md" style={{ width: '100%', tableLayout: 'fixed' }}>
              <colgroup><col /><col style={{ width: 90 }} /><col style={{ width: 110 }} /><col style={{ width: 90 }} /><col style={{ width: 120 }} /><col style={{ width: 48 }} /></colgroup>
              <thead><tr><th>Descrizione</th><th className="num">Quantità</th><th className="num">Prezzo</th><th className="num">IVA</th><th className="num">Imponibile</th><th /></tr></thead>
              <tbody>
                {RIGHE.map(([d, q, p, iva, t]) => <tr key={d}><td><In v={d} /></td><td className="num"><In v={q} num /></td><td className="num"><In v={p} num /></td><td className="num"><In v={iva} num /></td><td className="num">{t}</td><td><IconButton kind="ghost" size="sm" label="Togli riga"><TrashCan /></IconButton></td></tr>)}
                <tr><td colSpan={6} style={{ padding: '4px 8px' }}><Button kind="tertiary" size="sm" renderIcon={Add}>Aggiungi riga</Button><Button kind="tertiary" size="sm">Da preset</Button></td></tr>
              </tbody>
            </table>
          </div>
          <div className="rm-totals">
            <span>Imponibile</span><span>99,56 euro</span>
            <span>IVA 22 per cento</span><span>21,90 euro</span>
            <span>Bollo virtuale</span><span>0,00 euro</span>
            <span>Ritenuta</span><span>nessuna</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Totale</span><span className="big">121,46 euro</span>
          </div>
        </DtSection>
        <DtSection title="Pagamento">
          <DtGrid>
            <DtRow label="Modalità"><DtSelect id="mp" defaultValue="mp05"><SelectItem value="mp05" text="MP05, bonifico" /><SelectItem value="mp01" text="MP01, contanti" /><SelectItem value="mp08" text="MP08, carta" /></DtSelect></DtRow>
            <DtRow label="Condizioni"><DtSelect id="tp" defaultValue="30"><SelectItem value="30" text="30 giorni data fattura" /><SelectItem value="0" text="Pagamento immediato" /><SelectItem value="60" text="60 giorni fine mese" /></DtSelect></DtRow>
          </DtGrid>
          <DtGrid>
            <DtRow label="Scadenza"><DtInput id="sc" defaultValue="24 ottobre 2026" style={{ maxWidth: 200 }} /></DtRow>
            <DtRow label="IBAN"><DtInput id="ib" defaultValue="IT60 X054 2811 1010 0000 0123 456" mono /></DtRow>
          </DtGrid>
          <DtRow label="Stato incasso" wide><div style={{ width: 360 }}><ContentSwitcher selectedIndex={1} size="md" onChange={() => {}}><Switch name="i" text="Già incassata" /><Switch name="n" text="Da incassare" /></ContentSwitcher></div></DtRow>
          <DtRow label="Note" wide><DtInput id="nt" placeholder="Compaiono in fattura, facoltative" /></DtRow>
        </DtSection>
        <DtFooter hints={[['Ctrl S', 'salva bozza'], ['Ctrl Invio', 'emetti'], ['Esc', 'esci']]} actions={azioni} />
      </DtWrap>
    </DtRoot>
  );
}
