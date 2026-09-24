import { useParams, NavLink } from 'react-router-dom';
import { Button, IconButton, SelectItem, Toggle, Checkbox, ContentSwitcher, Switch } from '@carbon/react';
import { Save, Upload, Add, TrashCan, Edit, Download, Renew, Launch, Printer, QrCode, Document } from '@carbon/icons-react';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtErr, DtInput, DtSelect, DtSuffix, DtFooter } from '../components/Datasheet.jsx';
import { useState } from 'react';
import ListinoEditor from '../components/ListinoEditor.jsx';

// Impostazioni: le 19 schede di oggi diventano un menu a sinistra (quattro gruppi) e una datasheet a destra.
// Corrisponde a src/pages/SettingsLegacy.jsx e src/components/settings/*. Ogni sezione qui sotto corrisponde a un componente di la'.
export const GRUPPI = [
  ['Azienda', [['organizzazione', 'Organizzazione'], ['personale', 'Personale'], ['sicurezza', 'Sicurezza'], ['profilo', 'Profilo personale']]],
  ['Moduli', [['soccorso', 'Soccorso e trasporti'], ['custodia', 'Custodia veicoli'], ['demolizione', 'Demolizione VFU'], ['rentri', 'Rifiuti RENTRI'], ['ricambi', 'Ricambi'], ['marketplace', 'Marketplace'], ['unrae', 'UNRAE'], ['cobat', 'Percorso Cobat'], ['gps', 'Tracking GPS'], ['calendario', 'Calendario'], ['crm', 'CRM clienti']]],
  ['Fatturazione', [['fatturazione', 'Fatturazione'], ['abbonamento', 'Abbonamento'], ['pagamento', 'Metodo di pagamento']]],
  ['Sistema', [['notifiche', 'Notifiche'], ['etichette', 'Stampante etichette'], ['backup', 'Dati e backup'], ['sistema', 'Sistema']]],
];

export default function Impostazioni() {
  const { sezione = 'organizzazione' } = useParams();
  const nome = GRUPPI.flatMap(([, v]) => v).find(([k]) => k === sezione)?.[1] || 'Impostazioni';
  const Sez = SEZIONI[sezione] || Generica;
  return (
    <div className="rm-settings">
      <nav className="rm-settings__nav" aria-label="Sezioni delle impostazioni">
        {GRUPPI.map(([g, voci]) => <div key={g}><div className="rm-settings__group">{g}</div>{voci.map(([k, l]) => <NavLink key={k} to={'/settings/' + k} className="rm-settings__item">{l}</NavLink>)}</div>)}
      </nav>
      <div className="rm-settings__body"><DtRoot><Sez nome={nome} /></DtRoot></div>
    </div>
  );
}

const SALVA = <><Button kind="secondary" size="md">Annulla</Button><Button size="md" renderIcon={Save}>Salva</Button></>;
const Tog = ({ id, on = true }) => <Toggle id={id} size="sm" labelA="No" labelB="Sì" defaultToggled={on} labelText="" hideLabel />;
const Head = ({ title, sub, draft = 'Salvato il 18 settembre', actions = SALVA }) => <DtHead crumb="Impostazioni" title={title} sub={sub} draft={draft} actions={actions} back="/" />;
// Tabella dentro una sezione: righe di dati con azioni a destra.
function Tab({ cols, rows, add }) {
  return (<>
    <div className="rm-table" style={{ borderTop: '1px solid var(--border)' }}>
      <table className="cds--data-table cds--data-table--md" style={{ width: '100%', tableLayout: 'fixed' }}>
        <colgroup>{cols.map((c, i) => <col key={i} style={c[1] ? { width: c[1] } : {}} />)}<col style={{ width: 84 }} /></colgroup>
        <thead><tr>{cols.map((c) => <th key={c[0]}>{c[0]}</th>)}<th /></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={typeof v === 'string' && /^(Attiva|Attivo|Non attivo|Da attivare|In attesa|Scaduto|Mai visto)/.test(v) ? 'rm-status--muted' : ''}>{v}</td>)}<td><IconButton kind="ghost" size="sm" label="Modifica"><Edit /></IconButton><IconButton kind="ghost" size="sm" label="Togli"><TrashCan /></IconButton></td></tr>)}</tbody>
      </table>
    </div>
    {add && <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border)' }}><Button kind="tertiary" size="sm" renderIcon={Add}>{add}</Button></div>}
  </>);
}

function Organizzazione() {
  return (<><Head title="Organizzazione" sub="Dati dell'azienda che compaiono su fatture, formulari e avvisi" /><DtWrap>
    <DtSection title="Anagrafica">
      <DtRow label="Ragione sociale" req wide><DtInput id="rs" defaultValue="Autosoccorso Bianchi S.r.l." /></DtRow>
      <DtGrid><DtRow label="Partita IVA" req><DtInput id="piva" defaultValue="IT01234567890" /></DtRow><DtRow label="Codice fiscale"><DtInput id="cf" defaultValue="01234567890" /></DtRow></DtGrid>
      <DtGrid><DtRow label="Regime fiscale"><DtSelect id="rf" defaultValue="rf01"><SelectItem value="rf01" text="RF01, ordinario" /><SelectItem value="rf18" text="RF18, altro" /></DtSelect></DtRow><DtRow label="Codice REN"><DtInput id="ren" defaultValue="CL-000123" mono /></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Sede e orari">
      <DtRow label="Via e numero" wide><DtInput id="via" defaultValue="Via dello Smeraldo 18" /></DtRow>
      <DtGrid><DtRow label="CAP"><DtInput id="cap" defaultValue="93012" style={{ maxWidth: 120 }} /></DtRow><DtRow label="Città e provincia"><DtInput id="cit" defaultValue="Gela" /><DtInput id="pr" defaultValue="CL" style={{ maxWidth: 72, textAlign: 'center' }} /></DtRow></DtGrid>
      <DtGrid><DtRow label="Deposito"><DtInput id="dep" defaultValue="Contrada Piano Cannelle, Gela" /></DtRow><DtRow label="Coordinate"><DtInput id="co" defaultValue="37.0662, 14.2500" mono /><DtSuffix>per i chilometri</DtSuffix></DtRow></DtGrid>
      <DtGrid><DtRow label="Apertura"><DtInput id="ap" defaultValue="08:00" style={{ maxWidth: 90 }} /><DtSuffix>a</DtSuffix><DtInput id="ch" defaultValue="18:00" style={{ maxWidth: 90 }} /></DtRow><DtRow label="Pausa"><DtInput id="p1" defaultValue="13:00" style={{ maxWidth: 90 }} /><DtSuffix>a</DtSuffix><DtInput id="p2" defaultValue="14:30" style={{ maxWidth: 90 }} /></DtRow></DtGrid>
      <DtRow label="Giorni" wide>{['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((g, i) => <Checkbox key={g} id={'g' + g} labelText={g} defaultChecked={i < 6} />)}</DtRow>
    </DtSection>
    <DtSection title="Contatti e marchio">
      <DtGrid><DtRow label="Telefono"><DtInput id="tel" defaultValue="0933 123456" /></DtRow><DtRow label="Email"><DtInput id="em" defaultValue="info@autosoccorsobianchi.it" /></DtRow></DtGrid>
      <DtGrid><DtRow label="PEC"><DtInput id="pec" defaultValue="bianchi@pec.it" /></DtRow><DtRow label="Sito web"><DtInput id="web" defaultValue="autosoccorsobianchi.it" /></DtRow></DtGrid>
      <DtRow label="Logo" wide><Button kind="tertiary" size="md" renderIcon={Upload}>Carica logo</Button><DtSuffix>PNG, JPG o SVG fino a 2 MB, va su fatture e avvisi</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Dati bancari e note sui documenti">
      <DtGrid><DtRow label="IBAN"><DtInput id="ib" defaultValue="IT60 X054 2811 1010 0000 0123 456" mono /></DtRow><DtRow label="Banca"><DtInput id="bk" defaultValue="Banca Agricola Popolare, Gela" /></DtRow></DtGrid>
      <DtRow label="Note legali" wide><DtInput id="nl" defaultValue="Operazione soggetta a IVA. Pagamento a 30 giorni salvo diverso accordo." /></DtRow>
    </DtSection>
    <DtSection title="Zona pericolosa">
      <DtRow label="Elimina organizzazione" wide><Button kind="danger--tertiary" size="md">Elimina</Button><DtSuffix>cancella tutti i dati, non si torna indietro</DtSuffix></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Personale() {
  return (<><Head title="Personale" sub="Chi usa l'app, con quale ruolo, e chi ha RescueMobile" draft="4 membri attivi, 1 invito in sospeso" actions={<Button size="md" renderIcon={Add}>Invita</Button>} /><DtWrap>
    <DtSection title="Membri attivi">
      <Tab cols={[['Persona', 220], ['Ruolo', 130], ['App mobile', 130], ['Aggiunto']]} rows={[['Emmanuel Scozzarini', 'Titolare', 'Attiva', '12 gennaio 2025'], ['Giuseppe Russo', 'Autista', 'Attiva', '3 marzo 2025'], ['Marco Ferro', 'Autista', 'Da attivare', '20 giugno 2026'], ['Salvatore Greco', 'Autista', 'Attiva', '3 marzo 2025'], ['Rosa Bianchi', 'Amministrazione', 'Non serve', '15 febbraio 2025']]} />
    </DtSection>
    <DtSection title="Invita un nuovo membro">
      <DtGrid><DtRow label="Email" req><DtInput id="ie" placeholder="nome@email.it" /></DtRow><DtRow label="Ruolo"><DtSelect id="ir" defaultValue="au"><SelectItem value="au" text="Autista" /><SelectItem value="op" text="Operatore" /><SelectItem value="am" text="Amministrazione" /><SelectItem value="ti" text="Titolare" /></DtSelect></DtRow></DtGrid>
      <DtOk>Un invito è in sospeso: carlo.amato@gmail.com, autista, mandato il 22 settembre.</DtOk>
    </DtSection>
    <DtSection title="Ruoli">
      {[['Titolare', 'Tutto, comprese impostazioni e fatturazione'], ['Amministrazione', 'Clienti, fatture, contabilità, report'], ['Operatore', 'Trasporti, custodia, demolizioni, rifiuti'], ['Autista', 'Solo RescueMobile: i propri trasporti, foto e firme']].map(([r, d]) => <DtRow key={r} label={r} wide><span>{d}</span></DtRow>)}
    </DtSection>
  </DtWrap></>);
}

function Sicurezza() {
  return (<><Head title="Sicurezza" sub="Stato dell'account, sessioni e attività registrate" draft="" actions={null} /><DtWrap>
    <DtSection title="Stato">
      <DtGrid><DtRow label="Email verificata"><span>Sì, info@autosoccorsobianchi.it</span></DtRow><DtRow label="Due fattori"><span className="rm-status--muted">Non attivi</span><Button kind="tertiary" size="md">Attiva</Button></DtRow></DtGrid>
      <DtGrid><DtRow label="Accesso"><span>Con il browser, tramite rescuemanager.eu</span></DtRow><DtRow label="Ultimo accesso"><span>Oggi alle 14:41 da questo computer</span></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Sessioni">
      <Tab cols={[['Dispositivo', 260], ['Dove', 160], ['Ultima attività']]} rows={[['MacBook di Emmanuel, questo dispositivo', 'Gela', 'adesso'], ['PC ufficio, Windows', 'Gela', 'ieri alle 18:20'], ['iPhone, RescueMobile', 'Gela', '3 giorni fa']]} />
    </DtSection>
    <DtSection title="Attività recente">
      {[['Oggi 14:41', 'Accesso dal browser', 'Emmanuel'], ['Ieri 18:20', 'Modificato listino soccorso', 'Emmanuel'], ['22 set', 'Invitato carlo.amato@gmail.com', 'Emmanuel'], ['20 set', 'Emessa fattura 2026/0139', 'Rosa Bianchi']].map(([t, e, u]) => <div key={t + e} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}><span className="rm-muted">{t}</span><span>{e}</span><span className="rm-muted">{u}</span></div>)}
    </DtSection>
  </DtWrap></>);
}

function Profilo() {
  return (<><Head title="Profilo personale" sub="Il tuo account, non l'azienda" /><DtWrap>
    <DtSection title="Dati">
      <DtGrid><DtRow label="Nome visualizzato"><DtInput id="n" defaultValue="Emmanuel Scozzarini" /></DtRow><DtRow label="Telefono"><DtInput id="t" defaultValue="+39 333 0000000" /></DtRow></DtGrid>
      <DtRow label="Foto profilo" wide><span className="rm-avatar" style={{ width: 36, height: 36 }}>ES</span><Button kind="tertiary" size="md" renderIcon={Upload}>Carica foto</Button></DtRow>
      <DtGrid><DtRow label="Membro dal"><span>12 gennaio 2025</span></DtRow><DtRow label="Ultimo accesso"><span>Oggi alle 14:41</span></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Email di accesso">
      <DtGrid><DtRow label="Email attuale"><span>info@autosoccorsobianchi.it</span><DtSuffix>verificata</DtSuffix></DtRow><DtRow label="Nuova email"><DtInput id="ne" placeholder="nuova@email.it" /></DtRow></DtGrid>
      <DtOk>Le credenziali si cambiano su rescuemanager.eu: qui puoi solo avviare la modifica, poi confermi nel browser.</DtOk>
    </DtSection>
    <DtSection title="Password e due fattori">
      <DtRow label="Password" wide><Button kind="tertiary" size="md" renderIcon={Launch}>Cambia password nel browser</Button></DtRow>
      <DtRow label="Due fattori" wide><Button kind="tertiary" size="md" renderIcon={Launch}>Attiva nel browser</Button><DtSuffix>codice dall'app di autenticazione a ogni accesso</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Zona pericolosa"><DtRow label="Elimina account" wide><Button kind="danger--tertiary" size="md">Elimina</Button><DtSuffix>l'organizzazione resta agli altri titolari</DtSuffix></DtRow></DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Soccorso() {
  const [ed, setEd] = useState(false);
  return (<><Head title="Soccorso e trasporti" sub="Tariffe, preset, committenti, indirizzi frequenti e messaggi al cliente" draft="Salvato il 3 settembre" /><DtWrap>
    <DtSection title="Tariffario base">
      <DtGrid><DtRow label="Tariffa base"><DtInput id="tb" defaultValue="45,00" style={{ maxWidth: 120 }} /><DtSuffix>euro</DtSuffix></DtRow><DtRow label="Costo per chilometro"><DtInput id="km" defaultValue="2,20" style={{ maxWidth: 120 }} /><DtSuffix>euro</DtSuffix></DtRow></DtGrid>
      <DtRow label="Notturno" wide><DtInput id="nt" defaultValue="30" style={{ maxWidth: 90 }} /><DtSuffix>per cento in più, dalle</DtSuffix><DtInput id="n1" defaultValue="20:00" style={{ maxWidth: 90 }} /><DtSuffix>alle</DtSuffix><DtInput id="n2" defaultValue="07:00" style={{ maxWidth: 90 }} /></DtRow>
      <DtGrid><DtRow label="Festivo"><DtInput id="fe" defaultValue="30" style={{ maxWidth: 90 }} /><DtSuffix>per cento in più</DtSuffix></DtRow><DtRow label="Urgente"><DtInput id="ur" defaultValue="20" style={{ maxWidth: 90 }} /><DtSuffix>per cento in più</DtSuffix></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Listino soccorso">
      <Tab cols={[['Voce', 190], ['Si applica a', 150], ['Come si calcola', 110], ['Prezzi per classe']]} rows={[
        [<span key="vPan">Panne in città<span className="rm-sub">Soccorso, panne meccanica</span></span>, 'Privati', 'A chilometro', <span key="1">45,00 euro<span className="rm-sub">classe 2: 80,00, classe 3: 180,00</span></span>],
        [<span key="vInc">Incidente<span className="rm-sub">Soccorso, incidente</span></span>, 'Tutti', 'A chilometro', <span key="2">80,00 euro<span className="rm-sub">classe 2: 120,00, classe 3: 240,00</span></span>],
        [<span key="vTra">Trasporto in officina<span className="rm-sub">Trasporto</span></span>, 'Tutti', 'A chilometro', <span key="3">60,00 euro<span className="rm-sub">classe 2: 95,00, classe 3: 190,00</span></span>],
        [<span key="vUsc">Uscita Europ Assistance<span className="rm-sub">Soccorso</span></span>, 'Convenzione Europ Assistance', 'Fisso', <span key="4">52,00 euro<span className="rm-sub">classe 2: 84,00, classe 3 da concordare</span></span>],
        [<span key="vUsc">Uscita ACI Global<span className="rm-sub">Soccorso</span></span>, 'Convenzione ACI Global', 'Fisso', <span key="5">48,00 euro<span className="rm-sub">classe 2: 80,00, classe 3 da concordare</span></span>],
        [<span key="vCus">Custodia dopo il soccorso<span className="rm-sub">Trasporto</span></span>, 'Privati', 'A giorno', <span key="6">15,00 euro<span className="rm-sub">classe 2: 20,00, classe 3: 35,00</span></span>],
        [<span key="vMez">Mezzo pesante fuori sagoma<span className="rm-sub">Mezzo speciale</span></span>, 'Tutti', 'Da concordare', ''],
      ]} add="Nuova voce" />
      <DtOk>Una scheda sola per privati, convenzioni e preset: ogni voce dice a chi si applica e come si calcola. Quando nessuna voce corrisponde vale il tariffario base qui sopra.</DtOk>
      <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border)' }}><Button kind="tertiary" size="sm" onClick={() => setEd(true)}>Apri la scheda di una voce</Button></div>
    </DtSection>
    <ListinoEditor open={ed} voce={{}} onClose={() => setEd(false)} />
    <DtSection title="Committenti conto terzi">
      <Tab cols={[['Committente', 240], ['Partita IVA', 150], ['Codice cliente', 120], ['Merce abituale']]} rows={[['Logistica Sud S.r.l.', 'IT02345678901', 'LOGSUD', 'Ricambi'], ['Concessionaria Auto Gela', 'IT03456789012', 'CONGELA', 'Veicoli nuovi']]} add="Nuovo committente" />
    </DtSection>
    <DtSection title="Indirizzi frequenti e depositi">
      <Tab cols={[['Etichetta', 200], ['Indirizzo completo'], ['Uso', 120]]} rows={[['Deposito', 'Contrada Piano Cannelle, 93012 Gela (CL)', 'Deposito'], ['Officina Manzoni', 'Via A. Manzoni 4, 93012 Gela (CL)', 'Destinazione'], ['Piazzale, settore B', 'Contrada Piano Cannelle, settore B', 'Destinazione']]} add="Nuovo indirizzo" />
    </DtSection>
    <DtSection title="Messaggi al cliente su WhatsApp">
      <DtRow label="Avvisa quando" wide>{['Assegnato', 'In viaggio', 'Arrivato', 'Completato'].map((s, i) => <Checkbox key={s} id={'w' + s} labelText={s} defaultChecked={i !== 2} />)}</DtRow>
      <DtGrid><DtRow label="Telefono nei messaggi"><DtInput id="tm" defaultValue="0933 123456" /></DtRow><DtRow label="Lingue"><span>Italiano, inglese</span><Button kind="tertiary" size="sm">Modifica</Button></DtRow></DtGrid>
      <DtRow label="Link recensione" wide><DtInput id="lr" placeholder="https://g.page/…/review" /><DtSuffix>va nel messaggio di fine trasporto</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Regole">
      <DtRow label="Numerazione pratiche" wide><DtInput id="np" defaultValue="TR" mono style={{ maxWidth: 100 }} /><DtSuffix>prossima: TR0006</DtSuffix></DtRow>
      <DtRow label="Foto obbligatorie" wide><Tog id="fo" /><DtSuffix>l'autista deve fotografare il veicolo prima del carico</DtSuffix></DtRow>
      <DtRow label="Condizioni del servizio" wide><Button kind="tertiary" size="md" renderIcon={Document}>Modifica il testo</Button><DtSuffix>stampate sul modulo di presa in carico</DtSuffix></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Custodia() {
  return (<><Head title="Custodia veicoli" sub="Zone del deposito e autorità competenti" /><DtWrap>
    <DtSection title="Zone del deposito">
      <Tab cols={[['Zona', 200], ['Descrizione'], ['Capienza', 100], ['Occupati', 100]]} rows={[['Zona A', 'Ingresso e accettazione', '10', '4'], ['Zona B', 'Stoccaggio custodia', '60', '38'], ['Zona C', 'Demolizione', '20', '11'], ['Zona D', 'Ricambi', '15', '6'], ['Zona E', 'Rottami', '30', '19']]} add="Nuova zona" />
    </DtSection>
    <DtSection title="Autorità che dispongono la custodia">
      <Tab cols={[['Autorità', 260], ['Riferimento'], ['Telefono', 140]]} rows={[['Polizia Locale di Gela', 'Comando, Via Palazzi 12', '0933 900000'], ['Carabinieri, Compagnia di Gela', 'Via Butera 100', '0933 900001'], ['Polizia Stradale, distaccamento di Gela', 'SS 115', '0933 900002']]} add="Nuova autorità" />
    </DtSection>
    <DtSection title="Tariffe">
      <DtGrid><DtRow label="Custodia al giorno"><DtInput id="cg" defaultValue="15,00" style={{ maxWidth: 120 }} /><DtSuffix>euro</DtSuffix></DtRow><DtRow label="Dopo 30 giorni"><DtInput id="c30" defaultValue="10,00" style={{ maxWidth: 120 }} /><DtSuffix>euro al giorno</DtSuffix></DtRow></DtGrid>
      <DtRow label="Avviso di giacenza" wide><DtInput id="ag" defaultValue="60" style={{ maxWidth: 90 }} /><DtSuffix>giorni, poi si propone la pratica di alienazione</DtSuffix></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Demolizione() {
  return (<><Head title="Demolizione VFU" sub="Centro di raccolta, portale RVFU, fattura predefinita" /><DtWrap>
    <DtSection title="Centro di raccolta">
      <DtGrid><DtRow label="Codice centro"><DtInput id="cr" defaultValue="DETO003001" mono /></DtRow><DtRow label="Radiazione diretta"><Tog id="rd" /><DtSuffix>il centro è abilitato dal PRA</DtSuffix></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Credenziali del Portale del Trasporto">
      <DtGrid><DtRow label="Utente"><DtInput id="pu" defaultValue="AUTOBIANCHI01" mono /></DtRow><DtRow label="Password"><DtInput id="pp" type="password" defaultValue="password" /></DtRow></DtGrid>
      <DtOk>Ultimo collegamento riuscito oggi alle 09:12.</DtOk>
    </DtSection>
    <DtSection title="Fattura predefinita per la demolizione">
      <DtGrid><DtRow label="Causale SDI"><DtInput id="cs" defaultValue="Servizio di demolizione veicolo fuori uso" /></DtRow><DtRow label="Note interne"><DtInput id="ni" placeholder="Facoltative" /></DtRow></DtGrid>
      <Tab cols={[['Codice', 100], ['Descrizione'], ['Quantità', 90], ['Prezzo', 110], ['IVA', 80]]} rows={[['DEM', 'Demolizione e radiazione', '1', '120,00 euro', '22'], ['RIT', 'Ritiro con carro attrezzi', '1', '45,00 euro', '22'], ['PRA', 'Pratica PRA', '1', '32,00 euro', '0']]} add="Nuova riga" />
    </DtSection>
    <DtSection title="Opzioni">
      <DtRow label="Bonifica obbligatoria" wide><Tog id="bo" /><DtSuffix>non si passa a Demolito senza la scheda di bonifica</DtSuffix></DtRow>
      <DtRow label="Foto prima e dopo" wide><Tog id="fp" /><DtSuffix>richieste per l'invio a STA</DtSuffix></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Rentri() {
  return (<><Head title="Rifiuti RENTRI" sub="Limiti, certificati, frantumatori e dispositivi di firma" /><DtWrap>
    <DtSection title="Registro">
      <DtGrid><DtRow label="Ambiente"><div style={{ width: 260 }}><ContentSwitcher selectedIndex={1} size="sm" onChange={() => {}}><Switch name="t" text="Test" /><Switch name="p" text="Produzione" /></ContentSwitcher></div></DtRow><DtRow label="Numero iscrizione"><DtInput id="ni" defaultValue="OP-CL-004521" mono /></DtRow></DtGrid>
      <DtOk>Ultima trasmissione riuscita ieri alle 18:00. Prossima chiusura mensile il 30 settembre.</DtOk>
    </DtSection>
    <DtSection title="Limiti annuali e soglie di avviso">
      <Tab cols={[['Codice', 110], ['Descrizione'], ['Limite annuo', 130], ['Stoccaggio', 130], ['Avviso al', 100]]} rows={[['16 01 04*', 'Veicoli fuori uso', '600.000 kg', '5.000 kg', '85 %'], ['16 01 06', 'Veicoli fuori uso bonificati', '500.000 kg', '9.000 kg', '85 %'], ['13 02 05*', 'Oli minerali per motori', '3.000 kg', '500 kg', '80 %'], ['16 06 01*', 'Batterie al piombo', '8.000 kg', '600 kg', '80 %']]} add="Nuovo limite" />
    </DtSection>
    <DtSection title="Certificati con cui l'app si presenta a RENTRI">
      <Tab cols={[['Certificato', 260], ['Intestatario'], ['Scadenza', 140], ['Stato', 100]]} rows={[['Certificato operatore 2026', 'Autosoccorso Bianchi S.r.l.', '14 marzo 2027', 'Attivo'], ['Certificato operatore 2025', 'Autosoccorso Bianchi S.r.l.', '14 marzo 2026', 'Scaduto']]} add="Carica certificato" />
    </DtSection>
    <DtSection title="Frantumatori abituali">
      <Tab cols={[['Impianto', 240], ['Autorizzazione', 160], ['Sede'], ['Codici accettati', 150]]} rows={[['Ecoferro S.r.l.', 'CT-2231', 'Catania', '16 01 06, 16 01 17'], ['Metalsud', 'PA-1180', 'Palermo', '16 01 06']]} add="Nuovo frantumatore" />
    </DtSection>
    <DtSection title="Dispositivi di firma">
      <Tab cols={[['Dispositivo', 220], ['Persona', 180], ['Abbinato il'], ['Stato', 110]]} rows={[['iPhone di Emmanuel', 'Emmanuel Scozzarini', '3 marzo 2026', 'Attivo'], ['Android ufficio', 'Rosa Bianchi', '15 febbraio 2025', 'Attivo']]} add="Abbina dispositivo" />
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Ricambi() {
  return (<><Head title="Ricambi" sub="Magazzino ricambi e collegamento a RicambiPro" /><DtWrap>
    <DtSection title="Magazzino">
      <DtGrid><DtRow label="Codifica ricambi"><DtSelect id="cr" defaultValue="oem"><SelectItem value="oem" text="Codice OEM più progressivo" /><SelectItem value="prog" text="Solo progressivo" /></DtSelect></DtRow><DtRow label="Prossimo codice"><span className="rm-mono">RC-004812</span></DtRow></DtGrid>
      <DtRow label="Scaffali" wide><span>4 scaffali, 96 ripiani</span><Button kind="tertiary" size="sm">Gestisci scaffali</Button></DtRow>
      <DtRow label="Foto obbligatoria" wide><Tog id="fo" /><DtSuffix>per pubblicare un ricambio</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="RicambiPro">
      <DtGrid><DtRow label="Ambiente"><div style={{ width: 300 }}><ContentSwitcher selectedIndex={1} size="sm" onChange={() => {}}><Switch name="t" text="Preproduzione" /><Switch name="p" text="Produzione" /></ContentSwitcher></div></DtRow><DtRow label="Stato"><span>Collegato, ultimo scambio oggi alle 12:30</span></DtRow></DtGrid>
      <DtGrid><DtRow label="Nome utente"><DtInput id="ru" defaultValue="autobianchi" /></DtRow><DtRow label="Chiave segreta"><DtInput id="rk" type="password" defaultValue="chiavesegreta" /></DtRow></DtGrid>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Marketplace() {
  return (<><Head title="Marketplace" sub="Dove pubblicare i ricambi" draft="" actions={null} /><DtWrap>
    <DtSection title="Collegamenti">
      <DtRow label="eBay" wide><span>Collegato, account autobianchi-ricambi</span><DtSuffix>scade il 12 dicembre 2026</DtSuffix><Button kind="tertiary" size="sm">Scollega</Button></DtRow>
      <DtRow label="Shopify" wide><span className="rm-status--muted">Non collegato</span><DtInput id="sh" placeholder="mionegozio.myshopify.com" style={{ maxWidth: 280 }} /><Button kind="tertiary" size="md" renderIcon={Launch}>Collega con Shopify</Button></DtRow>
      <DtRow label="Subito" wide><span className="rm-status--muted">In arrivo</span></DtRow>
    </DtSection>
    <DtSection title="Come funziona">
      <DtRow label="1" wide><span>Colleghi il marketplace con il tuo account, nel browser.</span></DtRow>
      <DtRow label="2" wide><span>Pubblichi i ricambi dalla scheda del ricambio, con foto e prezzo.</span></DtRow>
      <DtRow label="3" wide><span>Le vendite tornano qui: il ricambio esce dal magazzino e si prepara la spedizione.</span></DtRow>
    </DtSection>
  </DtWrap></>);
}

function Unrae() {
  return (<><Head title="UNRAE" sub="Comunicazioni al portale e valori predefiniti" /><DtWrap>
    <DtSection title="Credenziali del portale">
      <DtGrid><DtRow label="Utente"><DtInput id="uu" defaultValue="UNRAE-12345" mono /></DtRow><DtRow label="Password"><DtInput id="up" type="password" defaultValue="password" /></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Predefiniti">
      <DtGrid><DtRow label="Codice casa"><DtInput id="cc" defaultValue="FIA" mono style={{ maxWidth: 120 }} /></DtRow><DtRow label="Marca preselezionata"><DtSelect id="mp" defaultValue="f"><SelectItem value="f" text="Fiat" /><SelectItem value="n" text="Nessuna" /></DtSelect></DtRow></DtGrid>
      <DtRow label="Bozza automatica" wide><Tog id="ba" /><DtSuffix>da ogni pratica VFU chiusa</DtSuffix></DtRow>
      <DtRow label="Invio automatico" wide><Tog id="ia" on={false} /><DtSuffix>invia al portale senza conferma. Meglio lasciarlo spento.</DtSuffix></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Cobat() {
  return (<><Head title="Percorso Cobat" sub="Chi riceve i veicoli e i pesi predefiniti dei ricambi per i tracciati" /><DtWrap>
    <DtSection title="Chi riceve i veicoli">
      <DtGrid><DtRow label="Impianto"><DtInput id="ci" defaultValue="Ecoferro S.r.l., Catania" /></DtRow><DtRow label="Codice Cobat"><DtInput id="cb" defaultValue="CB-04412" mono /></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Peso predefinito dei ricambi">
      <Tab cols={[['Categoria', 220], ['Peso medio', 120], ['Note']]} rows={[['Vetri', '18 kg', 'per veicolo'], ['Pneumatici', '28 kg', 'quattro'], ['Batteria', '14 kg', ''], ['Plastiche', '35 kg', 'paraurti e cruscotto']]} add="Nuova categoria" />
    </DtSection>
    <DtSection title="Tracciati">
      <DtRow label="Formato" wide><span>Record 2018.12, cinque tracciati</span><Button kind="tertiary" size="md" renderIcon={Download}>Prepara i file</Button></DtRow>
      <DtOk>Poi accedi alla tua area riservata Cobat e carica i cinque file.</DtOk>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Gps() {
  return (<><Head title="Tracking GPS" sub="Dispositivi, telefoni degli autisti e frequenza degli aggiornamenti" /><DtWrap>
    <DtSection title="Tracking">
      <DtRow label="Tracking attivo" wide><Tog id="ta" /><DtSuffix>spento, la mappa mostra solo i percorsi statici</DtSuffix></DtRow>
      <DtGrid><DtRow label="Mostra"><DtSelect id="ms" defaultValue="a"><SelectItem value="a" text="Solo trasporti in viaggio" /><SelectItem value="t" text="Tutti i trasporti con GPS" /></DtSelect></DtRow><DtRow label="Aggiornamento"><DtSelect id="ag" defaultValue="30"><SelectItem value="10" text="Ogni 10 secondi" /><SelectItem value="30" text="Ogni 30 secondi" /><SelectItem value="60" text="Ogni minuto" /><SelectItem value="120" text="Ogni 2 minuti" /></DtSelect></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Telefoni degli autisti, RescueMobile">
      <Tab cols={[['Autista', 200], ['Telefono', 180], ['Ultimo segnale'], ['Stato', 120]]} rows={[['Giuseppe Russo', 'iPhone 13', 'adesso', 'Attivo'], ['Salvatore Greco', 'Samsung A54', '2 minuti fa', 'Attivo'], ['Marco Ferro', 'Da abbinare', 'mai', 'In attesa']]} add="Abbina un telefono" />
      <DtRow label="Abbinamento" wide><Button kind="tertiary" size="md" renderIcon={QrCode}>Mostra codice QR</Button><DtSuffix>l'autista apre RescueMobile e inquadra il codice, oppure scrive il codice a sei cifre</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Tracker hardware">
      <Tab cols={[['Dispositivo', 200], ['IMEI', 170], ['Mezzo', 130], ['Ultimo segnale'], ['Stato', 120]]} rows={[['Teltonika FMB920', '352093081234567', 'FN 245 KL', '30 secondi fa', 'Attivo'], ['GT06N', '867329045678901', 'EX 812 CN', '1 minuto fa', 'Attivo'], ['Teltonika FMB920', '352093089876543', 'DA 331 HG', '3 giorni fa', 'Mai visto']]} add="Nuovo tracker" />
      <DtGrid><DtRow label="Server"><span className="rm-mono">gps.rescuemanager.eu</span></DtRow><DtRow label="Porta"><span className="rm-mono">5027, TCP</span><DtSuffix>per Teltonika e GT06</DtSuffix></DtRow></DtGrid>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Calendario() {
  return (<><Head title="Calendario" sub="Vista iniziale, durata degli appuntamenti e giorni festivi" /><DtWrap>
    <DtSection title="Vista">
      <DtGrid><DtRow label="Vista iniziale"><DtSelect id="vi" defaultValue="s"><SelectItem value="g" text="Giorno" /><SelectItem value="s" text="Settimana" /><SelectItem value="m" text="Mese" /></DtSelect></DtRow><DtRow label="Orario mostrato"><DtInput id="o1" defaultValue="07:00" style={{ maxWidth: 90 }} /><DtSuffix>alle</DtSuffix><DtInput id="o2" defaultValue="20:00" style={{ maxWidth: 90 }} /></DtRow></DtGrid>
      <DtGrid><DtRow label="Durata appuntamenti"><DtInput id="da" defaultValue="60" style={{ maxWidth: 90 }} /><DtSuffix>minuti</DtSuffix></DtRow><DtRow label="Promemoria"><DtInput id="pr" defaultValue="30" style={{ maxWidth: 90 }} /><DtSuffix>minuti prima</DtSuffix></DtRow></DtGrid>
      <DtRow label="Mostra nel calendario" wide>{['Soccorsi e trasporti', 'Appuntamenti', 'Scadenze mezzi', 'Scadenze RENTRI', 'Turni'].map((s) => <Checkbox key={s} id={'c' + s} labelText={s} defaultChecked />)}</DtRow>
    </DtSection>
    <DtSection title="Giorni festivi">
      <Tab cols={[['Giorno', 200], ['Nome'], ['Tariffa festiva', 140]]} rows={[['1 novembre 2026', 'Ognissanti', 'Sì'], ['8 dicembre 2026', 'Immacolata', 'Sì'], ['25 dicembre 2026', 'Natale', 'Sì'], ['26 dicembre 2026', 'Santo Stefano', 'Sì'], ['2 luglio', 'Patrono, Madonna delle Grazie', 'Sì']]} add="Nuovo giorno festivo" />
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Crm() {
  return (<><Head title="CRM clienti" sub="Categorie, tag e pipeline dei clienti" /><DtWrap>
    <DtSection title="Categorie">
      <Tab cols={[['Categoria', 200], ['Sconto predefinito', 150], ['Clienti', 100], ['Note']]} rows={[['Officina', '10 per cento', '14', ''], ['Carrozzeria', '10 per cento', '6', ''], ['Concessionaria', '15 per cento', '3', ''], ['Assicurazione', 'da convenzione', '2', 'Europ Assistance, ACI Global'], ['Privato', 'nessuno', '31', '']]} add="Nuova categoria" />
    </DtSection>
    <DtSection title="Tag">
      <DtRow label="Tag in uso" wide><span>Convenzionato, Paga in ritardo, Nuovo 2026, Flotta, Segnalato da officina</span><Button kind="tertiary" size="sm">Modifica</Button></DtRow>
    </DtSection>
    <DtSection title="Pipeline">
      <DtRow label="Fasi" wide><span>Contatto, Preventivo inviato, In trattativa, Cliente, Perso</span><Button kind="tertiary" size="sm">Modifica</Button></DtRow>
      <DtRow label="Promemoria" wide><DtInput id="pm" defaultValue="7" style={{ maxWidth: 90 }} /><DtSuffix>giorni senza contatto, poi compare in Da sistemare</DtSuffix></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Fatturazione() {
  return (<><Head title="Fatturazione" sub="Sistema di interscambio, numerazione, template e modalità di pagamento" /><DtWrap>
    <DtSection title="Trasmissione al Sistema di interscambio">
      <DtGrid><DtRow label="Codice destinatario"><DtInput id="cd" defaultValue="M5UXCR1" mono style={{ maxWidth: 160 }} /></DtRow><DtRow label="PEC alternativa"><DtInput id="pec" placeholder="tua-pec@legalmail.it" /></DtRow></DtGrid>
      <DtOk>Trasmissione attiva. Ultima ricevuta di consegna ieri alle 17:40.</DtOk>
    </DtSection>
    <DtSection title="Numerazione e documento">
      <DtGrid><DtRow label="Sezionale"><DtInput id="sz" defaultValue="unico" style={{ maxWidth: 160 }} /><DtSuffix>prossima: 2026/0143</DtSuffix></DtRow><DtRow label="Condizioni predefinite"><DtSelect id="cp" defaultValue="30"><SelectItem value="30" text="30 giorni data fattura" /><SelectItem value="0" text="Pagamento immediato" /></DtSelect></DtRow></DtGrid>
      <DtRow label="Parti del documento" wide>{[['Note', true], ['Bollo', false], ['Ritenuta', false], ['Cassa', false], ['Logo', true]].map(([s, on]) => <Checkbox key={s} id={'d' + s} labelText={s} defaultChecked={on} />)}</DtRow>
      <DtRow label="Note in calce" wide><DtInput id="nc" defaultValue="Operazione soggetta a IVA. Pagamento a 30 giorni salvo diverso accordo." /></DtRow>
    </DtSection>
    <DtSection title="Modalità di pagamento">
      <Tab cols={[['Modalità', 200], ['Codice SDI', 110], ['Dettagli'], ['Predefinita', 110]]} rows={[['Bonifico bancario', 'MP05', 'IT60 X054 2811 1010 0000 0123 456', 'Sì'], ['Contanti', 'MP01', '', 'No'], ['Carta', 'MP08', 'POS in sede', 'No']]} add="Nuova modalità" />
    </DtSection>
    <DtSection title="Righe predefinite">
      <Tab cols={[['Preset', 200], ['Descrizione'], ['Prezzo', 110], ['IVA', 80]]} rows={[['Uscita classe 1', 'Soccorso stradale classe 1', '45,00 euro', '22'], ['Chilometri', 'Chilometri a carico', '2,20 euro', '22'], ['Custodia', 'Custodia veicolo al giorno', '15,00 euro', '22']]} add="Nuovo preset" />
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Abbonamento() {
  return (<><Head title="Abbonamento" sub="Il tuo piano RescueManager" draft="" actions={<Button kind="tertiary" size="md" renderIcon={Launch}>Gestisci su rescuemanager.eu</Button>} /><DtWrap>
    <DtSection title="Piano">
      <DtGrid><DtRow label="Piano"><span style={{ fontWeight: 600 }}>Professional</span><DtSuffix>attivo</DtSuffix></DtRow><DtRow label="Prezzo"><span>149 euro al mese, IVA esclusa</span></DtRow></DtGrid>
      <DtGrid><DtRow label="Rinnovo"><span>1 ottobre 2026</span></DtRow><DtRow label="Giorni rimanenti"><span>7</span></DtRow></DtGrid>
      <DtGrid><DtRow label="Postazioni"><span>4 di 5 in uso</span></DtRow><DtRow label="Fatture del servizio"><span>nel portale di pagamento</span></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Moduli">
      {[['Soccorso e trasporti', 'Attivo'], ['Custodia veicoli', 'Attivo'], ['Demolizione VFU', 'Attivo'], ['Rifiuti RENTRI', 'Attivo'], ['Ricambi', 'Attivo'], ['Marketplace', 'Attivo'], ['UNRAE', 'Non attivo'], ['Percorso Cobat', 'Attivo'], ['Tracking GPS', 'Attivo'], ['Contabilità', 'Non attivo']].map(([m, s]) => <DtRow key={m} label={m} wide><span className={s === 'Attivo' ? '' : 'rm-status--muted'}>{s}</span>{s !== 'Attivo' && <Button kind="tertiary" size="sm">Attiva</Button>}</DtRow>)}
    </DtSection>
  </DtWrap></>);
}

function Pagamento() {
  return (<><Head title="Metodo di pagamento" sub="Come paghi l'abbonamento" draft="" actions={<Button kind="tertiary" size="md" renderIcon={Launch}>Modifica su rescuemanager.eu</Button>} /><DtWrap>
    <DtSection title="Metodo attuale">
      <DtGrid><DtRow label="Carta"><span>Carta con finale 4411</span></DtRow><DtRow label="Scadenza"><span>marzo 2028</span></DtRow></DtGrid>
      <DtRow label="Intestata a" wide><span>Autosoccorso Bianchi S.r.l.</span></DtRow>
      <DtOk>I dati della carta stanno solo nel portale di pagamento. Qui vedi solo le ultime cifre.</DtOk>
    </DtSection>
    <DtSection title="Ultimi addebiti">
      {[['1 settembre 2026', 'Professional, settembre', '181,78 euro'], ['1 agosto 2026', 'Professional, agosto', '181,78 euro'], ['1 luglio 2026', 'Professional, luglio', '181,78 euro']].map(([d, t, i]) => <div key={d} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}><span className="rm-muted">{d}</span><span>{t}</span><span style={{ textAlign: 'right' }}>{i}</span></div>)}
    </DtSection>
  </DtWrap></>);
}

function Notifiche() {
  return (<><Head title="Notifiche" sub="Cosa arriva, a chi, e con quanto anticipo" /><DtWrap>
    <DtSection title="Notifiche interne">
      <DtRow label="Dove arrivano" wide>{['Nell\'app', 'Email', 'RescueMobile'].map((s) => <Checkbox key={s} id={'n' + s} labelText={s} defaultChecked />)}</DtRow>
      <DtRow label="Avvisa per" wide>{['Trasporti assegnati', 'Preventivi', 'Fatture', 'Solleciti fatture'].map((s, i) => <Checkbox key={s} id={'a' + s} labelText={s} defaultChecked={i !== 1} />)}</DtRow>
      <DtRow label="Email di riserva" wide><DtInput id="er" placeholder="amministrazione@esempio.it" /><DtSuffix>ricevi sempre una copia qui</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Scadenze dei mezzi">
      <DtRow label="Attive" wide><Tog id="sm" /></DtRow>
      <DtRow label="Controlla" wide>{['Revisione', 'Assicurazione', 'Bollo', 'Tachigrafo', 'Licenza'].map((s) => <Checkbox key={s} id={'s' + s} labelText={s} defaultChecked />)}</DtRow>
      <DtRow label="Anticipo" wide><DtInput id="an" defaultValue="15" style={{ maxWidth: 90 }} /><DtSuffix>giorni prima della scadenza</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Scadenze delle demolizioni">
      <DtRow label="Attive" wide><Tog id="sd" /></DtRow>
      <DtRow label="Fasi da controllare" wide>{['Invio a STA entro 30 giorni', 'Radiazione entro 60 giorni', 'Conferimento entro 180 giorni'].map((s) => <Checkbox key={s} id={'f' + s} labelText={s} defaultChecked />)}</DtRow>
    </DtSection>
    <DtSection title="Invio automatico dei documenti al cliente">
      <DtRow label="Fatture" wide><Tog id="if" /><DtSuffix>all'email del cliente, altrimenti alla PEC</DtSuffix></DtRow>
      <DtRow label="Preventivi" wide><Tog id="ip" on={false} /></DtRow>
      <DtRow label="Email inviate da" wide><span>notifiche@rescuemanager.eu</span><DtSuffix>con il nome della tua azienda come mittente</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Ultime email inviate">
      {[['Oggi 14:43', 'Sollecito fattura 2026/0104', 'amministrazione@europassistance.it'], ['Ieri 17:41', 'Fattura 2026/0142', 'info@autofficinavella.it'], ['22 set', 'Scadenza revisione FN 245 KL', 'info@autosoccorsobianchi.it']].map(([d, t, a]) => <div key={d + t} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}><span className="rm-muted">{d}</span><span>{t}</span><span className="rm-muted">{a}</span></div>)}
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Etichette() {
  return (<><Head title="Stampante etichette" sub="Etichette dei ricambi e dei veicoli in custodia" /><DtWrap>
    <DtSection title="Stampante">
      <DtGrid><DtRow label="Stampante"><DtSelect id="st" defaultValue="b"><SelectItem value="b" text="Brother QL-820NWB, ufficio" /><SelectItem value="n" text="Nessuna, scarica PDF" /></DtSelect><Button kind="tertiary" size="md" renderIcon={Renew}>Rileva</Button></DtRow><DtRow label="Dimensione"><DtInput id="dw" defaultValue="62" style={{ maxWidth: 80 }} /><DtSuffix>per</DtSuffix><DtInput id="dh" defaultValue="29" style={{ maxWidth: 80 }} /><DtSuffix>millimetri</DtSuffix></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Contenuto">
      <DtGrid><DtRow label="Intestazione"><DtInput id="in" defaultValue="Autosoccorso Bianchi" /></DtRow><DtRow label="Dimensione testo"><DtSelect id="dt" defaultValue="m"><SelectItem value="s" text="Piccolo" /><SelectItem value="m" text="Normale" /><SelectItem value="l" text="Grande" /></DtSelect></DtRow></DtGrid>
      <DtRow label="Sull'etichetta" wide>{['Codice', 'Descrizione', 'Scaffale', 'Prezzo', 'Codice a barre'].map((s, i) => <Checkbox key={s} id={'e' + s} labelText={s} defaultChecked={i !== 3} />)}</DtRow>
      <DtRow label="Prova" wide><Button kind="tertiary" size="md" renderIcon={Printer}>Stampa etichetta di prova</Button></DtRow>
    </DtSection>
    <DtFooter actions={SALVA} /></DtWrap></>);
}

function Backup() {
  return (<><Head title="Dati e backup" sub="Esporta, ripristina e importa" draft="" actions={null} /><DtWrap>
    <DtSection title="Impostazioni">
      <DtRow label="Esporta" wide><Button kind="tertiary" size="md" renderIcon={Download}>Scarica tutte le impostazioni</Button><DtSuffix>un file JSON con listini, preset, zone, notifiche</DtSuffix></DtRow>
      <DtRow label="Ripristina" wide><Button kind="tertiary" size="md" renderIcon={Upload}>Ripristina da file</Button><DtSuffix>sostituisce le impostazioni attuali, i dati restano</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Importa dati da Excel o CSV">
      <DtGrid><DtRow label="Tipo di dato"><DtSelect id="td" defaultValue="c"><SelectItem value="c" text="Clienti" /><SelectItem value="m" text="Mezzi" /><SelectItem value="r" text="Ricambi" /><SelectItem value="v" text="Veicoli in custodia" /></DtSelect></DtRow><DtRow label="Se già presente"><DtSelect id="sp" defaultValue="a"><SelectItem value="a" text="Aggiorna" /><SelectItem value="s" text="Salta" /></DtSelect></DtRow></DtGrid>
      <DtRow label="File" wide><Button kind="tertiary" size="md" renderIcon={Upload}>Scegli il file</Button><DtSuffix>le colonne vengono riconosciute da sole, poi le confermi</DtSuffix></DtRow>
      <DtOk>Ultimo import il 3 marzo: 212 clienti, 198 creati, 14 aggiornati, 0 saltati.</DtOk>
    </DtSection>
    <DtSection title="Dati dell'azienda">
      <DtRow label="Esporta tutto" wide><Button kind="tertiary" size="md" renderIcon={Download}>Richiedi l'esportazione</Button><DtSuffix>arriva via email entro un'ora, in CSV</DtSuffix></DtRow>
    </DtSection>
  </DtWrap></>);
}

function Sistema() {
  return (<><Head title="Sistema" sub="Versione dell'app, ambiente e dati dimostrativi" draft="" actions={null} /><DtWrap>
    <DtSection title="App">
      <DtGrid><DtRow label="Versione"><span>2.4.17</span><DtSuffix>aggiornata il 18 settembre</DtSuffix></DtRow><DtRow label="Aggiornamenti"><span>Nessun aggiornamento disponibile</span><Button kind="tertiary" size="sm" renderIcon={Renew}>Controlla</Button></DtRow></DtGrid>
      <DtGrid><DtRow label="Ambiente"><span>Produzione</span></DtRow><DtRow label="Server"><span className="rm-mono">api.rescuemanager.eu</span></DtRow></DtGrid>
      <DtGrid><DtRow label="Sincronizzazione"><span>Ultima oggi alle 14:41, tutto allineato</span></DtRow><DtRow label="Dati in locale"><span>184 MB</span><Button kind="tertiary" size="sm">Svuota</Button></DtRow></DtGrid>
    </DtSection>
    <DtSection title="Dati dimostrativi">
      <DtRow label="Modalità demo" wide><Tog id="dm" on={false} /><DtSuffix>mostra clienti e trasporti finti per fare pratica</DtSuffix></DtRow>
    </DtSection>
    <DtSection title="Diagnostica">
      <DtRow label="Registro eventi" wide><Button kind="tertiary" size="md" renderIcon={Document}>Apri il registro</Button><Button kind="tertiary" size="md" renderIcon={Download}>Scarica</Button></DtRow>
      <DtRow label="Supporto" wide><Button kind="tertiary" size="md">Contatta il supporto</Button><DtSuffix>allega da solo versione, ambiente e ultimi errori</DtSuffix></DtRow>
    </DtSection>
  </DtWrap></>);
}

function Generica({ nome }) {
  return (<><Head title={nome} sub="Stessa struttura: sezioni con righe, una impostazione per riga" /><DtWrap><DtSection title="Impostazioni"><DtRow label="Attivo" wide><Tog id="on" /></DtRow></DtSection><DtFooter actions={SALVA} /></DtWrap></>);
}

const SEZIONI = { organizzazione: Organizzazione, personale: Personale, sicurezza: Sicurezza, profilo: Profilo, soccorso: Soccorso, custodia: Custodia, demolizione: Demolizione, rentri: Rentri, ricambi: Ricambi, marketplace: Marketplace, unrae: Unrae, cobat: Cobat, gps: Gps, calendario: Calendario, crm: Crm, fatturazione: Fatturazione, abbonamento: Abbonamento, pagamento: Pagamento, notifiche: Notifiche, etichette: Etichette, backup: Backup, sistema: Sistema };
