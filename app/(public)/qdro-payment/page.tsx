import Link from "next/link";
import { UtahGraphic } from "@/components/UtahGraphic";

export default function PaymentPage() {
  return (
    <main className="page">
      <section className="section">
        <div className="intro-grid">
          <div>
            <div className="eyebrow">Payment</div>
            <h1>Pay securely after your request is ready.</h1>
            <p className="lead">
              In the rebuilt site, payment is integrated into the request flow so
              the client reviews the intake, signs the request authorization,
              and then pays the $550 flat fee.
            </p>
          </div>
          <UtahGraphic variant="intake" />
        </div>
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
