import Link from "next/link";
import { HeroBackdrop } from "@/components/HeroBackdrop";

export default function PaymentPage() {
  return (
    <main className="page">
      <HeroBackdrop variant="intake" eyebrow="Payment" title="Pay securely after your request is ready.">
        <p>
          In the rebuilt site, payment is integrated into the request flow so the
          client reviews the intake, signs the request authorization, and then
          pays the $550 flat fee.
        </p>
      </HeroBackdrop>
      <section className="section">
        <div className="panel" style={{ marginTop: 28 }}>
          <span className="status warn">Stripe required</span>
          <h2 style={{ marginTop: 14 }}>Checkout is ready for credentials.</h2>
          <p>
            Add Stripe environment variables and a QDRO price ID to activate live
            checkout. Until then, the request flow runs in demo-safe mode.
          </p>
          <Link className="button primary" href="/qdro-request">
            Return to request
          </Link>
        </div>
      </section>
    </main>
  );
}
