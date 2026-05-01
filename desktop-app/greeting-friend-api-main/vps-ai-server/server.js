// VPS AI Server — RescueAI v2
// Claude Sonnet 4.6 + extended thinking + tool use + streaming + prompt caching
// Endpoint: POST /api/ai/chat (SSE streaming)
//
// Deploy: see README.md
// Port: configurabile via .env (default 3200)

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");
const { TOOL_DEFS, executeTool } = require("./tools");
const { ACTION_TOOL_DEFS, buildProposal, executeAction } = require("./actions");

const ALL_TOOLS = [...TOOL_DEFS, ...ACTION_TOOL_DEFS];
const PROPOSE_TOOL_NAMES = new Set(ACTION_TOOL_DEFS.map(t => t.name));

// ── Config ──
const PORT = process.env.PORT || 3200;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_REASONING = process.env.AI_MODEL_REASONING || "claude-sonnet-4-6";
const MODEL_FAST = process.env.AI_MODEL_FAST || "claude-haiku-4-5-20251001";
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 2048);
const MAX_TOOL_ITERATIONS = Number(process.env.AI_MAX_TOOL_ITERATIONS || 8);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[ai-server] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("[ai-server] Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── In-memory rate limit (per org_id) ──
// Replace with Redis if multi-instance deployment.
const rateLimits = new Map();
const RATE_LIMIT_PER_HOUR = Number(process.env.AI_RATE_LIMIT_PER_HOUR || 100);

function checkRateLimit(orgId) {
  const now = Date.now();
  const hourAgo = now - 3600 * 1000;
  const arr = (rateLimits.get(orgId) || []).filter(ts => ts > hourAgo);
  if (arr.length >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, remaining: 0, resetIn: Math.ceil((arr[0] + 3600 * 1000 - now) / 1000) };
  }
  arr.push(now);
  rateLimits.set(orgId, arr);
  return { ok: true, remaining: RATE_LIMIT_PER_HOUR - arr.length };
}

// ── System prompt (cacheable) ──
function buildSystemPrompt(ctx) {
  return `Sei RescueAI, l'assistente virtuale di RescueManager — un gestionale italiano per autodemolitori, autotrasporti, e gestione VFU/RVFU/RENTRI/SDI.

LINGUA: Rispondi sempre in italiano, tono professionale ma amichevole.

CAPACITÀ:
- LETTURA: hai accesso ai dati dell'organizzazione tramite tools query_* (clienti, fatture, trasporti, demolizioni, piazzale, autisti, veicoli, impostazioni, KPI).
- USA i tools per rispondere a domande su dati specifici. Non inventare numeri.
- Per domande generali o how-to, rispondi direttamente senza chiamare tools.
- Quando l'utente chiede "quanto fatturato ho fatto", "quanti trasporti", "stato fatture" → SEMPRE usa compute_kpi o query_invoices.
- Per ricerche libere ("dimmi di Mario Rossi") usa search_global o query_clients.

AZIONI (creazione record):
- Hai 5 tool propose_* per CREARE record: propose_client, propose_transport, propose_quote, propose_yard_vehicle, propose_draft_invoice.
- Questi tool NON scrivono direttamente: mostrano all'utente una CARD CON PULSANTE DI CONFERMA in chat.
- IMPORTANTE: l'utente NON deve scrivere "conferma" a mano. La card appare automaticamente con un bottone verde — l'utente clicca quello.
- USA propose_* SUBITO quando l'utente chiede di "creare", "aggiungere", "inserire", "registrare", "fatturare", "preventivare", "apri trasporto", "fai fattura", "nuovo cliente", ecc. NON dire "vuoi che lo crei?" e aspettare conferma — chiama direttamente il tool, sarà l'utente a vedere il bottone e decidere.
- Prima di proporre: se ti mancano dati ESSENZIALI (es. l'indirizzo per un trasporto, almeno un voce per un preventivo, la targa per il piazzale), CHIEDILI all'utente prima di chiamare il tool — non inventare.
- Se conosci già il client_id dal contesto o da una query precedente, usalo.
- Dopo aver chiamato propose_*, in 1 frase riassumi cosa hai proposto e dì "Trovi la card di conferma sopra. Clicca il pulsante verde per creare." Niente di più.

CONTESTO PAGINA CORRENTE:
- Modulo: ${ctx.page?.module || "n/d"}
- Azione: ${ctx.page?.action || "n/d"}
- Route: ${ctx.route || "n/d"}

AZIENDA:
- Nome: ${ctx.company?.name || "n/d"}
- P.IVA: ${ctx.company?.vat || "n/d"}

REGOLE:
1. Se non hai dati per rispondere, di' chiaramente "Non ho questa informazione" e suggerisci dove trovarla.
2. Numeri, date e importi devono venire SEMPRE da tool calls, mai inventati.
3. Importi in euro, formato italiano (es. €1.234,56).
4. Date formato italiano (es. 29 aprile 2026).
5. Se l'utente chiede di modificare/creare dati, spiega COSA va fatto e dove (l'AI in questa versione è read-only).
6. Sii conciso. Risposte brevi ma complete.`;
}

// ── Decide model based on query complexity ──
function chooseModel(question, hasContext) {
  const len = (question || "").length;
  // Use fast model for short, simple questions
  if (len < 80 && !/(quant|riepilog|analizz|spieg|come|perché)/i.test(question)) {
    return MODEL_FAST;
  }
  return MODEL_REASONING;
}

// ── App ──
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-server", uptime: process.uptime(), version: "2.0.0" });
});

// ── POST /api/ai/chat — SSE streaming ──
app.post("/api/ai/chat", async (req, res) => {
  const { org_id: orgId, route, question, context = {}, history = [] } = req.body || {};

  if (!orgId) return res.status(400).json({ ok: false, error: "org_id mancante" });
  if (!question || typeof question !== "string") {
    return res.status(400).json({ ok: false, error: "question mancante" });
  }

  // Rate limit
  const rl = checkRateLimit(orgId);
  if (!rl.ok) {
    return res.status(429).json({
      ok: false,
      error: `Limite di ${RATE_LIMIT_PER_HOUR} richieste/ora superato. Riprova tra ${rl.resetIn}s.`,
    });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const model = chooseModel(question, !!context);
    const system = [
      {
        type: "text",
        text: buildSystemPrompt({ ...context, route }),
        cache_control: { type: "ephemeral" },
      },
    ];

    // Build conversation messages (history + new user message)
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    const messages = [
      ...safeHistory.filter(m => m && (m.role === "user" || m.role === "assistant") && m.content),
      { role: "user", content: question },
    ];

    send("meta", { model, rateLimitRemaining: rl.remaining });

    let iteration = 0;
    const ctx = { supabase, orgId };

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;

      const stream = await anthropic.messages.stream({
        model,
        max_tokens: MAX_TOKENS,
        system,
        tools: ALL_TOOLS.map((t, i) =>
          // Cache tool defs (last tool gets cache marker — caches all preceding)
          i === ALL_TOOLS.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
        ),
        messages,
      });

      let toolUses = [];
      let textBuffer = "";

      stream.on("text", (delta) => {
        textBuffer += delta;
        send("text", { delta });
      });

      stream.on("contentBlock", (block) => {
        if (block.type === "tool_use") {
          toolUses.push(block);
          send("tool_call", { id: block.id, name: block.name, input: block.input });
        }
      });

      const finalMessage = await stream.finalMessage();

      if (finalMessage.stop_reason === "tool_use" && toolUses.length > 0) {
        // Execute tool calls in parallel
        const toolResults = await Promise.all(
          toolUses.map(async (tu) => {
            try {
              // ── Action proposal: build payload, emit special event, return preview to AI ──
              if (PROPOSE_TOOL_NAMES.has(tu.name)) {
                const proposal = buildProposal(tu.name, tu.input);
                if (!proposal) throw new Error(`Cannot build proposal for ${tu.name}`);
                send("action_proposal", { id: tu.id, ...proposal });
                // Mark tool_call as done in UI (otherwise stays "running")
                send("tool_result", { id: tu.id, name: tu.name, ok: true, summary: `Proposta: ${proposal.title}` });
                console.log(`[ai-server] proposal emitted: ${proposal.action} (${proposal.title})`);
                // Tell the AI the proposal has been shown to the user
                return {
                  type: "tool_result",
                  tool_use_id: tu.id,
                  content: JSON.stringify({
                    status: "proposal_shown_to_user",
                    title: proposal.title,
                    summary: proposal.details.slice(0, 3).join("; "),
                    note: "L'utente vedrà un pulsante di conferma. Riassumi brevemente cosa hai proposto e invitalo a rivedere/confermare."
                  }),
                };
              }

              const result = await executeTool(tu.name, tu.input, ctx);
              send("tool_result", { id: tu.id, name: tu.name, ok: true, summary: summarizeResult(tu.name, result) });
              return {
                type: "tool_result",
                tool_use_id: tu.id,
                content: JSON.stringify(result).slice(0, 8000), // cap size
              };
            } catch (err) {
              console.error(`[ai-server] tool ${tu.name} error:`, err.message);
              send("tool_result", { id: tu.id, name: tu.name, ok: false, error: err.message });
              return {
                type: "tool_result",
                tool_use_id: tu.id,
                content: `Errore: ${err.message}`,
                is_error: true,
              };
            }
          })
        );

        // Add assistant turn + tool results to messages, then continue loop
        messages.push({ role: "assistant", content: finalMessage.content });
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // No more tool calls, we're done
      send("done", {
        stop_reason: finalMessage.stop_reason,
        usage: finalMessage.usage,
        iterations: iteration,
      });
      break;
    }

    if (iteration >= MAX_TOOL_ITERATIONS) {
      send("error", { message: "Limite iterazioni tool raggiunto" });
    }

    res.end();
  } catch (err) {
    console.error("[ai-server] /chat error:", err);
    send("error", { message: err.message || "Errore interno" });
    res.end();
  }
});

// ── POST /api/ai/execute-action — esegue una proposta confermata dall'utente ──
app.post("/api/ai/execute-action", async (req, res) => {
  try {
    const { org_id: orgId, action, payload } = req.body || {};
    if (!orgId) return res.status(400).json({ ok: false, error: "org_id mancante" });
    if (!action || !payload) return res.status(400).json({ ok: false, error: "action o payload mancante" });

    // Rate limit (uses same bucket as chat)
    const rl = checkRateLimit(orgId);
    if (!rl.ok) {
      return res.status(429).json({
        ok: false,
        error: `Limite di ${RATE_LIMIT_PER_HOUR} azioni/ora superato. Riprova tra ${rl.resetIn}s.`,
      });
    }

    const result = await executeAction(action, payload, { supabase, orgId });
    console.log(`[ai-server] action ${action} executed for org ${orgId.slice(0, 8)}: ${result.summary}`);
    res.json(result);
  } catch (err) {
    console.error("[ai-server] /execute-action error:", err);
    res.status(500).json({ ok: false, error: err.message || "Errore interno" });
  }
});

// ── Summarize tool result for streaming visualization ──
function summarizeResult(name, result) {
  if (!result) return "vuoto";
  if (result.count !== undefined) return `${result.count} risultati`;
  if (result.rows) return `${result.rows.length} righe`;
  if (name === "compute_kpi") {
    return `Fatturato: €${Math.round(result.revenue || 0)}, Fatture: ${result.invoices_count}, Trasporti: ${result.transports_count}`;
  }
  if (name === "search_global") {
    const total = (result.clients?.length || 0) + (result.invoices?.length || 0) +
                  (result.transports?.length || 0) + (result.yard?.length || 0);
    return `${total} risultati`;
  }
  return "ok";
}

// ── Start ──
app.listen(PORT, "127.0.0.1", () => {
  console.log(`[ai-server] Listening on 127.0.0.1:${PORT}`);
  console.log(`[ai-server] Models: reasoning=${MODEL_REASONING}, fast=${MODEL_FAST}`);
  console.log(`[ai-server] Rate limit: ${RATE_LIMIT_PER_HOUR}/hour per org`);
});
