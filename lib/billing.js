import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const TRIAL_DAYS = 14;

// Single flat subscription. One Stripe Price for the whole product.
export const STRIPE_PRICE = process.env.STRIPE_PRICE;

// The webhook stamps a friendly plan name on the row. With one tier this is
// always "standard" for our price (kept so the column stays meaningful and a
// future multi-tier change is easy).
export function planForPrice(priceId) {
  if (priceId && STRIPE_PRICE && priceId === STRIPE_PRICE) return "standard";
  return null;
}

// Pull the Bearer token out of an incoming request.
export function bearer(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

// Validate a Supabase access token and return the user (or null).
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

// Upsert our subscriptions row from a Stripe Subscription object.
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
