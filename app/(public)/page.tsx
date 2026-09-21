import Link from "next/link";

const steps = [
  ["1", "Provide basic information", "Upload your decree, retirement statement, and the case details needed to prepare the order."],
  ["2", "Review your intake", "Your answers are checked for missing items before the admin reviews the generated documents."],
  ["3", "Sign and pay", "Sign the request on the page and pay the flat fee online."],
  ["4", "Track the process", "Follow court and plan-administrator status updates from your client portal."]
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">Utah QDRO preparation</div>
          <h1>Need a QDRO? We’ll handle the details.</h1>
          <p className="lead">
            If your attorney or divorce decree says you need a QDRO, this guided
            portal helps you provide the right information, sign electronically,
            pay securely, and track each step.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/qdro-request">
              Start Your QDRO
            </Link>
            <Link className="button secondary" href="/faqs">
              Read FAQs
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <span className="status info">Flat fee: $550 per QDRO</span>
          <h2 style={{ marginTop: 18 }}>A clearer path from intake to filing</h2>
          <div className="checklist">
            {[
              "Guided questions with save and resume",
              "Secure uploads for decree and account statements",
              "Admin document preview before final processing",
              "Status updates visible to clients"
            ].map((item) => (
              <div className="mini-check" key={item}>
                <span className="icon">✓</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">How it works</div>
            <h2>Simple for clients, structured for accurate drafting.</h2>
          </div>
          <p>
            The new request flow keeps the legal logic behind the scenes while
            giving clients clear steps, plain-language help, and safe ways to say
            “I don’t know.”
          </p>
        </div>
        <div className="grid four grid three">
          {steps.map(([number, title, body]) => (
            <article className="card" key={title}>
              <div className="step-number">{number}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div>
            <div className="eyebrow" style={{ color: "#8ee0d6" }}>
              Why accuracy matters
            </div>
            <h2>A rejected QDRO can delay division for months.</h2>
          </div>
          <p>
            QDROs must match court terms and plan requirements. The portal is
            designed to reduce incomplete answers, missing uploads, and avoidable
            back-and-forth before drafting begins.
          </p>
        </div>
      </section>
    </main>
  );
}
