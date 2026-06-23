import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { bearer, userFromToken, STRIPE_PRICE, APP_URL, TRIAL_DAYS } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const user = await userFromToken(bearer(req));
    if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const price = STRIPE_PRICE;
    if (!price) return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 400 });

    const admin = getSupabaseAdmin();
    const stripe = getStripe();

    // Reuse an existing Stripe customer if this user has subscribed before, so a
    // lapsed-then-resubscribing user keeps one customer record (and card on file).
    const { data: existing } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .limit(1);
    const customerId = existing?.[0]?.stripe_customer_id || null;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { user_id: user.id },
      },
      success_url: `${APP_URL}/?checkout=success`,
      cancel_url: `${APP_URL}/?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[billing/checkout]", e);
    return NextResponse.json({ error: "Could not start checkout. Try again shortly." }, { status: 500 });
  }
}
