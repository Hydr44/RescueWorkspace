import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Trasporti from './pages/Trasporti.jsx';
import TrasportoNuovo from './pages/TrasportoNuovo.jsx';
import Clienti from './pages/Clienti.jsx';
import ClienteNuovo from './pages/ClienteNuovo.jsx';
import Placeholder from './components/Placeholder.jsx';
import Impostazioni from './pages/Impostazioni.jsx';
import FatturaNuova from './pages/FatturaNuova.jsx';
import Tracking from './pages/Tracking.jsx';
import Calendario from './pages/Calendario.jsx';
import PraticaRvfu from './pages/PraticaRvfu.jsx';
import RentriGuidato from './pages/RentriGuidato.jsx';
import RifiutiDaDemolizione from './pages/RifiutiDaDemolizione.jsx';
import LavagnaVfu from './pages/LavagnaVfu.jsx';
import RifiutiSintesi from './pages/RifiutiSintesi.jsx';
import FattureSintesi from './pages/FattureSintesi.jsx';
import ContabilitaSintesi from './pages/ContabilitaSintesi.jsx';
import Report from './pages/Report.jsx';
import Mud from './pages/Mud.jsx';
import RiepilogoQuantita from './pages/RiepilogoQuantita.jsx';
import ControlloGiacenza from './pages/ControlloGiacenza.jsx';
import ConsulenteAmbientale from './pages/ConsulenteAmbientale.jsx';
import Fatture from './pages/Fatture.jsx';
import DemoModali from './pages/DemoModali.jsx';
import ChiusuraIva from './pages/ChiusuraIva.jsx';
import { UnraeLayout, UnraeDemolizioni, UnraeInserimento, UnraeReti, UnraeUpload } from './pages/unrae/Unrae.jsx';
import { NAV } from './data/nav.js';

// Le rotte sono le stesse dell'app (src/App.jsx dell'app desktop): quando una pagina
// e' pronta qui, si sostituisce il Placeholder con la pagina vera.
const done = { '/': Dashboard, '/trasporti': Trasporti, '/clienti': Clienti, '/tracking': Tracking, '/calendario': Calendario, '/rifiuti': RifiutiSintesi, '/report': Report, '/demolizioni-rvfu': LavagnaVfu, '/fatture': Fatture, '/contabilita': ContabilitaSintesi };

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        {NAV.flatMap(([, items]) => items).filter(({ to }) => to !== '/unrae').map(({ to, label }) => {
          const Page = done[to] || (() => <Placeholder title={label} />);
          return <Route key={to} path={to} element={<Page />} />;
        })}
        <Route path="/trasporti/nuovo" element={<TrasportoNuovo />} />
        <Route path="/trasporti/nuovo/:passo" element={<TrasportoNuovo />} />
        <Route path="/clienti/nuovo" element={<ClienteNuovo />} />
        <Route path="/settings" element={<Impostazioni />} />
        <Route path="/settings/:sezione" element={<Impostazioni />} />
        <Route path="/fatture/nuova" element={<FatturaNuova />} />
        <Route path="/demolizioni-rvfu/kanban" element={<LavagnaVfu />} />
        <Route path="/demo/modali" element={<DemoModali />} />
        <Route path="/fatture/sintesi" element={<FattureSintesi />} />
        <Route path="/fatture/chiusura-iva" element={<ChiusuraIva />} />
        <Route path="/rifiuti/mud" element={<Mud />} />
        <Route path="/rifiuti/riepilogo" element={<RiepilogoQuantita />} />
        <Route path="/rifiuti/giacenza" element={<ControlloGiacenza />} />
        <Route path="/rifiuti/consulente" element={<ConsulenteAmbientale />} />
        <Route path="/unrae" element={<UnraeLayout />}>
          <Route index element={<UnraeDemolizioni />} />
          <Route path="reti" element={<UnraeReti />} />
          <Route path="upload" element={<UnraeUpload />} />
          <Route path="inserimento" element={<UnraeInserimento />} />
        </Route>
        <Route path="/demolizioni-rvfu/dettaglio/:id" element={<PraticaRvfu />} />
        <Route path="/rifiuti/movimenti/guidato" element={<RentriGuidato />} />
        <Route path="/rifiuti/da-demolizione" element={<RifiutiDaDemolizione />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
