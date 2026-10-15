"use client";

import { Component, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

class CheckoutErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <p role="alert">The payment form could not load. Your request is saved. Please go to your portal or contact us for help completing payment.</p>
      : this.props.children;
  }
}

export function StripeCheckout({ clientSecret, requestId }: { clientSecret: string; requestId: string }) {
  const router = useRouter();
  const options = useMemo(() => ({
    clientSecret,
    onComplete: () => router.push(`/portal?payment=returned&request_id=${encodeURIComponent(requestId)}`)
  }), [clientSecret, requestId, router]);

  return (
    <section className="panel" aria-label="Secure payment" style={{ maxWidth: 1100, margin: "0 auto" }}>
      {stripePromise ? (
        <CheckoutErrorBoundary>
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </CheckoutErrorBoundary>
      ) : <p role="alert">Payments are temporarily unavailable. Your request is saved in your portal.</p>}
    </section>
  );
}
