import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const TRIAL_DAYS = 14;

// Map our plan keys to the Stripe Price IDs (set per-environment in Vercel).
export const PRICE_BY_PLAN = {
  solo: process.env.STRIPE_PRICE_SOLO,
  pro: process.env.STRIPE_PRICE_PRO,
  team: process.env.STRIPE_PRICE_TEAM,
};

// Reverse lookup so the webhook can store a friendly plan name from the price.
export function planForPrice(priceId) {
  for (const [plan, id] of Object.entries(PRICE_BY_PLAN)) {
    if (id && id === priceId) return plan;
  }
  return null;
}

// Pull the Bearer token out of an incoming request.
export function bearer(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

// Validate a Supabase access token and return the user (or null). Uses the
// admin client purely to reach the auth server; the token itself is what's
// being verified, so this can't be spoofed by a forged user id.
export async function userFromToken(token) {
  if (!token) return null;
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

// Upsert our subscriptions row from a Stripe Subscription object. One row per
// user (user_id is the PK), so onConflict resolves cleanly on every update.
export async function upsertSubscription(sub, { userId, customerId } = {}) {
  const priceId = sub.items?.data?.[0]?.price?.id || null;
  const row = {
    user_id: userId,
    stripe_customer_id: customerId || sub.customer || null,
    stripe_subscription_id: sub.id,
    status: sub.status,
    plan: planForPrice(priceId),
    price_id: priceId,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await getSupabaseAdmin()
    .from("subscriptions")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}
