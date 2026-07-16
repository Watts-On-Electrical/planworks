"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import LoginScreen from "@/components/LoginScreen";
import Paywall from "@/components/Paywall";
import { supabase, isConfigured } from "@/lib/supabase";
import { getSettings, saveSettings } from "@/lib/db";
import { DEFAULT_TITLEBLOCK, normaliseTitleBlock } from "@/lib/titleBlock";
import { useSubscription } from "@/lib/useSubscription";
import { openBillingPortal } from "@/lib/billingClient";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx) || {};

function Splash({ label = "Loading Plotwire…" }) {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#F4F6F9] dark:bg-[#0B1117]">
      <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">{label}</div>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  // Public, read-only pages that must NOT be behind the login gate (e.g. the
  // planner share link contractors open without a Plotwire account).
  const isPublic = typeof pathname === "string" && pathname.startsWith("/planner/view");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try { return localStorage.getItem("planworks:theme") || "light"; } catch { return "light"; }
  });
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const [titleBlock, setTitleBlock] = useState(null); // null until loaded → default in the meantime
  const [boqTemplate, setBoqTemplate] = useState(null); // null = use built-in default
  const settingsRef = useRef({}); // latest full settings blob, so saves merge

  // --- Billing gate state ---
  // Billing ships dark: the paywall only enforces when this flag is explicitly
  // turned on in the environment. Until then the app behaves exactly as before
  // (no gate), so a half-configured Stripe can never lock users out. Set
  // NEXT_PUBLIC_BILLING_ENABLED=true in Vercel once Stripe is live and tested.
  const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
  const subscription = useSubscription(BILLING_ENABLED ? session : null);
  const [activating, setActivating] = useState(false); // returning from Stripe Checkout
  const [billingNotice, setBillingNotice] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("planworks:theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (!isConfigured || !supabase) { setChecking(false); setSession(false); return; }
    let active = true;
    // A password-reset link lands back here carrying a recovery token in the URL
    // hash. Flag it before the app renders so we show the set-password screen
    // instead of dropping the user straight into the app.
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecovery(true);
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session || false);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (_e === "PASSWORD_RECOVERY") setRecovery(true);
      if (_e === "SIGNED_OUT") setRecovery(false);
      setSession(s || false);
      setChecking(false);
    });
    return () => { active = false; sub?.subscription?.unsubscribe(); };
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);
  const signOut = useCallback(async () => { try { await supabase?.auth.signOut(); } catch {} }, []);

  // Open the Stripe Customer Portal (change plan / card / cancel).
  const manageBilling = useCallback(async () => {
    try { await openBillingPortal(); }
    catch (e) { setBillingNotice(e?.message || "Couldn't open the billing portal. Try again in a moment."); }
  }, []);

  // Read the ?checkout= flag Stripe appends to our return URL, then strip it so
  // a reload doesn't re-trigger. success → poll until the webhook lands the row;
  // cancelled → just show a gentle note on the paywall.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("checkout");
    if (!flag) return;
    params.delete("checkout");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    if (flag === "success") setActivating(true);
    else if (flag === "cancelled" || flag === "canceled") {
      setBillingNotice("Checkout cancelled — choose a plan whenever you're ready.");
    }
  }, []);

  // While activating, poll for the subscription row the webhook writes. Stops as
  // soon as access unlocks, or gives up after ~24s and falls back to the paywall.
  useEffect(() => {
    if (!activating) return;
    if (subscription.isActive) { setActivating(false); return; }
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      subscription.refresh();
      if (tries >= 16) { clearInterval(t); setActivating(false); }
    }, 1500);
    return () => clearInterval(t);
  }, [activating, subscription.isActive, subscription.refresh]);

  // Load the account's saved settings (title block + BOQ preset) once signed in.
  useEffect(() => {
    if (!session) { setTitleBlock(null); setBoqTemplate(null); return; }
    let active = true;
    getSettings().then(s => {
      if (!active) return;
      settingsRef.current = s || {};
      setTitleBlock(s?.titleBlock ? normaliseTitleBlock(s.titleBlock) : DEFAULT_TITLEBLOCK);
      setBoqTemplate(s?.boqTemplate || null);
    });
    return () => { active = false; };
  }, [session]);

  const saveTitleBlock = useCallback(async (tb) => {
    const next = normaliseTitleBlock(tb);
    settingsRef.current = { ...settingsRef.current, titleBlock: next };
    await saveSettings(settingsRef.current);
    setTitleBlock(next);
  }, []);

  const saveBoqTemplate = useCallback(async (tpl) => {
    settingsRef.current = { ...settingsRef.current, boqTemplate: tpl };
    await saveSettings(settingsRef.current);
    setBoqTemplate(tpl);
  }, []);

  if (isPublic) {
    return (
      <AppCtx.Provider value={{ theme, toggleTheme, user: null }}>
        {children}
      </AppCtx.Provider>
    );
  }

  if (checking) return <Splash />;
  if (recovery) return <LoginScreen recovery onRecovered={() => setRecovery(false)} />;
  if (!session) return <LoginScreen />;

  // Signed in — enforce billing access only when billing is switched on.
  if (BILLING_ENABLED) {
    if (subscription.loading) return <Splash />;
    if (activating && !subscription.isActive) return <Splash label="Activating your subscription…" />;
    if (!subscription.isActive) {
      return (
        <Paywall
          user={session?.user || null}
          onSignOut={signOut}
          onManageBilling={manageBilling}
          hasLapsed={Boolean(subscription.sub)}
          notice={billingNotice}
        />
      );
    }
  }

  return (
    <AppCtx.Provider value={{
      theme, toggleTheme, user: session?.user || null, signOut,
      titleBlock: titleBlock || DEFAULT_TITLEBLOCK, saveTitleBlock,
      boqTemplate, saveBoqTemplate,
      subscription, manageBilling,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
