// supabase/functions/billing_portal/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET")!, { apiVersion: "2024-06-20" });

// opzionale: dove tornare dopo il portale
const SITE_URL = Deno.env.get("SITE_URL") || "https://rescuemanager.eu";

// CORS: consenti dev e prod
const ALLOWED = new Set(["http://localhost:5173", "https://rescuemanager.eu"]);

function corsHeaders(origin: string | null) {
  const ok = origin && ALLOWED.has(origin) ? origin : "";
  return ok
    ? {
        "Access-Control-Allow-Origin": ok,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      }
    : {};
}

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders(req.headers.get("origin")) });
  }

  try {
    const { org_id } = await req.json().catch(() => ({}));
    if (!org_id) {
      return new Response("Missing org_id", { status: 400, headers: corsHeaders(req.headers.get("origin")) });
    }

    // 1) trova un customer con metadata.org_id = org_id
    // (Stripe non ha query per metadata, quindi facciamo un list() e filtriamo;
    // se hai tanti customer valuta di memorizzare lo stripe_customer_id su org_subscriptions)
    let customer: Stripe.Customer | undefined;
    const list = await stripe.customers.list({ limit: 100 });
    customer = list.data.find((c) => (c.metadata as Record<string, string> | undefined)?.org_id === org_id);

    // 2) se non esiste, crealo
    if (!customer) {
      customer = await stripe.customers.create({
        description: `RescueManager org ${org_id}`,
        metadata: { org_id },
      });
    }

    // 3) Crea sessione per il Billing Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${SITE_URL}/settings`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      status: 200,
    });
  } catch (e: any) {
    return new Response(`billing_portal error: ${e?.message || "unknown"}`, {
      status: 500,
      headers: corsHeaders(req.headers.get("origin")),
    });
  }
});