export default function AboutPage() {
  return (
    <main className="page">
      <section className="section">
        <div className="eyebrow">About UtahQDRO</div>
        <h1>Focused help for a narrow, important legal step.</h1>
        <p className="lead">
          UtahQDRO helps individuals and attorneys navigate Qualified Domestic
          Relations Orders with clear communication, efficient drafting, and
          plan-specific attention.
        </p>
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
