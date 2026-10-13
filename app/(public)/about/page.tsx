import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="page about-page">
      <section className="section about-intro-section">
        <div className="about-profile">
          <div className="about-copy">
            <div className="eyebrow">About UtahQDRO</div>
            <h1>Fast, affordable QDRO help from start to finish.</h1>
            <p className="lead">
              We help individuals and attorneys navigate Qualified Domestic
              Relations Orders with clear communication, efficient service, and
              plan-specific attention.
            </p>
            <div className="about-stat-row" aria-label="UtahQDRO highlights">
              <div>
                <strong>25+</strong>
                <span>years drafting QDROs</span>
              </div>
              <div>
                <strong>Start to finish</strong>
                <span>court and plan handling</span>
              </div>
            </div>
            <p>
              At UtahQDRO.com, we specialize in helping individuals and
              attorneys navigate the complexities of Qualified Domestic
              Relations Orders. With extensive experience in drafting and
              processing QDROs, we work to make sure retirement assets are
              divided quickly, accurately, and in compliance with legal and
              plan-specific requirements.
            </p>
            <p>
              Our goal is to make the process easier for you. We offer clear
              communication, regular email updates, and efficient service every
              step of the way, creating a more seamless experience during an
              already stressful time.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/qdro-request">
                Start Your QDRO
              </Link>
              <Link className="button secondary" href="/contact">
                Contact Us
              </Link>
            </div>
          </div>

          <figure className="about-portrait">
            <img
              src="/cutout-orange-suit-tie.png"
              alt="UtahQDRO attorney"
            />
            <figcaption>
              <span>Fast, affordable, plan-specific QDRO preparation.</span>
            </figcaption>
          </figure>

          <div className="about-proof-list">
            {[
              "Drafted for the specific retirement plan involved",
              "Submitted through court for judge signature and certification",
              "Sent to the plan administrator so division can move forward",
              "Clear email updates throughout the process"
            ].map((item) => (
              <div className="mini-check" key={item}>
                <span className="icon">✓</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-detail-section">
        <div className="about-note">
          <div className="eyebrow">Built for a clean handoff</div>
          <h2>Clear drafting, court-ready orders, and fewer loose ends.</h2>
          <p>
            We handle the technical drafting and process details so clients and
            attorneys can move from divorce decree to retirement-plan division
            with less confusion.
          </p>
        </div>
        <div className="grid three">
          <article className="card compact-card">
            <div className="icon">✓</div>
            <h3>Drafting</h3>
            <p>
              We prepare the QDRO based on the divorce terms and the retirement
              plan involved.
            </p>
          </article>
          <article className="card compact-card">
            <div className="icon">✓</div>
            <h3>Court submission</h3>
            <p>
              We route the order for approval and submit it to the court for
              judge signature and certification.
            </p>
          </article>
          <article className="card compact-card">
            <div className="icon">✓</div>
            <h3>Plan processing</h3>
            <p>
              We send certified copies to the plan administrator so the division
              can move forward.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
