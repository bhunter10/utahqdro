import Link from "next/link";

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
    <main className="page home-page">
      <section className="section home-hero">
        <div className="home-hero-copy">
          <div className="eyebrow">Utah QDRO preparation</div>
          <h1>Need a QDRO?</h1>
          <h2>We can handle the details.</h2>
          <p className="lead">
            If your attorney or divorce decree says you need a QDRO, you’re in
            the right place. We prepare accurate, court-ready orders designed to
            avoid mistakes, delays, and unnecessary hassle for a flat fee of
            $550. You can start online 24/7 here.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/qdro-request">
              Start Your QDRO
            </Link>
            <Link className="button secondary" href="/faqs">
              Read FAQs
            </Link>
          </div>
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
        </div>

        <div className="home-hero-visual home-utah-hero" aria-label="Utah QDRO process preview">
          <div className="home-utah-outline" aria-hidden="true">
            <svg viewBox="0 0 360 460" role="img">
              <defs>
                <linearGradient id="utahMapFill" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#edf6f5" />
                  <stop offset="100%" stopColor="#e8f0f8" />
                </linearGradient>
              </defs>
              <path d="M54 42H254V130H330V418H48Z" />
            </svg>
            <span className="home-map-marker home-map-marker-logan">
              <span className="home-map-dot" />
              <span>Logan</span>
            </span>
            <span className="home-map-marker home-map-marker-ogden">
              <span className="home-map-dot" />
              <span>Ogden</span>
            </span>
            <span className="home-map-marker home-map-marker-slc">
              <span className="home-map-dot" />
              <span>Salt Lake City</span>
            </span>
            <span className="home-map-marker home-map-marker-park-city">
              <span className="home-map-dot" />
              <span>Park City</span>
            </span>
            <span className="home-map-marker home-map-marker-provo">
              <span className="home-map-dot" />
              <span>Provo</span>
            </span>
            <span className="home-map-marker home-map-marker-price">
              <span className="home-map-dot" />
              <span>Price</span>
            </span>
            <span className="home-map-marker home-map-marker-moab">
              <span className="home-map-dot" />
              <span>Moab</span>
            </span>
            <span className="home-map-marker home-map-marker-richfield">
              <span className="home-map-dot" />
              <span>Richfield</span>
            </span>
            <span className="home-map-marker home-map-marker-cedar-city">
              <span className="home-map-dot" />
              <span>Cedar City</span>
            </span>
            <span className="home-map-marker home-map-marker-st-george">
              <span className="home-map-dot" />
              <span>St. George</span>
            </span>
            <div className="home-map-banner">
              <span className="home-map-banner-check">✓</span>
              <span>Serving all of&nbsp;Utah</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-process-section">
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

      <section className="band home-band">
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
