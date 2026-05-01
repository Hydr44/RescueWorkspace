import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiSend, FiX, FiTool, FiCheck, FiAlertCircle,
  FiTrash2, FiCpu, FiZap,
} from "react-icons/fi";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useOrg } from "@/context/OrgContext";
import { useAIContext } from "@/context/AIContext";

const API_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://rentri-test.rescuemanager.eu";

const HISTORY_KEY_PREFIX = "rm-ai-history-";
const MAX_HISTORY_TURNS = 10;

const TOOL_LABELS = {
  query_clients: "Consultando clienti",
  query_invoices: "Consultando fatture",
  query_transports: "Consultando trasporti",
  query_demolitions: "Consultando demolizioni",
  query_yard: "Consultando piazzale",
  query_settings: "Leggendo impostazioni",
  query_drivers: "Consultando autisti",
  query_vehicles: "Consultando veicoli",
  compute_kpi: "Calcolando KPI",
  search_global: "Ricerca globale",
  propose_client: "Preparando nuovo cliente",
  propose_transport: "Preparando trasporto",
  propose_quote: "Preparando preventivo",
  propose_yard_vehicle: "Preparando registrazione piazzale",
  propose_draft_invoice: "Preparando bozza fattura",
};

function loadHistory(orgId) {
  if (!orgId) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY_PREFIX + orgId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY_TURNS * 2) : [];
  } catch { return []; }
}

function saveHistory(orgId, history) {
  if (!orgId) return;
  try {
    localStorage.setItem(
      HISTORY_KEY_PREFIX + orgId,
      JSON.stringify(history.slice(-MAX_HISTORY_TURNS * 2))
    );
  } catch { /* ignore */ }
}

export default function AiAssistantPanel({ inline = false }) {
  const location = useLocation();
  const { orgId } = useOrg();
  const { buildAIContext, loadCompanyData } = useAIContext();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "assistant",
      text: "Ciao! Sono RescueAI. Posso consultare i tuoi dati (fatture, clienti, trasporti, KPI...) e rispondere a domande sull'app. Chiedimi qualcosa.",
      done: true,
    },
  ]);

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // Carica dati azienda all'apertura + storico
  useEffect(() => {
    if (open) {
      loadCompanyData();
      const stored = loadHistory(orgId);
      if (stored.length > 0) {
        // Ricostruisci messaggi visibili dallo storico
        const reconstructed = stored.map((m, i) => ({
          id: `hist-${i}`,
          from: m.role === "user" ? "user" : "assistant",
          text: typeof m.content === "string" ? m.content : "",
          done: true,
        }));
        if (reconstructed.length > 0) {
          setMessages([{ id: "welcome", from: "assistant", text: "Bentornato. Ecco la conversazione precedente.", done: true }, ...reconstructed]);
        }
      }
    }
  }, [open, loadCompanyData, orgId]);

  // Autoscroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const clearHistory = useCallback(() => {
    if (orgId) localStorage.removeItem(HISTORY_KEY_PREFIX + orgId);
    setMessages([{
      id: "welcome",
      from: "assistant",
      text: "Conversazione resettata. Come posso aiutarti?",
      done: true,
    }]);
  }, [orgId]);

  const stopStream = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const handleProposalAction = useCallback(async (msgId, proposalId, accept) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        proposals: (m.proposals || []).map(p =>
          p.id === proposalId ? { ...p, status: accept ? "executing" : "rejected" } : p
        ),
      };
    }));

    if (!accept) return;

    const targetMsg = messages.find(m => m.id === msgId);
    const proposal = targetMsg?.proposals?.find(p => p.id === proposalId);
    if (!proposal) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/execute-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          action: proposal.action,
          payload: proposal.payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          proposals: (m.proposals || []).map(p =>
            p.id === proposalId ? { ...p, status: "done", resultId: data.id, resultSummary: data.summary } : p
          ),
        };
      }));
    } catch (err) {
      console.error("[AI] execute-action error:", err);
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          proposals: (m.proposals || []).map(p =>
            p.id === proposalId ? { ...p, status: "error", errorMessage: err.message } : p
          ),
        };
      }));
    }
  }, [messages, orgId]);

  const handleAsk = async () => {
    const question = input.trim();
    if (!question || streaming) return;

    const userMsg = { id: `u-${Date.now()}`, from: "user", text: question, done: true };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg = {
      id: assistantId,
      from: "assistant",
      text: "",
      toolCalls: [],
      done: false,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    // Costruisci storico per backend (esclude welcome)
    const history = messages
      .filter(m => m.id !== "welcome" && m.done && m.text)
      .map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));

    const aiContext = buildAIContext();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          route: location.pathname,
          question,
          context: aiContext,
          history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = null;

      const updateAssistant = (mutator) => {
        setMessages(prev => prev.map(m => m.id === assistantId ? mutator(m) : m));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (!currentEvent || !data) continue;
            try {
              const payload = JSON.parse(data);
              switch (currentEvent) {
                case "meta":
                  setModel(payload.model);
                  break;
                case "text":
                  updateAssistant(m => ({ ...m, text: m.text + (payload.delta || "") }));
                  break;
                case "tool_call":
                  updateAssistant(m => ({
                    ...m,
                    toolCalls: [...(m.toolCalls || []), { id: payload.id, name: payload.name, input: payload.input, status: "running" }],
                  }));
                  break;
                case "tool_result":
                  updateAssistant(m => ({
                    ...m,
                    toolCalls: (m.toolCalls || []).map(tc =>
                      tc.id === payload.id
                        ? { ...tc, status: payload.ok ? "done" : "error", summary: payload.summary, error: payload.error }
                        : tc
                    ),
                  }));
                  break;
                case "action_proposal":
                  console.log("[AI] action_proposal received:", payload);
                  updateAssistant(m => ({
                    ...m,
                    proposals: [...(m.proposals || []), { ...payload, status: "pending" }],
                  }));
                  break;
                case "done":
                  updateAssistant(m => ({ ...m, done: true, usage: payload.usage }));
                  break;
                case "error":
                  updateAssistant(m => ({
                    ...m,
                    text: (m.text || "") + `\n\n[Errore: ${payload.message}]`,
                    done: true,
                    error: true,
                  }));
                  break;
                default:
                  break;
              }
            } catch (e) {
              console.warn("[AI] parse SSE error:", e, data);
            }
            currentEvent = null;
          } else if (line.trim() === "") {
            currentEvent = null;
          }
        }
      }

      // Salva storico
      setMessages(curr => {
        const withFinalText = curr.find(m => m.id === assistantId);
        if (withFinalText && withFinalText.text) {
          const hist = curr
            .filter(m => m.id !== "welcome" && m.done && m.text)
            .map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
          saveHistory(orgId, hist);
        }
        return curr;
      });
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, text: (m.text || "") + "\n\n[Interrotto]", done: true }
          : m
        ));
      } else {
        console.error("[AI] error:", err);
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, text: `Errore di connessione: ${err.message}`, done: true, error: true }
          : m
        ));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const buttonClass = inline
    ? "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
    : "fixed bottom-4 right-4 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all";

  return (
    <>
      <button onClick={() => setOpen(!open)} className={buttonClass} title="RescueAI Assistant">
        <FiCpu className={inline ? "w-3.5 h-3.5" : "w-5 h-5"} />
        {inline && <span>RescueAI</span>}
      </button>

      {open && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-md h-[600px] bg-[#0f1622] text-slate-200 rounded-2xl shadow-2xl border border-[#243044] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044] bg-gradient-to-r from-indigo-900/40 to-purple-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FiCpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">RescueAI</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  {model ? (
                    <>
                      <FiZap className="w-2.5 h-2.5" />
                      {model.includes("haiku") ? "Haiku (veloce)" : "Sonnet (avanzato)"}
                    </>
                  ) : "Pronto"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                disabled={streaming}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition disabled:opacity-40"
                title="Cancella conversazione"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} onProposalAction={handleProposalAction} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#243044] px-3 py-2.5 bg-[#0c1929]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 bg-[#141c27] border border-[#243044] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                placeholder={streaming ? "RescueAI sta rispondendo..." : "Chiedimi qualsiasi cosa..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              {streaming ? (
                <button
                  onClick={stopStream}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  title="Stop"
                >
                  <FiX className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleAsk}
                  disabled={!input.trim()}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-40 transition"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

AiAssistantPanel.propTypes = {
  inline: PropTypes.bool,
};

function MessageBubble({ msg, onProposalAction }) {
  const isUser = msg.from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "" : "space-y-2"}`}>
        {/* Tool calls */}
        {!isUser && msg.toolCalls?.length > 0 && (
          <div className="space-y-1">
            {msg.toolCalls.map(tc => (
              <div
                key={tc.id}
                className="flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg bg-[#141c27] border border-[#243044]"
              >
                {tc.status === "running" && <FiTool className="w-3 h-3 text-indigo-400 animate-pulse" />}
                {tc.status === "done" && <FiCheck className="w-3 h-3 text-emerald-400" />}
                {tc.status === "error" && <FiAlertCircle className="w-3 h-3 text-red-400" />}
                <span className="text-slate-300">{TOOL_LABELS[tc.name] || tc.name}</span>
                {tc.summary && <span className="text-slate-500">— {tc.summary}</span>}
                {tc.error && <span className="text-red-400">{tc.error}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Action proposals — confermabili */}
        {!isUser && msg.proposals?.length > 0 && (
          <div className="space-y-2">
            {msg.proposals.map(p => (
              <div
                key={p.id}
                className={`rounded-2xl border-2 p-3 ${
                  p.status === "done"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : p.status === "rejected"
                      ? "bg-slate-500/10 border-slate-500/20 opacity-60"
                      : p.status === "error"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-indigo-500/10 border-indigo-500/40"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                    <FiZap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Azione proposta</div>
                    <div className="text-sm font-bold text-white">{p.title}</div>
                  </div>
                </div>
                {p.details?.length > 0 && (
                  <ul className="space-y-0.5 mb-3 text-xs text-slate-300">
                    {p.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                {p.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onProposalAction(msg.id, p.id, true)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                      {p.confirm_label || "Conferma"}
                    </button>
                    <button
                      onClick={() => onProposalAction(msg.id, p.id, false)}
                      className="px-3 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                    >
                      Annulla
                    </button>
                  </div>
                )}
                {p.status === "executing" && (
                  <div className="text-xs text-indigo-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    Esecuzione in corso...
                  </div>
                )}
                {p.status === "done" && (
                  <div className="text-xs text-emerald-300 flex items-center gap-1.5">
                    <FiCheck className="w-3.5 h-3.5" />
                    {p.resultSummary || "Fatto!"}
                  </div>
                )}
                {p.status === "rejected" && (
                  <div className="text-xs text-slate-400">Annullato</div>
                )}
                {p.status === "error" && (
                  <div className="text-xs text-red-300">
                    Errore: {p.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        {(msg.text || (!msg.done && !isUser)) && (
          <div className={`rounded-2xl px-3 py-2 text-sm ${
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
              : msg.error
                ? "bg-red-900/30 border border-red-500/30 text-red-200"
                : "bg-[#141c27] border border-[#243044] text-slate-200"
          }`}>
            {msg.text ? (
              isUser ? (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              ) : (
                <div className="ai-markdown leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h3 className="text-base font-bold text-white mt-2 mb-1.5">{children}</h3>,
                      h2: ({ children }) => <h3 className="text-sm font-bold text-white mt-2 mb-1.5">{children}</h3>,
                      h3: ({ children }) => <h4 className="text-sm font-bold text-slate-100 mt-1.5 mb-1">{children}</h4>,
                      strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="leading-snug">{children}</li>,
                      code: ({ inline, children }) =>
                        inline
                          ? <code className="px-1 py-0.5 rounded bg-black/30 text-indigo-300 text-[12px] font-mono">{children}</code>
                          : <code className="block px-3 py-2 my-2 rounded-lg bg-black/40 text-indigo-200 text-[12px] font-mono overflow-x-auto">{children}</code>,
                      pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2 -mx-1">
                          <table className="w-full text-[12px] border-collapse">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
                      th: ({ children }) => <th className="px-2 py-1 text-left font-bold text-white border border-white/10">{children}</th>,
                      td: ({ children }) => <td className="px-2 py-1 border border-white/10 text-slate-200">{children}</td>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">{children}</a>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500/40 pl-3 my-2 italic text-slate-300">{children}</blockquote>,
                      hr: () => <hr className="my-3 border-white/10" />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    id: PropTypes.string,
    from: PropTypes.string.isRequired,
    text: PropTypes.string,
    done: PropTypes.bool,
    error: PropTypes.bool,
    toolCalls: PropTypes.array,
    proposals: PropTypes.array,
  }).isRequired,
  onProposalAction: PropTypes.func,
};
