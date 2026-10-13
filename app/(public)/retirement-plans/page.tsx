const planLogos = [
  { name: "Utah Retirement Systems", file: "urs.png" },
  { name: "DMBA", file: "dmba.png" },
  { name: "Federal Employees Retirement System", file: "fers.png" },
  { name: "Thrift Savings Plan", file: "thrift-savings-plan.png" },
  { name: "PCS Retirement", file: "pcs-retirement.png" },
  { name: "Empower", file: "empower.png" },
  { name: "Fidelity", file: "fidelity.png" },
  { name: "Charles Schwab", file: "charles-schwab.png" },
  { name: "Principal", file: "principal.png" },
  { name: "T. Rowe Price", file: "trowe.png" },
  { name: "Merrill Lynch", file: "merrill-lynch.png" },
  { name: "Milliman", file: "milliman.png" },
  { name: "Betterment", file: "betterment.png" },
  { name: "Prudential", file: "prudential.png" },
  { name: "TIAA", file: "tiaa.png" },
  { name: "Vanguard", file: "vanguard.png" },
  { name: "LPL Financial", file: "lpl.png" },
  { name: "MassMutual", file: "mass-mutual.png" },
  { name: "John Hancock", file: "john-hancock.png" },
  { name: "Northwestern Mutual", file: "northwestern.png" },
  { name: "Walmart", file: "walmart.png" },
  { name: "Kroger", file: "kroger.png" }
];

export default function RetirementPlansPage() {
  return (
    <main className="page retirement-plans-page">
      <section className="section retirement-plans-intro">
        <div className="section-head">
          <div>
            <div className="eyebrow">Retirement plans</div>
            <h2>Representative Plan Administrators we have worked with</h2>
          </div>
          <p>
            QDRO language often depends on the retirement plan. We prepare
            plan-specific orders and help route them for review, approval, and
            processing.
          </p>
        </div>

        <section className="plan-logo-section">
          <div className="logo-grid">
            {planLogos.map((logo) => (
              <article className="logo-card" key={logo.name}>
                <div className="logo-frame">
                  <img
                    src={`/plan-logos/${logo.file}`}
                    alt={`${logo.name} logo`}
                    loading="lazy"
                  />
                </div>
                <h3>{logo.name}</h3>
              </article>
            ))}
            <div className="many-others-inline">And many others.</div>
          </div>
        </section>
      </section>
    </main>
  );
}
