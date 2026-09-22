import Link from "next/link";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { faqs } from "@/lib/content";

export default function FaqPage() {
  return (
    <main className="page compact-hero-page">
      <HeroBackdrop
        variant="redrock"
        eyebrow="Frequently asked questions"
        title="Answers before you begin."
        actions={
          <Link className="button primary" href="/qdro-request">
            Start Your QDRO
          </Link>
        }
      >
        <p>
          If you already know you need a QDRO, you can begin online now. The
          portal will guide you through the information and documents needed.
        </p>
      </HeroBackdrop>
      <section className="section">
        <div className="faq-list" style={{ marginTop: 28 }}>
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
