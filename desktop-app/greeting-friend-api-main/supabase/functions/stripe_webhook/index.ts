// supabase/functions/stripe_webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

// Legge le env settate con `supabase secrets set`
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET")!, { apiVersion: "2024-06-20" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const sbUrl = Deno.env.get("SB_URL")!;                  // <-- rinominata
const svcKey = Deno.env.get("SB_SERVICE_ROLE_KEY")!;    // <-- rinominata

async function upsertOrgSub(org_id: string, patch: Record<string, unknown>) {
  // upsert riga per org_id
  await fetch(`${sbUrl}/rest/v1/org_subscriptions`, {
    method: "POST",
    headers: {
      apikey: svcKey,
      Authorization: `Bearer ${svcKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ org_id, ...patch }),
  });
}

serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const raw = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const plan = (sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id) ?? null;

      // recupera org_id dal customer (metadata.org_id)
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const org_id = (customer.metadata as any)?.org_id;
      if (org_id) {
        await upsertOrgSub(org_id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const org_id = (customer.metadata as any)?.org_id;
      if (org_id) {
        await upsertOrgSub(org_id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: "canceled",
        });
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});