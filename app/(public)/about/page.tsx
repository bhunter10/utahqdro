import { HeroBackdrop } from "@/components/HeroBackdrop";

export default function AboutPage() {
  return (
    <main className="page compact-hero-page">
      <HeroBackdrop
        variant="office"
        eyebrow="About UtahQDRO"
        title="Focused help for a narrow, important legal step."
      >
        <p>
          UtahQDRO helps individuals and attorneys navigate Qualified Domestic
          Relations Orders with clear communication, efficient drafting, and
          plan-specific attention.
        </p>
      </HeroBackdrop>
      <section className="section">
        <div className="grid two" style={{ marginTop: 28 }}>
          <article className="card">
            <h3>What we do</h3>
            <p>
              We prepare QDROs, route them for review and signatures, submit
              them through the court process, and send certified copies to plan
              administrators for processing.
            </p>
          </article>
          <article className="card">
            <h3>Why clients use us</h3>
            <p>
              QDROs are technical documents. We make the process easier to
              understand while keeping the drafting work accurate, complete, and
              ready for plan review.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
