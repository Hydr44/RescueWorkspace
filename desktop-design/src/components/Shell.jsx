import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import AiPanel from './AiPanel.jsx';

// Cornice di ogni pagina dopo l'accesso: barra laterale, barra azienda, contenuto, pannello RescueAI agganciato a destra.
// Per la demo: #/trasporti?ai=1 apre il pannello, ?ai=ambientale apre il consulente.
export default function Shell() {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get('ai');
  const [ai, setAi] = useState(null);
  useEffect(() => { setAi(q ? (q === 'ambientale' ? 'ambientale' : 'general') : null); }, [q]);
  return (
    <div className="rm-app">
      <Sidebar />
      <div className="rm-main">
        <TopBar aiOpen={!!ai} onAi={() => setAi(ai ? null : 'general')} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div className="rm-content" style={{ flex: 1, minWidth: 0 }}><Outlet /></div>
          {ai && <AiPanel key={ai} persona={ai} onClose={() => setAi(null)} />}
        </div>
      </div>
    </div>
  );
}
