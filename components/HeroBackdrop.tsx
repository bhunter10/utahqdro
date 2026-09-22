import type { ReactNode } from "react";

const graphics = {
  hero: {
    src: "/graphics/utah-hero.png"
  },
  office: {
    src: "/graphics/utah-office.png"
  },
  redrock: {
    src: "/graphics/utah-redrock-path.png"
  },
  intake: {
    src: "/graphics/utah-intake.png"
  }
};

export function HeroBackdrop({
  variant,
  eyebrow,
  title,
  children,
  actions
}: {
  variant: keyof typeof graphics;
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className="hero-backdrop"
      style={{ backgroundImage: `linear-gradient(90deg, rgba(12, 24, 38, 0.78), rgba(12, 24, 38, 0.43), rgba(12, 24, 38, 0.12)), url(${graphics[variant].src})` }}
    >
      <div className="hero-backdrop-inner">
        <div className="hero-backdrop-copy">
          <div className="eyebrow hero-eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <div className="hero-backdrop-lead">{children}</div>
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
