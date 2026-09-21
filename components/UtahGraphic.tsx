import Image from "next/image";

const graphics = {
  hero: {
    src: "/graphics/utah-hero.png",
    alt: "Peaceful Utah valley and Wasatch mountains at sunrise"
  },
  office: {
    src: "/graphics/utah-office.png",
    alt: "Calm Utah office workspace with mountain view"
  },
  redrock: {
    src: "/graphics/utah-redrock-path.png",
    alt: "Peaceful Utah red rock path with distant mountains"
  },
  intake: {
    src: "/graphics/utah-intake.png",
    alt: "Organized digital intake workspace with Utah landscape"
  }
};

export function UtahGraphic({
  variant,
  priority = false
}: {
  variant: keyof typeof graphics;
  priority?: boolean;
}) {
  const graphic = graphics[variant];

  return (
    <div className="graphic-panel">
      <Image
        src={graphic.src}
        alt={graphic.alt}
        fill
        priority={priority}
        sizes="(max-width: 900px) 100vw, 48vw"
        className="graphic-image"
      />
    </div>
  );
}
