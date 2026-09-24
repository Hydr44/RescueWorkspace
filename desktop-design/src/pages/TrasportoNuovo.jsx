import { useParams, useNavigate } from 'react-router-dom';
import { Button, ContentSwitcher, Switch, SelectItem, ProgressIndicator, ProgressStep, Toggle, RadioButtonGroup, RadioButton, Checkbox } from '@carbon/react';
import { ArrowRight, ArrowLeft, Search, Checkmark, Camera } from '@carbon/icons-react';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtInput, DtSelect, DtSuffix, DtFooter } from '../components/Datasheet.jsx';
import FakeMap from '../components/FakeMap.jsx';

// Nuovo trasporto in quattro passi, tutti nel pattern datasheet. Corrisponde a src/pages/TransportNew.jsx dell'app.
// Rotte: /trasporti/nuovo (chiamata), /trasporti/nuovo/veicolo, /trasporti/nuovo/percorso, /trasporti/nuovo/riepilogo
const PASSI = ['chiamata', 'veicolo', 'percorso', 'riepilogo'];
const NOMI = ['Chiamata', 'Veicolo', 'Percorso', 'Riepilogo'];

export default function TrasportoNuovo() {
  const { passo = 'chiamata' } = useParams();
  const nav = useNavigate();
  const i = Math.max(0, PASSI.indexOf(passo));
  const vai = (n) => nav('/trasporti/nuovo' + (n === 0 ? '' : '/' + PASSI[n]));
  const avanti = i < 3 ? <Button size="md" renderIcon={ArrowRight} onClick={() => vai(i + 1)}>Avanti: {NOMI[i + 1].toLowerCase()}</Button> : <Button size="md" renderIcon={Checkmark} onClick={() => nav('/trasporti')}>Crea trasporto</Button>;
  const indietro = i > 0 ? <Button kind="tertiary" size="md" renderIcon={ArrowLeft} onClick={() => vai(i - 1)}>Indietro</Button> : null;
  const azioni = <>{indietro}<Button kind="secondary" size="md">Salva bozza</Button>{avanti}</>;
  const Passo = [Chiamata, Veicolo, Percorso, Riepilogo][i];
  return (
    <DtRoot>
      <DtHead crumb="Trasporti" title="Nuovo trasporto" sub={`Soccorso stradale, passo ${i + 1} di 4`} draft="Bozza salvata alle 14:41" pct={[35, 55, 80, 100][i]} actions={azioni} />
      <DtWrap>
        <div style={{ maxWidth: 700, marginBottom: 14 }}><ProgressIndicator currentIndex={i} spaceEqually onChange={(n) => vai(n)}>{NOMI.map((n) => <ProgressStep key={n} label={n} />)}</ProgressIndicator></div>
        <Passo />
        <DtFooter hints={[['Ctrl S', 'salva bozza'], ['Ctrl Invio', 'avanti'], ['Esc', 'esci']]} actions={azioni} />
      </DtWrap>
    </DtRoot>
  );
}

function Chiamata() {
  return (<>
    <DtSection title="Chiamata">
      <DtRow label="Tipo intervento" wide><div style={{ width: 420 }}><ContentSwitcher selectedIndex={0} size="md" onChange={() => {}}><Switch name="s" text="Soccorso" /><Switch name="t" text="Trasporto" /><Switch name="m" text="Mezzo speciale" /></ContentSwitcher></div></DtRow>
      <DtGrid>
        <DtRow label="Cliente" req><DtInput id="c" defaultValue="Mario Bianchi" /><Button kind="tertiary" size="md" renderIcon={Search}>Cerca</Button></DtRow>
        <DtRow label="Convenzione"><DtSelect id="conv" defaultValue="n"><SelectItem value="n" text="Nessuna" /><SelectItem value="e" text="Europ Assistance" /></DtSelect></DtRow>
      </DtGrid>
      <DtOk>Cliente privato già in anagrafica, telefono 333 0000000.</DtOk>
      <DtGrid>
        <DtRow label="Targa" req><DtInput id="t" defaultValue="GA 512 PM" mono /></DtRow>
        <DtRow label="Motivo"><DtSelect id="mot" defaultValue="p"><SelectItem value="p" text="Panne meccanica" /><SelectItem value="i" text="Incidente" /></DtSelect></DtRow>
      </DtGrid>
      <DtOk>Fiat Panda del 2019, già trasportata due volte.</DtOk>
      <DtGrid>
        <DtRow label="Ora chiamata"><DtInput id="oc" defaultValue="13:52" style={{ maxWidth: 120 }} /></DtRow>
        <DtRow label="Arrivo richiesto"><DtInput id="oa" defaultValue="14:30" style={{ maxWidth: 120 }} /><DtSuffix>oggi</DtSuffix></DtRow>
      </DtGrid>
    </DtSection>
    <DtSection title="Luogo">
      <DtRow label="Luogo del veicolo" req wide><DtInput id="l" defaultValue="Via dello Smeraldo 18, 93012 Gela (CL)" /><DtSuffix>4,2 km dal deposito</DtSuffix></DtRow>
      <DtRow label="Note per l'autista" wide><DtInput id="n" placeholder="Es. veicolo in curva, attenzione al traffico" /></DtRow>
    </DtSection>
  </>);
}

function Veicolo() {
  return (<>
    <DtSection title="Veicolo">
      <DtGrid>
        <DtRow label="Targa" req><DtInput id="t" defaultValue="GA 512 PM" mono /><Button kind="tertiary" size="md" renderIcon={Search}>Visura</Button></DtRow>
        <DtRow label="Telaio"><DtInput id="vin" defaultValue="ZFA31200003456789" mono /></DtRow>
      </DtGrid>
      <DtOk>Visura fatta alle 13:55. Fiat Panda 1.2 Easy, immatricolata il 12 marzo 2019, revisione valida fino a marzo 2027.</DtOk>
      <DtGrid>
        <DtRow label="Marca e modello"><DtInput id="mm" defaultValue="Fiat Panda 1.2 Easy" /></DtRow>
        <DtRow label="Tipo veicolo"><DtSelect id="tv" defaultValue="a"><SelectItem value="a" text="Autovettura" /><SelectItem value="f" text="Furgone" /><SelectItem value="m" text="Moto" /><SelectItem value="p" text="Veicolo pesante" /></DtSelect></DtRow>
      </DtGrid>
      <DtGrid>
        <DtRow label="Classe soccorso"><DtSelect id="cl" defaultValue="1"><SelectItem value="1" text="Classe 1, fino a 3,5 t" /><SelectItem value="2" text="Classe 2, da 3,5 a 7,5 t" /><SelectItem value="3" text="Classe 3, oltre 7,5 t" /></DtSelect></DtRow>
        <DtRow label="Stato del veicolo"><DtSelect id="st" defaultValue="nm"><SelectItem value="nm" text="Non marciante, ruote libere" /><SelectItem value="rb" text="Ruote bloccate" /><SelectItem value="inc" text="Incidentato" /></DtSelect></DtRow>
      </DtGrid>
      <DtRow label="Foto" wide><Button kind="tertiary" size="md" renderIcon={Camera}>Aggiungi foto</Button><DtSuffix>Nessuna foto. L'autista può aggiungerle dall'app mobile.</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Mezzo speciale o carico">
      <DtRow label="Mezzo speciale" wide><Toggle id="ms" size="sm" labelA="No" labelB="Sì" toggled={false} labelText="" hideLabel /><DtSuffix>Attivalo per carichi fuori sagoma, mezzi pesanti e merci ADR</DtSuffix></DtRow>
      <DtGrid>
        <DtRow label="Peso"><DtInput id="pt" placeholder="0,0" style={{ maxWidth: 120 }} disabled /><DtSuffix>tonnellate</DtSuffix></DtRow>
        <DtRow label="Dimensioni"><DtInput id="lu" placeholder="lung." style={{ maxWidth: 90 }} disabled /><DtInput id="la" placeholder="larg." style={{ maxWidth: 90 }} disabled /><DtInput id="al" placeholder="alt." style={{ maxWidth: 90 }} disabled /><DtSuffix>metri</DtSuffix></DtRow>
      </DtGrid>
      <DtGrid>
        <DtRow label="Trasporto ADR"><Checkbox id="adr" labelText="Merci pericolose" disabled /></DtRow>
        <DtRow label="Scorta tecnica"><Checkbox id="sc" labelText="Richiesta" disabled /></DtRow>
      </DtGrid>
    </DtSection>
  </>);
}

const VOCI = [['Uscita soccorso, classe 1', '1', '45,00', '45,00'], ['Chilometri a carico', '9,8 km', '2,20', '21,56'], ['Fermo macchina', '20 min', '0,90', '18,00'], ['Notturno o festivo', '', '', '0,00']];
function Percorso() {
  return (<>
    <div style={{ height: 240, marginBottom: 14 }}><FakeMap route markers={[{ x: 160, y: 320, t: 'Veicolo' }, { x: 640, y: 258, t: 'Officina Manzoni' }, { x: 300, y: 420, t: 'Deposito', dim: true }]} label="Mappa: nell'app qui c'è TransportMap con il percorso reale" /></div>
    <DtSection title="Percorso">
        <DtRow label="Partenza" req wide><DtInput id="p" defaultValue="Via dello Smeraldo 18, 93012 Gela (CL)" /></DtRow>
        <DtRow label="Destinazione" req wide><DtInput id="d" defaultValue="Via A. Manzoni 4, Gela" /><Button kind="tertiary" size="md" renderIcon={Search}>Officine</Button></DtRow>
        <DtOk>Officina Manzoni, convenzionata. Orario di apertura fino alle 19:00.</DtOk>
        <DtGrid>
          <DtRow label="Distanza"><DtInput id="km" defaultValue="9,8" style={{ maxWidth: 100 }} /><DtSuffix>km, dagli indirizzi</DtSuffix></DtRow>
          <DtRow label="Tempo stimato"><DtInput id="tm" defaultValue="16" style={{ maxWidth: 100 }} /><DtSuffix>minuti</DtSuffix></DtRow>
        </DtGrid>
        <DtGrid>
          <DtRow label="Data"><DtInput id="dt" defaultValue="Oggi, 24 settembre" /></DtRow>
          <DtRow label="Ora"><DtInput id="or" defaultValue="14:30" style={{ maxWidth: 100 }} /></DtRow>
        </DtGrid>
      </DtSection>
    <DtSection title="Chi paga e quanto">
      <DtRow label="Chi paga" wide><div style={{ width: 460 }}><ContentSwitcher selectedIndex={0} size="md" onChange={() => {}}><Switch name="a" text="Cliente diretto" /><Switch name="b" text="Committente, conto terzi" /></ContentSwitcher></div></DtRow>
      <DtGrid>
        <DtRow label="Listino"><DtSelect id="li" defaultValue="b"><SelectItem value="b" text="Listino base soccorso" /><SelectItem value="e" text="Europ Assistance 2026" /></DtSelect></DtRow>
        <DtRow label="Sconto"><DtInput id="sc" defaultValue="0" style={{ maxWidth: 100 }} /><DtSuffix>per cento</DtSuffix></DtRow>
      </DtGrid>
      <div className="rm-table" style={{ borderTop: '1px solid var(--border)' }}>
        <table className="cds--data-table cds--data-table--md" style={{ width: '100%', tableLayout: 'fixed' }}>
          <colgroup><col /><col style={{ width: 110 }} /><col style={{ width: 120 }} /><col style={{ width: 130 }} /></colgroup>
          <thead><tr><th>Voce</th><th>Quantità</th><th>Prezzo unitario</th><th style={{ textAlign: 'right' }}>Importo</th></tr></thead>
          <tbody>{VOCI.map(([v, q, p, t]) => <tr key={v}><td>{v}</td><td className="rm-status--muted">{q}</td><td className="rm-status--muted">{p && p + ' euro'}</td><td style={{ textAlign: 'right' }}>{t} euro</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--layer-2)' }}>
        <div><div className="rm-muted">Imponibile</div><div style={{ fontSize: 16, fontWeight: 500 }}>84,56 euro</div></div>
        <div><div className="rm-muted">IVA 22 per cento</div><div style={{ fontSize: 16, fontWeight: 500 }}>18,60 euro</div></div>
        <div style={{ textAlign: 'right' }}><div className="rm-muted">Totale stimato</div><div style={{ fontSize: 22, fontWeight: 600 }}>103,16 euro</div></div>
      </div>
    </DtSection>
  </>);
}

const AUTISTI = [['GR', 'Giuseppe Russo', 'FN 245 KL, carro 3,5 t', 'a 4,1 km, libero alle 14:50', true, false], ['MF', 'Marco Ferro', 'EX 812 CN, carro 7,5 t', 'a 7,6 km, libero', false, false], ['SG', 'Salvatore Greco', 'DA 331 HG, carro 3,5 t', 'in viaggio, rientro alle 15:40', false, true]];
function Riepilogo() {
  return (<>
    <DtSection title="Riepilogo">
      <DtGrid>
        <DtRow label="Cliente"><span>Mario Bianchi, privato</span></DtRow>
        <DtRow label="Veicolo"><span>Fiat Panda 1.2, GA 512 PM</span></DtRow>
      </DtGrid>
      <DtGrid>
        <DtRow label="Intervento"><span>Soccorso, panne meccanica, classe 1</span></DtRow>
        <DtRow label="Quando"><span>Oggi alle 14:30</span></DtRow>
      </DtGrid>
      <DtGrid>
        <DtRow label="Percorso"><span>Via dello Smeraldo 18, Gela, a Officina Manzoni. 9,8 km, 16 minuti</span></DtRow>
        <DtRow label="Prezzo"><span>103,16 euro con IVA, paga il cliente</span></DtRow>
      </DtGrid>
    </DtSection>
    <DtSection title="Assegnazione">
      <DtRow label="Autista" req wide>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {AUTISTI.map(([ini, n, m, d, on, busy]) => (
            <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: on ? 'var(--selected)' : 'transparent', boxShadow: on ? 'inset 3px 0 0 var(--brand)' : 'none', opacity: busy ? 0.7 : 1, cursor: 'pointer' }}>
              <input type="radio" name="au" defaultChecked={on} className="cds--radio-button" style={{ margin: 0 }} />
              <span className="rm-avatar rm-avatar--layer" style={{ width: 26, height: 26 }}>{ini}</span>
              <span style={{ width: 150, fontWeight: on ? 600 : 400 }}>{n}</span>
              <span className="rm-muted" style={{ width: 170, fontSize: 12.5 }}>{m}</span>
              <span className={busy ? 'rm-status--muted' : on ? 'rm-status--run' : ''} style={{ fontSize: 12.5 }}>{d}</span>
            </label>
          ))}
        </div>
      </DtRow>
      <DtGrid>
        <DtRow label="Priorità"><div style={{ width: 240 }}><ContentSwitcher selectedIndex={1} size="md" onChange={() => {}}><Switch name="n" text="Normale" /><Switch name="u" text="Urgente" /></ContentSwitcher></div></DtRow>
        <DtRow label="Pratica"><DtInput id="pr" defaultValue="TR0006" mono style={{ maxWidth: 140 }} /><DtSuffix>numerazione automatica</DtSuffix></DtRow>
      </DtGrid>
    </DtSection>
    <DtSection title="Avvisi al cliente">
      <DtGrid>
        <DtRow label="Canale"><Checkbox id="wa" labelText="WhatsApp" defaultChecked /><Checkbox id="sms" labelText="SMS" /><Checkbox id="em" labelText="Email" /></DtRow>
        <DtRow label="Lingua"><DtSelect id="lg" defaultValue="it"><SelectItem value="it" text="Italiano" /><SelectItem value="en" text="Inglese" /><SelectItem value="fr" text="Francese" /></DtSelect></DtRow>
      </DtGrid>
      <DtOk>Il cliente riceverà su WhatsApp l'assegnazione, la partenza del carro e l'arrivo previsto.</DtOk>
    </DtSection>
  </>);
}
