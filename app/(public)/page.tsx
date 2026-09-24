import Link from "next/link";
import { HeroBackdrop } from "@/components/HeroBackdrop";

const steps = [
  [
    "1",
    "Provide Basic Information",
    "You upload your decree, your retirement statement, and a few details about your case and yourselves. You can make your payment online too. Simple, clear, and designed to get it done right the first time."
  ],
  [
    "2",
    "QDRO Drafting",
    "We prepare your QDRO based on your specific plan and divorce terms. Don’t worry, after our attorney reviews it, you can review it before we send to court."
  ],
  [
    "3",
    "Review, Approval, and Signatures",
    "After both parties approve the QDRO, we will send it to the judge for you for signature and certification. Then we send the QDRO to the plan administrator."
  ],
  [
    "4",
    "Sent to Plan Admin for Division",
    "We handle the drafting process from start to finish so you can move forward without confusion or unnecessary back-and-forth."
  ]
];

export default function HomePage() {
  return (
    <main className="page">
      <HeroBackdrop
        variant="hero"
        eyebrow="Utah QDRO preparation"
        title="Need a QDRO? We’ll handle the details."
        actions={
          <>
            <Link className="button primary" href="/qdro-request">
              Start Your QDRO
            </Link>
            <Link className="button secondary" href="/faqs">
              Read FAQs
            </Link>
          </>
        }
      >
          <p className="lead">
            If your attorney or divorce decree says you need a QDRO, this guided
            portal helps you provide the right information, sign electronically,
            pay securely, and track each step.
          </p>
          <div className="hero-points">
            {[
              "Quick turn around times",
              "Secure uploads",
              "We prepare based on your specific divorce terms",
              "We send it to the judge and plan administrator"
            ].map((item) => (
              <div className="hero-point" key={item}>
                <span className="icon">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
      </HeroBackdrop>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">How it works</div>
            <h2>From upload to plan division, we handle the process.</h2>
          </div>
          <p>
            You provide the basics. We draft, review, and move your QDRO through
            court and the plan administrator so you can keep things moving.
          </p>
        </div>
        <div className="grid two">
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
            We handle the details for you, from gathering the right information
            to preparing the order for court and plan review.
          </p>
        </div>
      </section>
    </main>
  );
}
