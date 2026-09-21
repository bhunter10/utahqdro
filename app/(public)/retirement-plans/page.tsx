const plans = [
  "401(k), 457, and profit-sharing plans",
  "Pension and defined benefit plans",
  "Utah Retirement Systems (URS)",
  "Thrift Savings Plan (TSP)",
  "DMBA, IHC, Fidelity, Empower, Principal, and other plan families",
  "Plan-specific addendums when required"
];

export default function RetirementPlansPage() {
  return (
    <main className="page">
      <section className="section">
        <div className="eyebrow">Retirement plans</div>
        <h1>Plan-specific questions, templates, and review.</h1>
        <p className="lead">
          QDRO language often depends on the retirement plan. The new intake
          asks only the questions needed for the selected plan family and flags
          uncertain answers for review.
        </p>
        <div className="grid three" style={{ marginTop: 28 }}>
          {plans.map((plan) => (
            <article className="card" key={plan}>
              <span className="icon">✓</span>
              <h3 style={{ marginTop: 14 }}>{plan}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
