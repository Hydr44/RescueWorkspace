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

// ── FASE 4b: budget/consumo IA per org (degrado morbido + conteggio €) ──
// Prezzi indicativi € per 1M token (input/output), sovrascrivibili via env.
const AI_EUR_PER_MTOK = {
  reasoning: { in: Number(process.env.AI_EUR_IN_REASONING || 2.8), out: Number(process.env.AI_EUR_OUT_REASONING || 14) },
  fast: { in: Number(process.env.AI_EUR_IN_FAST || 0.9), out: Number(process.env.AI_EUR_OUT_FAST || 4.5) },
};
function aiEurCost(tier, inTok, outTok) {
  const p = AI_EUR_PER_MTOK[tier] || AI_EUR_PER_MTOK.reasoning;
  return ((inTok || 0) * p.in + (outTok || 0) * p.out) / 1_000_000;
}
// Stato budget IA dell'org (best-effort: in caso di errore NON degrada).
async function aiBudgetStatus(orgId) {
  try {
    const [{ data: eff }, { data: usg }] = await Promise.all([
      supabase.rpc("get_org_effective_limits", { p_org_id: orgId }),
      supabase.rpc("get_org_usage", { p_org_id: orgId }),
    ]);
    const included = !eff || eff.ai_included !== false;
    const budget = eff ? Number(eff.ai_budget_eur) : null;
    const used = usg ? Number(usg.ai_eur || 0) : 0;
    return { overBudget: !!(included && budget > 0 && used >= budget), budget, used };
  } catch (e) {
    console.warn("[usage] aiBudgetStatus fallito (best-effort):", e.message || e);
    return { overBudget: false, budget: null, used: 0 };
  }
}
// Incrementa il consumo IA in € per l'org (best-effort).
async function countAiEur(orgId, eur) {
  if (!orgId || !(eur > 0)) return;
  try {
    await supabase.rpc("increment_usage", { p_org_id: orgId, p_metric: "ai_eur", p_amount: eur });
  } catch (e) {
    console.warn("[usage] increment_usage ai_eur fallito (best-effort):", e.message || e);
  }
}

// ── System prompt (cacheable) ──
function buildSystemPrompt(ctx) {
  const supportBlock = ctx.supportsTicket ? `

SUPPORTO UMANO (apertura richiesta al supporto):
- Hai il tool propose_support_ticket per aprire una RICHIESTA AL SUPPORTO umano di RescueManager.
- CHIAMALO SUBITO (stesso turno) quando l'utente: segnala un malfunzionamento/bug, dice che qualcosa "non funziona / va in errore / si blocca / schermata blu", chiede esplicitamente "potete aiutarmi / contattatemi / voglio un operatore / assistenza", oppure quando non sai o non puoi risolvere tu. In questi casi NON limitarti a spiegare il problema: chiama il tool.
- Un bug dell'app non lo puoi risolvere tu: aprire la richiesta È il modo di aiutare l'utente.
- Se invece è una semplice domanda how-to a cui sai rispondere (es. "come aggiungo un cliente"), rispondi e NON proporre il ticket.
- Quando lo chiami: subject breve e chiaro, category (bug/funzionalita/fatturazione/domanda/altro), priority (urgent solo se blocca il lavoro), message = riassunto del problema + cosa l'utente ha già provato (ricavato dalla conversazione). Comparirà una scheda che l'utente potrà rivedere, modificare e inviare.
- Dopo averlo chiamato, in 1 frase di' che hai preparato una richiesta al supporto da rivedere e inviare nella scheda qui sopra.` : "";
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
- Dopo aver chiamato propose_*, in 1 frase riassumi cosa hai proposto e dì "Trovi la card di conferma sopra. Clicca il pulsante verde per creare." Niente di più.${supportBlock}

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

// CORS allowlist
const ALLOWED_ORIGINS = new Set([
  'https://rescuemanager.eu',
  'https://www.rescuemanager.eu',
  'https://assist.rescuemanager.eu',
  'https://staging.rescuemanager.eu',
  'app://rse', 'app://./', 'app://.', 'app://-',
]);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server, curl
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    if (origin.startsWith('app://')) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: false,
}));
app.use(express.json({ limit: "1mb" }));

// ── Auth middleware: verifica Supabase JWT + carica orgIds da org_members ──
async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return res.status(401).json({ ok: false, error: 'Missing bearer token' });
    const token = m[1].trim();
    if (!token) return res.status(401).json({ ok: false, error: 'Empty bearer token' });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
    const userId = userData.user.id;

    const { data: memberships, error: memErr } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId);
    if (memErr) {
      console.error('[ai-server] org_members lookup error:', memErr);
      return res.status(500).json({ ok: false, error: 'Auth lookup failed' });
    }
    const orgIds = (memberships || []).map(m => m.org_id);
    if (!orgIds.length) {
      return res.status(403).json({ ok: false, error: 'No organization membership' });
    }
    req.auth = { userId, orgIds, roles: memberships };
    next();
  } catch (err) {
    console.error('[ai-server] requireAuth error:', err);
    res.status(500).json({ ok: false, error: 'Auth internal error' });
  }
}

// ── Cross-org-strict helper ──
// Risolve org_id da body/query in modo SICURO:
//   - se il client passa un org_id, DEVE essere tra req.auth.orgIds → altrimenti 403
//   - se assente: default a req.auth.orgIds[0] SOLO se l'utente ha 1 org → altrimenti 400
// Sostituisce il pattern silent-fallback "(candidate && orgIds.includes(candidate)) ? candidate : orgIds[0]"
// che causava cross-org data corruption per utenti multi-org.
function resolveOrgIdStrict(req, source) {
  const src = source === 'query' ? (req.query || {}) : (req.body || {});
  const candidate = src.org_id || src.orgId;
  if (candidate) {
    if (!req.auth || !Array.isArray(req.auth.orgIds) || !req.auth.orgIds.includes(candidate)) {
      const err = new Error('org_id non autorizzato per questo utente');
      err.status = 403;
      throw err;
    }
    return candidate;
  }
  if (req.auth && Array.isArray(req.auth.orgIds) && req.auth.orgIds.length === 1) {
    return req.auth.orgIds[0];
  }
  const err = new Error("org_id richiesto (utente in più organizzazioni)");
  err.status = 400;
  throw err;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-server", uptime: process.uptime(), version: "2.0.0" });
});

// ── POST /api/ai/chat — SSE streaming ──
app.post("/api/ai/chat", requireAuth, async (req, res) => {
  const { route, question, context = {}, history = [], client_caps = [] } = req.body || {};
  // Capability gating: il tool di apertura ticket al supporto viene esposto SOLO
  // ai client che lo dichiarano (build desktop aggiornata). I client vecchi non
  // ricevono il tool → il bot non propone una card che non saprebbero gestire.
  const supportsTicket = Array.isArray(client_caps) && client_caps.includes("support_ticket");
  const effectiveTools = supportsTicket
    ? ALL_TOOLS
    : ALL_TOOLS.filter((t) => t.name !== "propose_support_ticket");
  // Force orgId from token; client may suggest one but must be in the allowed set
  let orgId;
  try { orgId = resolveOrgIdStrict(req); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

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
    // FASE 4b: degrado morbido IA — a budget esaurito usa il modello economy (mai blocco).
    const budgetStatus = await aiBudgetStatus(orgId);
    const degraded = budgetStatus.overBudget;
    const model = degraded ? MODEL_FAST : chooseModel(question, !!context);
    const modelTier = model === MODEL_FAST ? "fast" : "reasoning";
    let aiInTok = 0, aiOutTok = 0;
    const system = [
      {
        type: "text",
        text: buildSystemPrompt({ ...context, route, supportsTicket }),
        cache_control: { type: "ephemeral" },
      },
    ];

    // Build conversation messages (history + new user message)
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    const messages = [
      ...safeHistory.filter(m => m && (m.role === "user" || m.role === "assistant") && m.content),
      { role: "user", content: question },
    ];

    send("meta", { model, degraded, rateLimitRemaining: rl.remaining });

    let iteration = 0;
    const ctx = { supabase, orgId };

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;

      const stream = await anthropic.messages.stream({
        model,
        max_tokens: MAX_TOKENS,
        system,
        tools: effectiveTools.map((t, i) =>
          // Cache tool defs (last tool gets cache marker — caches all preceding)
          i === effectiveTools.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
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
      if (finalMessage.usage) {
        aiInTok += (finalMessage.usage.input_tokens || 0) + (finalMessage.usage.cache_read_input_tokens || 0) + (finalMessage.usage.cache_creation_input_tokens || 0);
        aiOutTok += (finalMessage.usage.output_tokens || 0);
      }

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

    // FASE 4b: conteggio consumo IA (€) best-effort, fire-and-forget (non ritarda la risposta).
    countAiEur(orgId, aiEurCost(modelTier, aiInTok, aiOutTok));

    res.end();
  } catch (err) {
    console.error("[ai-server] /chat error:", err);
    send("error", { message: err.message || "Errore interno" });
    res.end();
  }
});

// ── POST /api/ai/execute-action — esegue una proposta confermata dall'utente ──
app.post("/api/ai/execute-action", requireAuth, async (req, res) => {
  try {
    const { action, payload } = req.body || {};
    let orgId;
    try { orgId = resolveOrgIdStrict(req); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
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

// ── POST /api/ai/consulente-ambientale — consulente rifiuti/ambientale (web search) ──
app.post("/api/ai/consulente-ambientale", requireAuth, async (req, res) => {
  try {
    const { messages = [], contesto = "" } = req.body || {};
    let orgId;
    try { orgId = resolveOrgIdStrict(req); }
    catch { orgId = (req.auth.orgIds || [])[0]; }
    if (!orgId) return res.status(403).json({ ok: false, error: "Nessuna organizzazione" });
    const rl = checkRateLimit(orgId);
    if (!rl.ok) return res.status(429).json({ ok: false, error: `Limite di ${RATE_LIMIT_PER_HOUR}/ora superato. Riprova tra ${rl.resetIn}s.` });
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ ok: false, error: "messages mancante" });

    const system = `Sei il consulente ambientale di un'azienda italiana di autodemolizione (veicoli fuori uso, rifiuti, tracciabilita RENTRI). Rispondi come un consulente vero: pratico e concreto, in italiano, testo semplice e conciso (evita tabelle e markdown pesante, poche righe). Spiega sempre il "perche" e il prossimo passo.

REGOLE:
- Usa web_search per verificare normativa, codici CER/EER, adempimenti e scadenze PRIMA di dare risposte tecniche: non affidarti alla memoria per numeri di norme o codici; cita brevemente la fonte quando e rilevante.
- Per i dati specifici dell'azienda usa SOLO il blocco "DATI AZIENDA" qui sotto; se un dato non c'e, dillo.
- Non inventare mai codici o estremi di norme. Se sei incerto, cerca o dillo.
- Se ti chiedono se possono trattare un codice, controlla nei CER autorizzati dell'azienda e rispondi netto.

DATI AZIENDA (dal gestionale, aggiornati adesso):
${contesto || "Nessun dato di profilo disponibile."}`;

    let msgs = messages.slice(-12)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.text || m.content || "") }))
      .filter((m) => m.content);

    let final = null;
    for (let i = 0; i < 5; i++) {
      final = await anthropic.messages.create({
        model: MODEL_REASONING,
        max_tokens: 2000,
        system,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
        messages: msgs,
      });
      if (final.stop_reason === "pause_turn") { msgs.push({ role: "assistant", content: final.content }); continue; }
      break;
    }
    const text = (final?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    console.log(`[ai-server] consulente-ambientale org ${String(orgId).slice(0, 8)}: ${text.length} chars`);
    res.json({ ok: true, text: text || "Non ho una risposta al momento." });
  } catch (err) {
    console.error("[ai-server] /consulente-ambientale error:", err);
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
