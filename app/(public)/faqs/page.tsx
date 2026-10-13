import Link from "next/link";
import { faqs } from "@/lib/content";

export default function FaqPage() {
  return (
    <main className="page faq-page">
      <section className="section faq-intro">
        <div className="faq-intro-copy">
          <div className="eyebrow">Frequently asked questions</div>
          <h1>Answers before you begin.</h1>
          <p>
            Get clear on the QDRO process, timing, cost, and what information
            is needed before you start the online request.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/qdro-request">
              Start Your QDRO
            </Link>
            <Link className="button secondary" href="/contact">
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      <section className="section faq-content" aria-label="QDRO questions and answers">
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
