// src/components/SubscriptionGate.jsx
/**
 * Gate che blocca l'accesso all'app se l'abbonamento è scaduto/assente.
 * Mostra schermata informativa con piano scaduto e link per rinnovare.
 * 
 * Wrappa i children e li mostra solo se l'abbonamento è valido.
 */
import { useSubscription } from "@/hooks/useSubscription";
import { useDemo } from "@/hooks/useDemo";
import { signOutAndGo } from "@/lib/auth";
import { FiAlertCircle, FiCreditCard, FiRefreshCw, FiMail, FiLogOut } from "react-icons/fi";

export default function SubscriptionGate({ children }) {
  const { subscription, plan, isValid, daysLeft, statusInfo, loading, refresh } = useSubscription();
  const { isDemo, loading: demoLoading } = useDemo();

  // Loading — mostra spinner leggero. Aspettiamo entrambi: subscription
  // e is_demo (così evitiamo flash "Nessun abbonamento" se la demo è
  // valida ma la subscription row non c'è ancora o ha valori legacy).
  if (loading || demoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c1929]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Verifica abbonamento...</p>
        </div>
      </div>
    );
  }

  // Bypass per org demo: l'accesso è sempre permesso (esplorativo).
  // Le restrizioni demo (blocco SDI/RENTRI/RVFU) sono gestite altrove
  // via useDemo.demoBlock e dai middleware server-side. Qui non serve
  // un abbonamento per usare la demo.
  if (isDemo) {
    return <>{children}</>;
  }

  // Abbonamento valido — mostra app
  if (isValid) {
    return <>{children}</>;
  }

  // Nessun abbonamento o scaduto — mostra gate
  const hasExpired = subscription && (subscription.status === "expired" || subscription.status === "past_due" || subscription.status === "canceled");
  const neverHad = !subscription;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0c1929] px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          {hasExpired ? (
            <FiAlertCircle className="w-10 h-10 text-red-400" />
          ) : (
            <FiCreditCard className="w-10 h-10 text-amber-400" />
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">
            {hasExpired ? "Abbonamento Scaduto" : neverHad ? "Nessun Abbonamento" : "Abbonamento Non Attivo"}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            {hasExpired ? (
              <>Il tuo abbonamento <strong className="text-slate-300">{plan?.label || subscription.plan}</strong> è scaduto. Rinnova per continuare ad usare RescueManager.</>
            ) : neverHad ? (
              <>Per utilizzare RescueManager è necessario un abbonamento attivo. Contatta il nostro team per attivare il tuo piano.</>
            ) : (
              <>Il tuo abbonamento non è attualmente attivo. Contatta il supporto per assistenza.</>
            )}
          </p>
        </div>

        {/* Info box */}
        {subscription && (
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Piano</span>
              <span className="text-xs font-medium text-slate-300">{plan?.label || subscription.plan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Stato</span>
              <span className={`text-xs font-medium text-${statusInfo.color}-400`}>{statusInfo.label}</span>
            </div>
            {subscription.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Scadenza</span>
                <span className="text-xs text-slate-300">
                  {new Date(subscription.current_period_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:info@rescuemanager.eu?subject=Rinnovo%20Abbonamento"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors no-underline"
          >
            <FiMail className="w-4 h-4" />
            Contatta per Rinnovo
          </a>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a2536] text-slate-400 text-sm font-medium border border-[#243044] hover:bg-[#1e2b3d] transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Ricontrolla
          </button>
          <button
            onClick={() => signOutAndGo()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a2536] text-red-400 text-sm font-medium border border-red-500/20 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            Disconnetti
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-600">
          info@rescuemanager.eu · rescuemanager.eu
        </p>
      </div>
    </div>
  );
}
