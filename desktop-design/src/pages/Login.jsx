import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tile, Layer, Stack, Link, InlineNotification } from '@carbon/react';
import { Launch, Security, Time, Restart, Close, CheckmarkOutline, Incomplete, CircleDash } from '@carbon/icons-react';
import LoginFrame from '../components/LoginFrame.jsx';

// Accesso reale dell'app: nessun campo email o password, si apre il browser (OAuth su rescuemanager.eu,
// ritorno con desktop://auth/callback). Nell'app: OAuthService.startLogin() al posto di startDemo().
const PASSI = [
  ['Connessione', 'Collegato a rescuemanager.eu'],
  ['Verifica', 'App desktop riconosciuta'],
  ['Autorizzazione', 'In attesa della tua conferma nel browser'],
  ['Completato', ''],
];

function Passo({ label, sub, state }) {
  const Icon = state === 'done' ? CheckmarkOutline : state === 'current' ? Incomplete : CircleDash;
  const col = state === 'todo' ? 'var(--text-secondary)' : 'var(--brand-text)';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44 }}>
      <Icon size={16} style={{ fill: col, flex: '0 0 auto', marginTop: 1 }} />
      <div><div style={{ fontSize: 13, fontWeight: state === 'current' ? 600 : 400 }}>{label}</div>{sub && <div className="rm-muted">{sub}</div>}</div>
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();
  const [fase, setFase] = useState('idle'); // idle, attesa, errore
  const [passo, setPasso] = useState(0);
  const [secondi, setSecondi] = useState(300);

  // Solo per la demo: avanza i passi da solo. Nell'app i passi seguono OAuthService.
  useEffect(() => {
    if (fase !== 'attesa') return;
    const t = setInterval(() => setSecondi((s) => s - 1), 1000);
    const a = setTimeout(() => setPasso(1), 700);
    const b = setTimeout(() => setPasso(2), 1500);
    return () => { clearInterval(t); clearTimeout(a); clearTimeout(b); };
  }, [fase]);

  const startDemo = () => { setFase('attesa'); setPasso(0); setSecondi(300); };
  const mm = Math.floor(secondi / 60), ss = secondi % 60;

  return (
    <LoginFrame>
      <Layer>
        <Tile className="rm-login__card">
          {fase === 'idle' || fase === 'errore' ? (
            <Stack gap={6}>
              <div><h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Accedi</h2><div className="rm-muted" style={{ fontSize: 13, marginTop: 4 }}>Entra nel tuo account per continuare</div></div>
              {fase === 'errore' && <InlineNotification kind="error" lowContrast hideCloseButton title="Accesso non completato" subtitle="Il codice e' scaduto. Riprova." style={{ maxWidth: 'none' }} />}
              <div>
                <Button className="rm-full" renderIcon={Launch} onClick={startDemo}>Accedi con il browser</Button>
                <div className="rm-muted" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Security size={14} /> Si aprirà il browser per l'autenticazione sicura</div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div className="rm-muted" style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Come funziona</div>
                <Stack gap={4}>
                  <div className="rm-step"><i>1</i><div><b>Premi Accedi con il browser</b><span className="rm-muted">L'app apre rescuemanager.eu nel browser di sistema</span></div></div>
                  <div className="rm-step"><i>2</i><div><b>Accedi nel browser</b><span className="rm-muted">Con email e password oppure con Google</span></div></div>
                  <div className="rm-step"><i>3</i><div><b>Torna nell'app</b><span className="rm-muted">L'autorizzazione arriva da sola, senza copiare codici</span></div></div>
                </Stack>
              </div>
              <div className="rm-muted">Non hai un account? <Link href="https://rescuemanager.eu/register" style={{ fontSize: 12 }}>Registrati su rescuemanager.eu</Link></div>
            </Stack>
          ) : (
            <Stack gap={6}>
              <div><h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Accesso in corso</h2><div className="rm-muted" style={{ fontSize: 13, marginTop: 4 }}>Completa l'accesso nella finestra del browser</div></div>
              <div>{PASSI.map(([l, s], i) => <Passo key={l} label={l} sub={s} state={i < passo ? 'done' : i === passo ? 'current' : 'todo'} />)}</div>
              <div className="rm-note"><Time size={16} /> Scade tra {mm} minuti e {ss} secondi</div>
              <div className="rm-btnrow">
                <Button kind="secondary" renderIcon={Restart} onClick={() => setPasso(0)}>Riapri il browser</Button>
                <Button kind="secondary" renderIcon={Close} onClick={() => setFase('idle')}>Annulla</Button>
              </div>
              {/* Solo per la demo: entra nell'app */}
              <Button kind="tertiary" size="sm" onClick={() => nav('/')}>Demo: simula il ritorno dal browser</Button>
            </Stack>
          )}
        </Tile>
      </Layer>
    </LoginFrame>
  );
}
