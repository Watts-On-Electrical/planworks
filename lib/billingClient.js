"use client";

// Thin client wrappers around the billing API routes.
// Both endpoints expect a Supabase access token as a Bearer header and return
// a Stripe-hosted URL we send the browser to. Keeping the fetch/redirect logic
// here means the UI components stay declarative.

import { supabase } from "@/lib/supabase";

async function authedPost(path, body) {
  if (!supabase) throw new Error("This app isn't linked to the cloud yet.");

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session has expired — sign in again.");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });

  let payload = null;
  try { payload = await res.json(); } catch { /* non-JSON error body */ }

  if (!res.ok || !payload?.url) {
    throw new Error(payload?.error || "Something went wrong reaching billing. Try again in a moment.");
  }
  return payload.url;
}

// Start a Stripe Checkout session for the subscription and hand the browser over.
export async function startCheckout() {
  const url = await authedPost("/api/billing/checkout", {});
  window.location.assign(url);
}

// Open the Stripe Customer Portal so the user can change plan, update card,
// or cancel. Returns them to the app afterwards (return URL set server-side).
export async function openBillingPortal() {
  const url = await authedPost("/api/billing/portal", {});
  window.location.assign(url);
}
