import Link from "next/link";
import { UtahGraphic } from "@/components/UtahGraphic";
import { faqs } from "@/lib/content";

export default function FaqPage() {
  return (
    <main className="page">
      <section className="section">
        <div className="intro-grid">
          <div>
            <div className="eyebrow">Frequently asked questions</div>
            <h1>Answers before you begin.</h1>
            <p className="lead">
              If you already know you need a QDRO, you can begin online now. The
              portal will guide you through the information and documents needed.
            </p>
          </div>
          <UtahGraphic variant="redrock" />
        </div>
        <div className="faq-list" style={{ marginTop: 28 }}>
          {faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="hero-actions">
          <Link className="button primary" href="/qdro-request">
            Start Your QDRO
          </Link>
        </div>
      </section>
    </main>
  );
}
