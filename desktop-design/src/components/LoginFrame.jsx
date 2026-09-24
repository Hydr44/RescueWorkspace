import { Link } from '@carbon/react';
import logo from '../logos/logo-principale-bianco.svg';

const MODULI = ['Soccorso stradale', 'Radiazioni RVFU', 'Fatturazione SDI', 'Registro RENTRI'];

// Cornice delle schermate di accesso: pannello blu con logo e moduli a sinistra, scheda al centro, riga in fondo.
export default function LoginFrame({ version = '2.4.17', children }) {
  return (
    <div className="rm-login">
      <div className="rm-login__brand">
        <img src={logo} alt="RescueManager" />
        <div className="rm-login__claim">Gestionale per soccorso stradale e autodemolizioni</div>
        <div className="rm-login__feats">{MODULI.map((m) => <div key={m}><i />{m}</div>)}</div>
        <div className="rm-login__ver">Versione desktop {version}</div>
      </div>
      <div className="rm-login__main">
        <div className="rm-login__center">{children}</div>
        <div className="rm-login__foot">
          <span>RescueManager S.r.l., {new Date().getFullYear()}</span>
          <span><Link href="https://rescuemanager.eu/supporto" style={{ fontSize: 12 }}>Supporto</Link><Link href="https://rescuemanager.eu/privacy" style={{ fontSize: 12 }}>Privacy</Link></span>
        </div>
      </div>
    </div>
  );
}
