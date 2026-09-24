import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button, IconButton, Dropdown, ContentSwitcher, Switch, SelectItem, Checkbox } from '@carbon/react';
import { Add, Upload, Download, Send, Search, OverflowMenuHorizontal, Renew, Checkmark } from '@carbon/icons-react';
import PageHeader from '../../components/PageHeader.jsx';
import StatusTabs from '../../components/StatusTabs.jsx';
import ListTable, { Two, Stato } from '../../components/ListTable.jsx';
import DetailPanel from '../../components/DetailPanel.jsx';
import Card, { KpiTile } from '../../components/Card.jsx';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtErr, DtInput, DtSelect, DtSuffix, DtFooter } from '../../components/Datasheet.jsx';

// UNRAE: comunicazioni delle demolizioni alle case automobilistiche. Un modulo con quattro pagine sotto lo stesso titolo:
// Demolizioni (lista con pannello), Nuova comunicazione (datasheet), Reti di vendita (lista), Caricamento massivo (datasheet con anteprima).
// La sintesi sta in testa alla lista, non in una pagina a parte. Corrisponde a src/pages/unrae/*.
const SEZ = [['/unrae', 'Demolizioni'], ['/unrae/reti', 'Reti di vendita'], ['/unrae/upload', 'Caricamento massivo']];
export function UnraeLayout() {
  const nav = useNavigate(); const { pathname } = useLocation();
  const idx = pathname.startsWith('/unrae/reti') ? 1 : pathname.startsWith('/unrae/upload') ? 2 : 0;
  const nuovo = pathname.startsWith('/unrae/inserimento');
  if (nuovo) return <Outlet />;
  return (
    <div className="rm-page" style={{ padding: 0 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <PageHeader title="UNRAE" sub="Comunicazioni delle demolizioni alle case, Fiat e Stellantis" actions={<><Button kind="tertiary" size="md" renderIcon={Upload} onClick={() => nav('/unrae/upload')}>Carica un file</Button><Button size="md" renderIcon={Add} onClick={() => nav('/unrae/inserimento')}>Nuova comunicazione</Button></>} />
        <div style={{ width: 460, margin: '8px 0 0' }}><ContentSwitcher selectedIndex={idx} size="md" onChange={(e) => nav(SEZ[e.index][0])}>{SEZ.map(([, l]) => <Switch key={l} name={l} text={l} />)}</ContentSwitcher></div>
      </div>
      <Outlet />
    </div>
  );
}

const DEM = [
  { id: 'AB 123 CD', mod: 'Fiat Punto 1.3 Multijet', tel: 'ZFA19900001234567', rad: '24 set 2026', rot: '23 set 2026', prov: 'Privato, Rosa Vella', st: 'Bozza', stt: 'new', sts: 'modificabile fino al 27 settembre' },
  { id: 'CD 456 EF', mod: 'Fiat 500 1.2', tel: 'ZFA31200001112223', rad: '22 set 2026', rot: '20 set 2026', prov: 'Rete R12345, Autosalone Rossi', st: 'Inviata', stt: 'muted', sts: 'in attesa di esito' },
  { id: 'GH 789 IL', mod: 'Lancia Ypsilon 1.3', tel: 'ZLA84300004445556', rad: '18 set 2026', rot: '16 set 2026', prov: 'Privato, Mario Rossi', st: 'Accettata', stt: 'muted', sts: '19 settembre' },
  { id: 'MN 012 OP', mod: 'Alfa Romeo Mito 1.4', tel: 'ZAR95500007778889', rad: '15 set 2026', rot: '12 set 2026', prov: 'Assicurazione, Europ Assistance', st: 'Rifiutata', stt: 'late', sts: 'telaio non corrisponde' },
  { id: 'QR 345 ST', mod: 'Fiat Panda 1.2', tel: 'ZFA16900000001112', rad: '10 set 2026', rot: '8 set 2026', prov: 'Privato, Francesco Amato', st: 'Accettata', stt: 'muted', sts: '11 settembre' },
];
const COLD = [{ key: 'id', label: 'Targa', width: 96, render: (r) => <Two a={<b>{r.id}</b>} b={r.mod} /> }, { key: 'tel', label: 'Telaio', width: 170, render: (r) => <span className="rm-mono">{r.tel}</span> }, { key: 'rad', label: 'Radiazione', width: 110, render: (r) => <Two a={r.rad} b={'rottamata il ' + r.rot.slice(0, 6)} /> }, { key: 'prov', label: 'Provenienza', width: 180 }, { key: 'st', label: 'Stato', width: 150, render: (r) => <Stato testo={r.st} sotto={r.sts} tono={r.stt} /> }];
export function UnraeDemolizioni() {
  const [sel, setSel] = useState('MN 012 OP'); const [tab, setTab] = useState(0); const nav = useNavigate();
  const r = DEM.find((x) => x.id === sel);
  return (
    <div className="rm-split" style={{ marginTop: 8 }}>
      <div className="rm-split__list" style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 1, marginBottom: 12 }}><KpiTile label="Inviate nel 2026" value="184" context="Fiat 131, Lancia 22, Alfa Romeo 31" /><KpiTile label="Accettate" value="176" context="96 per cento" /><KpiTile label="Rifiutate" value="3" context="da correggere e reinviare" /><KpiTile label="Bozze" value="5" context="2 scadono domani" /></div>
        <StatusTabs items={[['Tutte', 189], ['Bozze', 5], ['Inviate', 5], ['Accettate', 176], ['Rifiutate', 3]]} selected={tab} onChange={setTab} right={<><Dropdown id="m" size="sm" label="Marca" items={['Tutte le marche']} style={{ width: 150 }} /><Dropdown id="p" size="sm" label="Periodo" items={['Settembre']} style={{ width: 120 }} /></>} />
        <ListTable columns={COLD} rows={DEM} selectedKey={sel} onSelect={(x) => setSel(x.id)} footer="189 comunicazioni, aggiornato alle 15:30" />
      </div>
      <DetailPanel code={r.id} name={r.mod} lines={['Telaio ' + r.tel, r.prov]} metrics={[['Radiazione', r.rad.slice(0, 6), r.rad.slice(7)], ['Rottamazione', r.rot.slice(0, 6), r.rot.slice(7)]]}
        pairs={[['Stato', r.st + ', ' + r.sts], ['Codice casa', 'FIA'], ['Categoria UE', 'M1'], ['Certificato', 'n. 4412 del ' + r.rot], ['Pratica RVFU', '2026-0087']]}
        activity={r.stt === 'late' ? [['16 set', 'Rifiutata: telaio non corrisponde alla targa'], ['15 set', 'Inviata a UNRAE'], ['15 set', 'Creata da pratica RVFU']] : [['24 set', 'Bozza creata da pratica RVFU 2026-0087']]}
        actions={r.stt === 'late' ? <><Button kind="secondary" size="md" onClick={() => nav('/unrae/inserimento')}>Correggi</Button><Button size="md" renderIcon={Send}>Reinvia</Button></> : r.st === 'Bozza' ? <><Button kind="secondary" size="md" onClick={() => nav('/unrae/inserimento')}>Modifica</Button><Button size="md" renderIcon={Send}>Invia a UNRAE</Button></> : <><Button kind="secondary" size="md" renderIcon={Download}>Ricevuta</Button><Button size="md">Apri pratica</Button></>} />
    </div>
  );
}

export function UnraeInserimento() {
  const nav = useNavigate();
  const azioni = <><Button kind="secondary" size="md">Salva bozza</Button><Button size="md" renderIcon={Send}>Invia a UNRAE</Button></>;
  return (
    <DtRoot>
      <DtHead crumb="UNRAE" title="Nuova comunicazione" sub="Demolizione da comunicare alla casa" draft="Bozza da pratica RVFU 2026-0087" pct={70} actions={azioni} back="/unrae" />
      <DtWrap>
        <DtSection title="Veicolo">
          <DtGrid><DtRow label="Targa" req><DtInput id="t" defaultValue="AB 123 CD" mono /><Button kind="tertiary" size="md" renderIcon={Search}>Cerca in archivio</Button></DtRow><DtRow label="Telaio" req><DtInput id="v" defaultValue="ZFA19900001234567" mono /></DtRow></DtGrid>
          <DtOk>Trovata la pratica RVFU 2026-0087 e la custodia del 19 settembre: dati copiati da lì.</DtOk>
          <DtGrid><DtRow label="Marca, codice casa" req><DtSelect id="m" defaultValue="FIA"><SelectItem value="FIA" text="Fiat, FIA" /><SelectItem value="LAN" text="Lancia, LAN" /><SelectItem value="ALF" text="Alfa Romeo, ALF" /></DtSelect></DtRow><DtRow label="Modello"><DtInput id="mo" defaultValue="Punto 1.3 Multijet" /></DtRow></DtGrid>
          <DtGrid><DtRow label="Categoria UE"><DtSelect id="c" defaultValue="M1"><SelectItem value="M1" text="M1, autovettura" /><SelectItem value="N1" text="N1, veicolo commerciale leggero" /><SelectItem value="L" text="L, motociclo" /></DtSelect><Button kind="tertiary" size="sm">Deduci</Button></DtRow><DtRow label="Immatricolazione" req><DtInput id="im" defaultValue="14 maggio 2008" /></DtRow></DtGrid>
        </DtSection>
        <DtSection title="Radiazione">
          <DtGrid><DtRow label="Data di radiazione" req><DtInput id="dr" defaultValue="24 settembre 2026" /></DtRow><DtRow label="Certificato"><DtInput id="nc" defaultValue="4412" mono style={{ maxWidth: 140 }} /><DtSuffix>del</DtSuffix><DtInput id="dc" defaultValue="24 settembre 2026" /></DtRow></DtGrid>
        </DtSection>
        <DtSection title="Rottamazione">
          <DtGrid><DtRow label="Data messa in sicurezza"><DtInput id="ms" defaultValue="23 settembre 2026" /></DtRow><DtRow label="Certificato di rottamazione"><DtInput id="cr" defaultValue="CR-2026-0087" mono /><DtSuffix>del 23 settembre</DtSuffix></DtRow></DtGrid>
        </DtSection>
        <DtSection title="Provenienza">
          <DtRow label="Da chi arriva" wide><div style={{ width: 560 }}><ContentSwitcher selectedIndex={0} size="md" onChange={() => {}}><Switch name="p" text="Privato" /><Switch name="r" text="Rete di vendita" /><Switch name="a" text="Assicurazione" /><Switch name="g" text="Autorità giudiziaria" /></ContentSwitcher></div></DtRow>
          <DtGrid><DtRow label="Cognome e nome" req><DtInput id="cn" defaultValue="Vella Rosa" /></DtRow><DtRow label="Codice fiscale" req><DtInput id="cf" defaultValue="VLLRSO70A41D960K" mono /></DtRow></DtGrid>
          <DtGrid><DtRow label="Comune"><DtInput id="co" defaultValue="Gela" /></DtRow><DtRow label="Provincia"><DtInput id="pr" defaultValue="CL" style={{ maxWidth: 72, textAlign: 'center' }} /></DtRow></DtGrid>
        </DtSection>
        <DtSection title="Prima di inviare">
          <DtOk>Dopo l'invio la comunicazione resta modificabile per 3 giorni, poi solo UNRAE può cambiarla.</DtOk>
          <DtRow label="Controlli" wide><span>Telaio con 17 caratteri, targa nel formato italiano, date coerenti: rottamazione prima della radiazione.</span></DtRow>
        </DtSection>
        <DtFooter hints={[['Ctrl S', 'salva bozza'], ['Ctrl Invio', 'invia'], ['Esc', 'esci']]} actions={azioni} />
      </DtWrap>
    </DtRoot>
  );
}

const RETI = [{ c: 'R12345', n: 'Autosalone Rossi S.r.l.', m: 'Fiat, Lancia', ind: 'Via Roma 12', com: 'Gela', pr: 'CL', st: 'Attiva', n2: 31 }, { c: 'R22871', n: 'Concessionaria Auto Gela', m: 'Fiat, Alfa Romeo', ind: 'SS 115 km 3', com: 'Gela', pr: 'CL', st: 'Attiva', n2: 18 }, { c: 'R30412', n: 'Motori Sud S.p.A.', m: 'Alfa Romeo', ind: 'Via Etnea 401', com: 'Catania', pr: 'CT', st: 'Attiva', n2: 7 }, { c: 'R09811', n: 'Autocentro Niscemi', m: 'Fiat', ind: 'Via Lauria 3', com: 'Niscemi', pr: 'CL', st: 'Disattivata', n2: 0 }];
const COLR = [{ key: 'c', label: 'Codice rete', width: 110, render: (r) => <span className="rm-mono">{r.c}</span> }, { key: 'n', label: 'Rete di vendita', width: 220, render: (r) => <Two a={<b>{r.n}</b>} b={r.m} /> }, { key: 'ind', label: 'Indirizzo', width: 200, render: (r) => <Two a={r.ind} b={r.com + ' (' + r.pr + ')'} /> }, { key: 'n2', label: 'Comunicazioni 2026', width: 140 }, { key: 'st', label: 'Stato', width: 110, render: (r) => <span className={r.st === 'Attiva' ? '' : 'rm-status--muted'}>{r.st}</span> }];
export function UnraeReti() {
  const [sel, setSel] = useState('R12345');
  return (
    <div className="rm-split" style={{ marginTop: 8 }}>
      <div className="rm-split__list" style={{ paddingTop: 8 }}>
        <StatusTabs items={[['Tutte', 4], ['Attive', 3], ['Disattivate', 1]]} right={<><Dropdown id="m" size="sm" label="Marca" items={['Tutte le marche']} style={{ width: 150 }} /><Button kind="tertiary" size="sm" renderIcon={Add}>Nuova rete</Button></>} />
        <ListTable columns={COLR} rows={RETI} rowKey="c" selectedKey={sel} onSelect={(x) => setSel(x.c)} selectable={false} footer="4 reti di vendita" />
      </div>
      <DetailPanel code="R12345" name="Autosalone Rossi S.r.l." lines={['Fiat e Lancia', 'Via Roma 12, Gela (CL)']} metrics={[['Nel 2026', '31', 'comunicazioni'], ['Ultima', '22 set', 'CD 456 EF']]} pairs={[['Codice concessionario', 'C-0412'], ['Referente', 'Antonio Rossi'], ['Telefono', '0933 555555'], ['Stato', 'Attiva dal 2024']]} actions={<><Button kind="secondary" size="md">Disattiva</Button><Button size="md">Modifica</Button></>} />
    </div>
  );
}

const UP = [['AB 123 CD', 'ZFA19900001234567', 'Punto 1.3', '14/05/2008', '24/09/2026', 'Privato', 'Pronta', 'muted'], ['CD 456 EF', 'ZFA31200001112223', '500 1.2', '02/03/2012', '22/09/2026', 'R12345', 'Pronta', 'muted'], ['GH 789 IL', 'ZLA843000044455', 'Ypsilon', '11/11/2010', '18/09/2026', 'Privato', 'Telaio di 15 caratteri', 'late'], ['MN 012 OP', 'ZAR95500007778889', 'Mito 1.4', '', '15/09/2026', 'Assicurazione', 'Manca la data di immatricolazione', 'late']];
export function UnraeUpload() {
  return (
    <div style={{ padding: '8px 16px 24px' }}>
      <DtRoot><DtWrap>
        <DtSection title="File">
          <DtRow label="File" wide><Button kind="tertiary" size="md" renderIcon={Upload}>Scegli il file</Button><DtSuffix>demolizioni-settembre.xlsx, 4 righe, letto alle 15:31</DtSuffix></DtRow>
          <DtGrid><DtRow label="Formato"><span>Excel o CSV con le colonne del tracciato UNRAE</span><Button kind="tertiary" size="sm" renderIcon={Download}>Modello</Button></DtRow><DtRow label="Se già presente"><DtSelect id="sp" defaultValue="s"><SelectItem value="s" text="Salta" /><SelectItem value="a" text="Aggiorna la bozza" /></DtSelect></DtRow></DtGrid>
        </DtSection>
        <DtSection title="Anteprima">
          <div className="rm-table" style={{ borderTop: '1px solid var(--border)' }}>
            <table className="cds--data-table cds--data-table--md" style={{ width: '100%', tableLayout: 'fixed' }}>
              <colgroup>{[96, 170, 100, 110, 110, 110, 1].map((w, i) => <col key={i} style={w > 1 ? { width: w } : {}} />)}</colgroup>
              <thead><tr><th>Targa</th><th>Telaio</th><th>Modello</th><th>Immatricolazione</th><th>Radiazione</th><th>Provenienza</th><th>Esito</th></tr></thead>
              <tbody>{UP.map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td className="rm-mono">{r[1]}</td><td>{r[2]}</td><td>{r[3] || <span className="rm-status--muted">manca</span>}</td><td>{r[4]}</td><td>{r[5]}</td><td className={'rm-status--' + r[7]}>{r[6]}</td></tr>)}</tbody>
            </table>
          </div>
          <DtErr>2 righe su 4 hanno errori: si caricano solo le righe pronte, le altre restano nel file.</DtErr>
        </DtSection>
        <DtSection title="Caricamenti precedenti">
          {[['18 settembre', 'demolizioni-agosto.xlsx', '22 righe, 22 caricate'], ['3 settembre', 'demolizioni-luglio.xlsx', '19 righe, 18 caricate, 1 con errori']].map(([d, f, e]) => <div key={f} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}><span className="rm-muted">{d}</span><span>{f}</span><span className="rm-muted">{e}</span></div>)}
        </DtSection>
        <DtFooter hints={[['Esc', 'annulla']]} actions={<><Button kind="secondary" size="md">Annulla</Button><Button size="md" renderIcon={Checkmark}>Carica 2 comunicazioni</Button></>} />
      </DtWrap></DtRoot>
    </div>
  );
}
