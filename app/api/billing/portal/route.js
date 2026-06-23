import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { bearer, userFromToken, APP_URL } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const user = await userFromToken(bearer(req));
    if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const { data } = await getSupabaseAdmin()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .limit(1);
    const customerId = data?.[0]?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[billing/portal]", e);
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
