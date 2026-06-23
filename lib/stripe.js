import Stripe from "stripe";

// Lazily constructed so importing this module during `next build` (when secrets
// may be absent) never throws. The key only needs to exist at request time.
let _stripe = null;

export function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}
