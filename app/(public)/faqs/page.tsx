import Link from "next/link";
import { faqs } from "@/lib/content";

export default function FaqPage() {
  const faqColumns = [
    faqs.filter((_, index) => index % 2 === 0),
    faqs.filter((_, index) => index % 2 === 1)
  ];

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
          {faqColumns.map((column, columnIndex) => (
            <div className="faq-column" key={`faq-column-${columnIndex}`}>
              {column.map((faq) => {
                const originalIndex = faqs.findIndex((item) => item.q === faq.q);

                return (
                  <details key={faq.q} style={{ order: originalIndex }}>
                    <summary>{faq.q}</summary>
                    <p>{faq.a}</p>
                  </details>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
