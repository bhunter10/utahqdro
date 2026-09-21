import { IntakeWizard } from "@/components/IntakeWizard";
import { UtahGraphic } from "@/components/UtahGraphic";

export default function QdroRequestPage() {
  return (
    <main className="page">
      <section className="section" style={{ paddingBottom: 18 }}>
        <div className="intro-grid">
          <div>
            <div className="eyebrow">Start your QDRO</div>
            <h1>Calm, guided intake from the first question.</h1>
            <p className="lead">
              The request flow breaks the QDRO process into clear steps and
              saves your progress as you go.
            </p>
          </div>
          <UtahGraphic variant="intake" priority />
        </div>
      </section>
      <IntakeWizard />
    </main>
  );
}
