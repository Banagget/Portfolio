import { publicAsset } from "./assetPath";

type StaticPageKey = "clce" | "leaps" | "skills";

const staticPages: Record<
  StaticPageKey,
  {
    alt: string;
    className: string;
    src: string;
  }
> = {
  clce: {
    alt: "Contributions, Leadership and Community Engagements portfolio page",
    className: "clce-reference-page",
    src: publicAsset("/page-assets/clce/reference-no-buttons.png"),
  },
  leaps: {
    alt: "LEAPS portfolio page",
    className: "leaps-reference-page",
    src: publicAsset("/page-assets/leaps/reference.png"),
  },
  skills: {
    alt: "Skills and Development portfolio page",
    className: "skills-reference-page",
    src: publicAsset("/page-assets/skills/reference.png"),
  },
};

export function StaticReferencePage({ page }: { page: StaticPageKey }) {
  const details = staticPages[page];

  return (
    <section className={`reference-page static-reference-page ${details.className}`} aria-label={details.alt}>
      <div className="reference-sheet">
        <img className="reference-sheet-image" src={details.src} alt={details.alt} loading="eager" decoding="async" />
      </div>
    </section>
  );
}

export function TestimonialPage() {
  const testimonialSrc = publicAsset("/documents/Lin Zhiyuan Testimonial EAE.pdf");

  return (
    <section className="testimonial-page testimonial-reference-page" aria-label="Testimonial">
      <div className="reference-sheet testimonial-reference-sheet">
        <img
          className="reference-sheet-image"
          src={publicAsset("/page-assets/testimonial/reference-no-buttons.png")}
          alt="Testimonial heading written by my Robotics CCA Coach"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="testimonial-frame">
        <div className="testimonial-toolbar">
          <h2>Coach Testimonial PDF</h2>
          <div className="testimonial-actions">
            <a className="competition-action" href={testimonialSrc} download>
              Download
            </a>
            <a className="competition-action" href={testimonialSrc} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
          </div>
        </div>
        <iframe title="Lin Zhiyuan Testimonial EAE" src={`${testimonialSrc}#view=FitH`} />
      </div>
    </section>
  );
}
