import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiHelpCircle, FiSend, FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useOrg } from "@/context/OrgContext";
import { useAIContext } from "@/context/AIContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://rentri-test.rescuemanager.eu";

export default function AiAssistantPanel({ inline = false, onActionRequest }) {
  const location = useLocation();
  const { orgId } = useOrg();
  const { buildAIContext, loadCompanyData, pageContext } = useAIContext();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      from: "assistant",
      text: "Ciao! Sono l'assistente di RescueManager. Posso aiutarti a compilare i campi, suggerirti valori, o guidarti passo passo.",
    },
  ]);
  const [pendingAction, setPendingAction] = useState(null);

  // Carica dati azienda all'apertura
  useEffect(() => {
    if (open) {
      loadCompanyData();
    }
  }, [open, loadCompanyData]);

  const handleAsk = async () => {
    const question = input.trim();
    if (!question || loading) return;

    // Aggiungi subito il messaggio dell'utente
    const userId = Date.now();
    setMessages((prev) => [...prev, { id: userId, from: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      // Costruisci context completo
      const aiContext = buildAIContext();
      
      const res = await fetch(`${API_BASE_URL}/api/ai/assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org_id: orgId,
          route: location.pathname,
          question,
          context: aiContext, // Context completo: azienda, pagina, form, metadata
        }),
      });

      const data = await res.json();
      
      // Gestisci azioni AI (suggerimenti, compilazione)
      if (data?.action) {
        setPendingAction(data.action);
        // Mostra il suggerimento all'utente
        const actionMsg = formatActionMessage(data.action);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, from: "assistant", text: actionMsg, action: data.action },
        ]);
        setLoading(false);
        return;
      }
      
      let answer = data?.answer || data?.error || "Non sono riuscito a rispondere alla domanda.";

      // Piccola pulizia: rimuove virgolette esterne e asterischi inutili
      if (typeof answer === "string") {
        answer = answer.trim();
        // togli eventuali virgolette iniziali/finali
        if ((answer.startsWith('"') && answer.endsWith('"')) || (answer.startsWith("'") && answer.endsWith("'"))) {
          answer = answer.slice(1, -1).trim();
        }
        // rimuovi doppi asterischi tipici del markdown
        answer = answer.replace(/\*\*/g, "");
      }

      // Effetto "macchina da scrivere": costruisce il messaggio passo passo
      const assistantId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantId, from: "assistant", text: "" }]);

      let index = 0;
      const step = Math.max(1, Math.floor(answer.length / 200)); // velocità adattiva

      const interval = setInterval(() => {
        index += step;
        if (index >= answer.length) {
          index = answer.length;
        }
        const partial = answer.slice(0, index);

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: partial } : m))
        );

        if (index >= answer.length) {
          clearInterval(interval);
        }
      }, 15);
    } catch (e) {
      console.error("[AI-ASSIST] Errore chiamata:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          from: "assistant",
          text: "Si è verificato un errore nel contattare l'assistente. Riprova più tardi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Formatta messaggio per azione AI
  const formatActionMessage = (action) => {
    if (action.type === 'suggest_value') {
      return ` Suggerimento per "${action.field}":\n${action.value}\n\nVuoi che lo inserisca per te?`;
    }
    if (action.type === 'fill_multiple') {
      const fields = action.fields.map(f => `• ${f.label}: ${f.value}`).join('\n');
      return ` Ho preparato questi valori:\n${fields}\n\nVuoi che li inserisca tutti?`;
    }
    if (action.type === 'create_record') {
      return ` Posso creare un nuovo record con questi dati:\n${JSON.stringify(action.data, null, 2)}\n\nProcedo?`;
    }
    return action.message || 'Azione disponibile';
  };

  // Conferma azione AI
  const confirmAction = () => {
    if (!pendingAction) return;
    
    // Notifica al componente parent (es: InvoiceNew) di eseguire l'azione
    if (onActionRequest) {
      onActionRequest(pendingAction);
    }
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "assistant", text: " Fatto! Ho applicato le modifiche." },
    ]);
    setPendingAction(null);
  };

  // Rifiuta azione AI
  const rejectAction = () => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "assistant", text: "Ok, nessun problema. Fammi sapere se hai bisogno di altro!" },
    ]);
    setPendingAction(null);
  };

  // Rendering inline (nell'header) o floating
  const buttonClass = inline
    ? "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
    : "fixed bottom-4 right-4 z-40 inline-flex items-center justify-center w-11 h-11 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors";

  return (
    <>
      {/* AI Assistant button */}
      <button
        onClick={() => setOpen(!open)}
        className={buttonClass}
        title="Assistente AI"
      >
        <FiHelpCircle className={inline ? "w-3.5 h-3.5" : "w-5 h-5"} />
        {inline && <span>Assistente AI</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-md bg-[#141c27] text-slate-200 rounded-2xl shadow-2xl border border-[#243044] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044] bg-[#0c1929]">
            <div className="flex items-center gap-2">
              <FiHelpCircle className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-sm font-semibold">Assistente RescueManager</div>
                <div className="text-xs text-slate-500">
                  Ti aiuto a capire cosa fare in questa schermata.
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-[#1a2536] transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 max-h-80 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((m) => {
              const lines = String(m.text || "").split("\n").filter(line => line.trim().length > 0);
              return (
                <div
                  key={m.id}
                  className={
                    m.from === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      m.from === "user"
                        ? "max-w-[80%] rounded-2xl bg-indigo-600 text-white px-3 py-2 text-sm whitespace-pre-line"
                        : "max-w-[80%] rounded-2xl bg-[#1a2536] text-slate-200 px-3 py-2 text-sm whitespace-pre-line"
                    }
                  >
                    {lines.map((line, i) => (
                      <p key={i} className="mb-0.5 last:mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="text-xs text-slate-500">
                L'assistente sta pensando...
              </div>
            )}
            {pendingAction && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={confirmAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Sì, applica
                </button>
                <button
                  onClick={rejectAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
                >
                  <FiAlertCircle className="w-3.5 h-3.5" />
                  No, grazie
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-[#243044] px-3 py-2 bg-[#0c1929]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 bg-[#141c27] border border-[#243044] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Fai una domanda su quello che vedi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <button
                onClick={handleAsk}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



