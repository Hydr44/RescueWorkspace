// src/App.jsx
/**
 * RescueManager - Desktop Application Entry Point
 * Main React application component with routing and authentication
 * 
 * @author haxies
 * @created 2025
 */

import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import ThemeInit from "./components/ThemeInit";
import RequireAuth from "./components/RequireAuth.jsx";
import Shell from "./components/Shell";
import ModuleGuard from "./components/ModuleGuard";
import SubscriptionGate from "./components/SubscriptionGate";
import LoginPage from "./pages/Login.jsx";
import AuthCallback from "./pages/AuthCallback";
import TestSupabase from "./TestSupabase";
import TestSync from "./pages/TestSync";
import DesignSystemTest from "./pages/DesignSystemTest";
import PublicOnly from "./components/PublicOnly";
import { OrgProvider } from "./context/OrgContext";
import { ToastProvider } from "./context/ToastContext";
import { AIContextProvider } from "./context/AIContext";
import MaintenanceOverlay from "./components/MaintenanceOverlay";
import VersionUpdateOverlay from "./components/VersionUpdateOverlay";
import RemoteControlManager from "./components/RemoteControlManager";
import ErrorDisplay, { useErrorDisplay } from "./components/ErrorDisplay";
import { errorService } from "./lib/errorService";
import { remoteControl } from "./lib/remote-control";

// Router selection (Electron / file:// → HashRouter)
const isElectron =
  typeof window !== "undefined" && !!window.api;
const isFileProto =
  typeof window !== "undefined" && window.location?.protocol === "file:";
const Router = isElectron || isFileProto ? HashRouter : BrowserRouter;

function lazyPage(importer, name) {
  return lazy(() =>
    importer()
      .then((mod) => ({
        default:
          mod?.default ??
          (() => <div className="p-6">Modulo {name} senza export default</div>),
      }))
      .catch((err) => {
        // Log dell'errore per debugging
        console.error(`Failed to load page ${name}:`, err);
        return {
          default: () => (
            <div className="p-6">
              <h1 className="text-xl font-semibold">Errore di caricamento</h1>
              <p className="text-sm mt-2 text-gray-600">
                Impossibile caricare la pagina "{name}".
              </p>
              {import.meta.env.DEV && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">Dettagli tecnici</summary>
                  <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                    {String(err?.message || err)}
                  </pre>
                </details>
              )}
            </div>
          ),
        };
      })
  );
}

// pagine
const Dashboard = lazyPage(() => import("./pages/DashboardNew"), "DashboardNew");
const DashboardOld = lazyPage(() => import("./pages/Dashboard"), "Dashboard");
const Transports = lazyPage(() => import("./pages/Transports"), "Transports");
const TransportNew = lazyPage(() => import("./pages/TransportNew"), "TransportNew");
const TransportDetail = lazyPage(() => import("./pages/TransportDetail"), "TransportDetail");
const TransportTracking = lazyPage(() => import("./pages/TransportTracking"), "TransportTracking");
const Drivers = lazyPage(() => import("./pages/Drivers"), "Drivers");
const DriverNew = lazyPage(() => import("./pages/DriverNew"), "DriverNew");
const DriverDetail = lazyPage(() => import("./pages/DriverDetail"), "DriverDetail");
const Users = lazyPage(() => import("./pages/Users"), "Users");
const UserNew = lazyPage(() => import("./pages/UserNew"), "UserNew");
const Settings = lazyPage(() => import("./pages/Settings"), "Settings");
const Clients = lazyPage(() => import("./pages/Clients"), "Clients");
const Vehicles = lazyPage(() => import("./pages/Vehicles"), "Vehicles");
const VehicleNew = lazyPage(() => import("./pages/VehicleNew"), "VehicleNew");
const Yard = lazyPage(() => import("./pages/Yard"), "Yard");
const YardNew = lazyPage(() => import("./pages/YardNew"), "YardNew");
const YardDetail = lazyPage(() => import("./pages/YardDetail"), "YardDetail");
const CalendarPage = lazyPage(() => import("./pages/CalendarPage"), "CalendarPage");
const Reports = lazyPage(() => import("./pages/Reports"), "Reports");
const Quotes = lazyPage(() => import("./pages/Quotes"), "Quotes");
const QuoteNew = lazyPage(() => import("./pages/QuoteNew"), "QuoteNew");
const DemolizioniRVFU = lazyPage(() => import("./pages/DemolizioniRVFU"), "DemolizioniRVFU");
const DemolizioneRVFUForm = lazyPage(() => import("./pages/DemolizioneRVFUForm"), "DemolizioneRVFUForm");
const DemolizioneRVFUDettaglio = lazyPage(() => import("./pages/DemolizioneRVFUDettaglioNew"), "DemolizioneRVFUDettaglioNew");
const RVFUTestConsole = lazyPage(() => import("./pages/RVFUTestConsole"), "RVFUTestConsole");
const DebugSync = lazyPage(() => import("./pages/DebugSync"), "DebugSync");
const AcceptInvite = lazyPage(() => import("./pages/AcceptInvite"), "AcceptInvite");
const SentryTest = lazyPage(() => import("./pages/SentryTest"), "SentryTest");

// Ricambi MVP
const SparePartsMVP = lazyPage(() => import("./pages/SparePartsManagement"), "SparePartsManagement");
const SparePartNewMVP = lazyPage(() => import("./pages/SparePartNewMVP"), "SparePartNewMVP");
const SparePartQuickAdd = lazyPage(() => import("./pages/SparePartQuickAdd"), "SparePartQuickAdd");

// Vendite
const SalesDashboard = lazyPage(() => import("./pages/SalesDashboard"), "SalesDashboard");
const SalesQuotes = lazyPage(() => import("./pages/SalesQuotes"), "SalesQuotes");
const SalesQuoteForm = lazyPage(() => import("./pages/SalesQuoteForm"), "SalesQuoteForm");
const SalesOrders = lazyPage(() => import("./pages/SalesOrders"), "SalesOrders");
const SalesOrderForm = lazyPage(() => import("./pages/SalesOrderForm"), "SalesOrderForm");

// Marketplace B2B
const MarketplaceDashboard = lazyPage(() => import("./pages/MarketplaceDashboard"), "MarketplaceDashboard");
const MarketplaceListingForm = lazyPage(() => import("./pages/MarketplaceListingForm"), "MarketplaceListingForm");
const MarketplaceListingDetail = lazyPage(() => import("./pages/MarketplaceListingDetail"), "MarketplaceListingDetail");
const MarketplaceMyListings = lazyPage(() => import("./pages/MarketplaceMyListings"), "MarketplaceMyListings");
const MarketplaceOffers = lazyPage(() => import("./pages/MarketplaceOffers"), "MarketplaceOffers");

// Fatture
const Invoices = lazyPage(() => import("./pages/Invoices"), "Invoices");
const InvoiceDashboard = lazyPage(() => import("./pages/InvoiceDashboard"), "InvoiceDashboard");
const InvoiceNew = lazyPage(() => import("./pages/InvoiceNew"), "InvoiceNew");
const AccountingDashboard = lazyPage(() => import("./pages/AccountingDashboard"), "AccountingDashboard");
const AccountingEntries = lazyPage(() => import("./pages/AccountingEntries"), "AccountingEntries");
const AccountingEntryNew = lazyPage(() => import("./pages/AccountingEntryNew"), "AccountingEntryNew");
const ChartOfAccounts = lazyPage(() => import("./pages/ChartOfAccounts"), "ChartOfAccounts");
const ChartOfAccountNew = lazyPage(() => import("./pages/ChartOfAccountNew"), "ChartOfAccountNew");

// Rifiuti RENTRI
const RifiutiDashboard = lazyPage(() => import("./pages/RifiutiDashboard"), "RifiutiDashboard");
const RifiutiRegistri = lazyPage(() => import("./pages/RifiutiRegistri"), "RifiutiRegistri");
const RifiutiRegistroForm = lazyPage(() => import("./pages/RifiutiRegistroForm"), "RifiutiRegistroForm");
const RifiutiMovimenti = lazyPage(() => import("./pages/RifiutiMovimenti"), "RifiutiMovimenti");
const RifiutiMud = lazyPage(() => import("./pages/RifiutiMud"), "RifiutiMud");
const RifiutiMovimentoForm = lazyPage(() => import("./pages/RifiutiMovimentoForm"), "RifiutiMovimentoForm");
const RifiutiFormulari = lazyPage(() => import("./pages/RifiutiFormulari"), "RifiutiFormulari");
const RifiutiFormularioForm = lazyPage(() => import("./pages/RifiutiFormularioFormPDF"), "RifiutiFormularioFormPDF");
const RifiutiTrasmissioni = lazyPage(() => import("./pages/RifiutiTrasmissioni"), "RifiutiTrasmissioni");
const RifiutiCertificati = lazyPage(() => import("./pages/RifiutiCertificati"), "RifiutiCertificati");
const RifiutiCertificatiUpload = lazyPage(() => import("./pages/RifiutiCertificatiUpload"), "RifiutiCertificatiUpload");
const RifiutiSetupWizard = lazyPage(() => import("./pages/RifiutiSetupWizard"), "RifiutiSetupWizard");
const RifiutiXFir = lazyPage(() => import("./pages/RifiutiXFir"), "RifiutiXFir");
const RifiutiXFirForm = lazyPage(() => import("./pages/RifiutiXFirForm"), "RifiutiXFirForm");
const RifiutiReportNormativo = lazyPage(() => import("./pages/RifiutiReportNormativo"), "RifiutiReportNormativo");
const InvoiceForm = lazyPage(() => import("./pages/InvoiceForm"), "InvoiceForm");
const InvoicePayments = lazyPage(() => import("./pages/InvoicePayments"), "InvoicePayments");

// Clienti
const ClientDetail = lazyPage(() => import("./pages/ClientDetail"), "ClientDetail");
const ClientNew = lazyPage(() => import("./pages/ClientNew"), "ClientNew");

// Scroll reset su cambio route/hash (utile con HashRouter/Electron)
function ScrollToTop() {
  useEffect(() => {
    const onChange = () => window.scrollTo({ top: 0, behavior: "instant" });
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);
  return null;
}

// Wrapper aree protette: RequireAuth + SubscriptionGate + Shell
function Protected({ children }) {
  return (
    <RequireAuth>
      <SubscriptionGate>
        <Shell>{children}</Shell>
      </SubscriptionGate>
    </RequireAuth>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [versionStatus, setVersionStatus] = useState(null);
  const [showVersionUpdate, setShowVersionUpdate] = useState(false);
  const { error, hideError } = useErrorDisplay();

  useEffect(() => {
    // Boot delay per evitare richieste troppo precoci
    const timer = setTimeout(() => setBooting(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Error Service: Setup subscriber
  useEffect(() => {
    const unsubscribe = errorService.subscribe((errorInfo) => {
      // L'hook useErrorDisplay gestisce il display
      console.log('[App] Error received:', errorInfo);
    });

    return () => unsubscribe();
  }, []);

  // Remote Control: Check manutenzione dopo che l'app è avviata
  useEffect(() => {
    if (booting) return; // Aspetta che il boot sia completato

    let mounted = true;

    // Delay ulteriore prima di avviare il polling
    const initTimer = setTimeout(() => {
      // Start maintenance polling
      remoteControl.startMaintenancePolling((status) => {
        // Solo aggiorna se il componente è ancora montato e lo stato è cambiato
        if (mounted) {
          setMaintenanceStatus(status);
        }
      });

      // Check versioni
      remoteControl.checkVersion('0.1.0').then(status => {
        if (mounted && status && status.update_required) {
          console.log('[App] Update required:', status);
          setVersionStatus(status);
          setShowVersionUpdate(true);
        }
      }).catch(err => {
        console.error('[App] Version check failed:', err);
      });
    }, 2000); // 2 secondi dopo il boot

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(initTimer);
      remoteControl.cleanup();
    };
  }, [booting]);

  if (booting) {
    return (
      <div className="h-screen grid place-items-center text-gray-500">
        Avvio…
      </div>
    );
  }

  return (
    <Router>
      <ThemeInit />
      <ScrollToTop />
      <MaintenanceOverlay
        visible={maintenanceStatus?.is_active || false}
        status={maintenanceStatus}
      />
      <VersionUpdateOverlay
        visible={showVersionUpdate}
        status={versionStatus}
        onDismiss={() => setShowVersionUpdate(false)}
      />
      {error && (
        <ErrorDisplay
          error={error}
          onClose={hideError}
        />
      )}
      <ToastProvider>
        <OrgProvider>
          <AIContextProvider>
            <RemoteControlManager onMaintenanceChange={setMaintenanceStatus} />
          <Suspense fallback={<div className="p-6 text-sm text-gray-500">Caricamento…</div>}>
            <Routes>
              {/* Pubblica */}
              <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Private */}
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/trasporti" element={<Protected><Transports /></Protected>} />
              <Route path="/trasporti/new" element={<Protected><TransportNew /></Protected>} />
              <Route path="/trasporti/:id" element={<Protected><TransportDetail /></Protected>} />
              <Route path="/tracking" element={<Protected><TransportTracking /></Protected>} />
              <Route path="/autisti" element={<Protected><Drivers /></Protected>} />
              <Route path="/autisti/new" element={<Protected><DriverNew /></Protected>} />
              <Route path="/autisti/:id" element={<Protected><DriverDetail /></Protected>} />
              <Route path="/autisti/:id/modifica" element={<Protected><DriverNew /></Protected>} />
              <Route path="/utenti" element={<Protected><Users /></Protected>} />
              <Route path="/utenti/new" element={<Protected><UserNew /></Protected>} />
              <Route path="/utenti/:id" element={<Protected><UserNew /></Protected>} />
              <Route path="/clienti" element={<Protected><Clients /></Protected>} />
              <Route path="/clienti/nuovo" element={<Protected><ClientNew /></Protected>} />
              <Route path="/clienti/:id" element={<Protected><ClientDetail /></Protected>} />
              <Route path="/clienti/:id/modifica" element={<Protected><ClientNew /></Protected>} />
              <Route path="/mezzi" element={<Protected><Vehicles /></Protected>} />
              <Route path="/mezzi/new" element={<Protected><VehicleNew /></Protected>} />
              <Route path="/mezzi/:id" element={<Protected><VehicleNew /></Protected>} />
              <Route path="/piazzale" element={<Protected><Yard /></Protected>} />
              <Route path="/piazzale/new" element={<Protected><YardNew /></Protected>} />
              <Route path="/piazzale/:id" element={<Protected><YardDetail /></Protected>} />
              <Route path="/piazzale/:id/modifica" element={<Protected><YardNew /></Protected>} />
              <Route path="/calendario" element={<Protected><CalendarPage /></Protected>} />
              <Route path="/report" element={<Protected><Reports /></Protected>} />
              <Route path="/preventivi" element={<Protected><Quotes /></Protected>} />
              <Route path="/preventivi/nuovo" element={<Protected><QuoteNew /></Protected>} />
              <Route path="/preventivi/:id" element={<Protected><QuoteNew /></Protected>} />
              <Route path="/utenti" element={<Protected><Users /></Protected>} />
              <Route path="/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/sentry-test" element={<Protected><SentryTest /></Protected>} />

              {/* Demolizioni — protetto da modulo rvfu */}
              <Route path="/demolizioni-rvfu" element={<Protected><ModuleGuard module="rvfu"><DemolizioniRVFU /></ModuleGuard></Protected>} />
              <Route path="/demolizioni-rvfu/new" element={<Protected><ModuleGuard module="rvfu"><DemolizioneRVFUForm /></ModuleGuard></Protected>} />
              <Route path="/demolizioni-rvfu/dettaglio/:id" element={<Protected><ModuleGuard module="rvfu"><DemolizioneRVFUDettaglio /></ModuleGuard></Protected>} />
              <Route path="/demolizioni-rvfu/:id" element={<Protected><ModuleGuard module="rvfu"><DemolizioneRVFUForm /></ModuleGuard></Protected>} />
              <Route path="/rvfu-test" element={<Protected><RVFUTestConsole /></Protected>} />

              {/* Ricambi MVP */}
              <Route path="/ricambi" element={<Protected><SparePartsMVP /></Protected>} />
              <Route path="/ricambi/nuovo" element={<Protected><SparePartNewMVP /></Protected>} />
              <Route path="/ricambi/quick-add" element={<Protected><SparePartQuickAdd /></Protected>} />
              <Route path="/ricambi/:id" element={<Protected><SparePartNewMVP /></Protected>} />
              <Route path="/ricambi-mvp" element={<Protected><SparePartsMVP /></Protected>} />
              <Route path="/ricambi-mvp/nuovo" element={<Protected><SparePartNewMVP /></Protected>} />
              <Route path="/ricambi-mvp/quick-add" element={<Protected><SparePartQuickAdd /></Protected>} />
              <Route path="/ricambi-mvp/:id" element={<Protected><SparePartNewMVP /></Protected>} />

              {/* Vendite */}
              <Route path="/vendite" element={<Protected><SalesDashboard /></Protected>} />
              <Route path="/vendite/preventivi" element={<Protected><Quotes /></Protected>} />
              <Route path="/vendite/preventivi/nuovo" element={<Protected><QuoteNew /></Protected>} />
              <Route path="/vendite/preventivi/:id" element={<Protected><QuoteNew /></Protected>} />
              <Route path="/vendite/ordini" element={<Protected><SalesOrders /></Protected>} />
              <Route path="/vendite/ordini/nuovo" element={<Protected><SalesOrderForm /></Protected>} />
              <Route path="/vendite/ordini/:id" element={<Protected><SalesOrderForm /></Protected>} />

              {/* Marketplace B2B - disattivato */}
              {/*
              <Route path="/marketplace" element={<Protected><MarketplaceDashboard /></Protected>} />
              <Route path="/marketplace/miei-annunci" element={<Protected><MarketplaceMyListings /></Protected>} />
              <Route path="/marketplace/offerte" element={<Protected><MarketplaceOffers /></Protected>} />
              <Route path="/marketplace/annunci/:id" element={<Protected><MarketplaceListingDetail /></Protected>} />
              <Route path="/marketplace/annunci/:id/modifica" element={<Protected><MarketplaceListingForm /></Protected>} />
              */}

              {/* Fatture — protetto da modulo sdi */}
              <Route path="/fatture" element={<Protected><ModuleGuard module="sdi"><Invoices /></ModuleGuard></Protected>} />
              <Route path="/fatture/dashboard" element={<Protected><ModuleGuard module="sdi"><InvoiceDashboard /></ModuleGuard></Protected>} />
              <Route path="/fatture/new" element={<Protected><ModuleGuard module="sdi"><InvoiceNew /></ModuleGuard></Protected>} />
              <Route path="/fatture/:id" element={<Protected><ModuleGuard module="sdi"><InvoiceForm /></ModuleGuard></Protected>} />
              <Route path="/fatture/:id/pagamenti" element={<Protected><ModuleGuard module="sdi"><InvoicePayments /></ModuleGuard></Protected>} />

              {/* Contabilità */}
              <Route path="/contabilita" element={<Protected><AccountingDashboard /></Protected>} />
              <Route path="/contabilita/movimenti" element={<Protected><AccountingEntries /></Protected>} />
              <Route path="/contabilita/movimenti/new" element={<Protected><AccountingEntryNew /></Protected>} />
              <Route path="/contabilita/movimenti/:id" element={<Protected><AccountingEntryNew /></Protected>} />
              <Route path="/contabilita/piano-conti" element={<Protected><ChartOfAccounts /></Protected>} />
              <Route path="/contabilita/piano-conti/nuovo" element={<Protected><ChartOfAccountNew /></Protected>} />
              <Route path="/contabilita/piano-conti/:id/modifica" element={<Protected><ChartOfAccountNew /></Protected>} />

              {/* Rifiuti RENTRI — protetto da modulo rentri */}
              <Route path="/rifiuti" element={<Protected><ModuleGuard module="rentri"><RifiutiDashboard /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/registri" element={<Protected><ModuleGuard module="rentri"><RifiutiRegistri /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/registri/nuovo" element={<Protected><ModuleGuard module="rentri"><RifiutiRegistroForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/registri/:id" element={<Protected><ModuleGuard module="rentri"><RifiutiRegistroForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/movimenti" element={<Protected><ModuleGuard module="rentri"><RifiutiMovimenti /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/movimenti/nuovo" element={<Protected><ModuleGuard module="rentri"><RifiutiMovimentoForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/movimenti/:id" element={<Protected><ModuleGuard module="rentri"><RifiutiMovimentoForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/formulari" element={<Protected><ModuleGuard module="rentri"><RifiutiFormulari /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/formulari/nuovo" element={<Protected><ModuleGuard module="rentri"><RifiutiFormularioForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/formulari/:id" element={<Protected><ModuleGuard module="rentri"><RifiutiFormularioForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/xfir" element={<Protected><ModuleGuard module="rentri"><RifiutiXFir /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/xfir/nuovo" element={<Protected><ModuleGuard module="rentri"><RifiutiXFirForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/xfir/:id" element={<Protected><ModuleGuard module="rentri"><RifiutiXFirForm /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/trasmissioni" element={<Protected><ModuleGuard module="rentri"><RifiutiTrasmissioni /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/mud" element={<Protected><ModuleGuard module="rentri"><RifiutiMud /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/certificati" element={<Protected><ModuleGuard module="rentri"><RifiutiCertificati /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/certificati/upload" element={<Protected><ModuleGuard module="rentri"><RifiutiCertificatiUpload /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/setup" element={<Protected><ModuleGuard module="rentri"><RifiutiSetupWizard /></ModuleGuard></Protected>} />
              <Route path="/rifiuti/report-normativo" element={<Protected><ModuleGuard module="rentri"><RifiutiReportNormativo /></ModuleGuard></Protected>} />

              {/* Dev / Test — visibili solo in development */}
              {import.meta.env.DEV && (
                <>
                  <Route path="/test-supabase" element={<TestSupabase />} />
                  <Route path="/test-sync" element={<TestSync />} />
                  <Route path="/test-design-system" element={<DesignSystemTest />} />
                  <Route path="/debug-sync" element={<DebugSync />} />
                </>
              )}

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </AIContextProvider>
        </OrgProvider>
      </ToastProvider>
    </Router>
  );
}