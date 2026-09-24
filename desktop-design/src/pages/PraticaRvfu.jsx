import { Button, IconButton, ProgressIndicator, ProgressStep, Tabs, TabList, Tab } from '@carbon/react';
import { Send, Document, Download, Upload, OverflowMenuHorizontal, Printer } from '@carbon/icons-react';
import { DtRoot, DtHead, DtSection, DtRow, DtGrid, DtOk } from '../components/Datasheet.jsx';
import Card from '../components/Card.jsx';

// Dettaglio pratica RVFU: timeline di lavorazione a sinistra, dati e documenti al centro. Corrisponde a src/pages/DemolizioneRVFUDettaglio.jsx e components/rvfu/RVFUDetail.jsx.
const FASI = [
  ['Registrazione', 'Inserita il 18 settembre alle 10:12', 'done'], ['Presa in carico', '18 settembre, operatore Emmanuel', 'done'], ['Ritiro', '19 settembre, carro FN 245 KL', 'done'],
  ['Conferimento', '20 settembre, centro DETO003001', 'done'], ['Demolizione', 'In corso, bonifica completata il 23 settembre', 'current'], ['Invio a STA', 'Da fare: certificato di demolizione', 'todo'], ['Radiazione', 'PRA, dopo l\'esito STA', 'todo'],
];
const DOCS = [['Carta di circolazione', 'PDF, 2 pagine, caricata il 18 settembre', 'ok'], ['Documento identità del proprietario', 'PDF, caricato il 18 settembre', 'ok'], ['Foto veicolo prima', '6 foto, 19 settembre', 'ok'], ['Foto veicolo dopo', 'Manca', 'no'], ['Certificato di demolizione', 'Si genera dopo la demolizione', 'no'], ['Formulario RENTRI per conferimento', 'FIR 2026-00412, 20 settembre', 'ok'], ['Fattura per servizio demolizione', 'Non ancora emessa', 'no']];
export default function PraticaRvfu() {
  const azioni = <><Button kind="secondary" size="md" renderIcon={Printer}>Stampa scheda</Button><Button size="md" renderIcon={Send}>Invia conferma demolizione</Button></>;
  return (
    <DtRoot>
      <DtHead crumb="Demolizioni RVFU" title="AB 123 CD" sub="Fiat Punto 1.3 Multijet del 2008, pratica RVFU 2026-0087" draft="In demolizione da 4 giorni" actions={azioni} back="/demolizioni-rvfu" />
      <div style={{ display: 'flex', gap: 16, padding: '16px 16px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ width: 300, flex: '0 0 300px' }}>
          <Card title="Lavorazione" extra="fase 5 di 7">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FASI.map(([t, d, st], i) => (
                <div key={t} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 10, padding: '8px 0', borderTop: i ? '1px solid var(--border)' : 0 }}>
                  <span style={{ width: 18, height: 18, marginTop: 1, background: st === 'done' ? 'var(--brand)' : 'transparent', border: '1px solid ' + (st === 'todo' ? 'var(--border-strong)' : 'var(--brand)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: st === 'done' ? '#fff' : 'var(--brand-text)' }}>{i + 1}</span>
                  <div><div style={{ fontSize: 13, fontWeight: st === 'current' ? 600 : 400, color: st === 'todo' ? 'var(--text-secondary)' : 'var(--text)' }}>{t}</div><div className="rm-muted">{d}</div></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}><Button kind="tertiary" size="sm" style={{ width: '100%', maxWidth: 'none' }}>Avanza a Invio a STA</Button></div>
          </Card>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 12 }}><Tabs selectedIndex={0}><TabList aria-label="Sezioni"><Tab>Dettagli</Tab><Tab>Soggetti</Tab><Tab>Documenti 7</Tab><Tab>Rifiuti</Tab><Tab>Fatturazione</Tab></TabList></Tabs></div>
          <DtSection title="Veicolo">
            <DtGrid><DtRow label="Targa"><span className="rm-mono">AB 123 CD</span></DtRow><DtRow label="Telaio"><span className="rm-mono">ZFA19900001234567</span></DtRow></DtGrid>
            <DtGrid><DtRow label="Tipo veicolo"><span>Autovettura, Fiat Punto 1.3 Multijet</span></DtRow><DtRow label="Immatricolazione"><span>14 maggio 2008</span></DtRow></DtGrid>
            <DtGrid><DtRow label="Obbligo iscrizione PRA"><span>Sì</span></DtRow><DtRow label="Causale"><span>Demolizione volontaria</span></DtRow></DtGrid>
          </DtSection>
          <DtSection title="Soggetti">
            <DtGrid><DtRow label="Proprietario"><span>Rosa Vella, codice fiscale VLLRSO70A41D960K</span></DtRow><DtRow label="Centro di raccolta"><span>Scozzarini Service Car, DETO003001</span></DtRow></DtGrid>
            <DtGrid><DtRow label="Conferito da"><span>Autosoccorso Bianchi, carro FN 245 KL</span></DtRow><DtRow label="Data conferimento"><span>20 settembre 2026</span></DtRow></DtGrid>
          </DtSection>
          <DtSection title="Documenti">
            {DOCS.map(([n, d, st]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}>
                <Document size={16} style={{ fill: st === 'ok' ? 'var(--text)' : 'var(--text-secondary)' }} />
                <div style={{ flex: 1 }}><div style={{ color: st === 'ok' ? 'var(--text)' : 'var(--text-secondary)' }}>{n}</div><div className="rm-muted">{d}</div></div>
                {st === 'ok' ? <IconButton kind="ghost" size="sm" label="Scarica"><Download /></IconButton> : <Button kind="tertiary" size="sm" renderIcon={Upload}>Carica</Button>}
              </div>
            ))}
            <DtOk>Per l'invio a STA mancano le foto dopo la demolizione e il certificato.</DtOk>
          </DtSection>
        </div>
      </div>
    </DtRoot>
  );
}
