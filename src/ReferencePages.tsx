import { useEffect, useState } from "react";
import { Download, ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import { publicAsset } from "./assetPath";
import { ReferenceImageStack } from "./ReferenceImageStack";

type StaticPageKey = "clce" | "leaps" | "skills";

const clceReferenceTiles = Array.from({ length: 5 }, (_, index) => ({
  src: publicAsset(`/page-assets/clce/tiles/reference-${String(index + 1).padStart(2, "0")}.webp`),
  width: 1708,
  height: index === 4 ? 926 : 2048,
}));

const staticPages: Record<
  StaticPageKey,
  {
    alt: string;
    certificate?: {
      alt: string;
      src: string;
    };
    className: string;
    sheetClassName?: string;
    src: string;
    tiles?: typeof clceReferenceTiles;
  }
> = {
  clce: {
    alt: "Contributions, Leadership and Community Engagements portfolio page",
    certificate: {
      alt: "2026 Values-In-Action certificate",
      src: publicAsset("/page-assets/clce/2026VIACOF.jpg"),
    },
    className: "clce-reference-page",
    sheetClassName: "clce-reference-sheet",
    src: publicAsset("/page-assets/clce/reference-no-buttons.png"),
    tiles: clceReferenceTiles,
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

function CertificatePopup({
  alt,
  onClose,
  src,
}: {
  alt: string;
  onClose: () => void;
  src: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="media-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`media-modal is-image-modal ${isFullscreen ? "is-fullscreen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="via-certificate-popup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="media-modal-toolbar">
          <h3 id="via-certificate-popup-title">2026 Values-In-Action Certificate</h3>
          <div className="media-modal-actions">
            <button
              type="button"
              onClick={() => setIsFullscreen((value) => !value)}
              aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={22} aria-hidden="true" /> : <Maximize2 size={22} aria-hidden="true" />}
            </button>
            <button type="button" onClick={onClose} aria-label="Close certificate popup" autoFocus>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="media-modal-body">
          <img src={src} alt={alt} />
        </div>
      </div>
    </div>
  );
}

export function StaticReferencePage({ page }: { page: StaticPageKey }) {
  const details = staticPages[page];
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  return (
    <>
      <section className={`reference-page static-reference-page ${details.className}`} aria-label={details.alt}>
        <div className={`reference-sheet ${details.sheetClassName ?? ""}`}>
          {details.tiles ? (
            <ReferenceImageStack alt={details.alt} tiles={details.tiles} />
          ) : (
            <img className="reference-sheet-image" src={details.src} alt={details.alt} loading="eager" decoding="async" />
          )}
          {details.certificate ? (
            <button
              className="reference-action-button clce-2026-via-certificate-hotspot"
              type="button"
              onClick={() => setIsCertificateOpen(true)}
              aria-label={`View ${details.certificate.alt}`}
            >
              <ExternalLink aria-hidden="true" />
              Click here to view certificate
            </button>
          ) : null}
        </div>
      </section>
      {isCertificateOpen && details.certificate ? (
        <CertificatePopup
          alt={details.certificate.alt}
          src={details.certificate.src}
          onClose={() => setIsCertificateOpen(false)}
        />
      ) : null}
    </>
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
        <iframe title="Lin Zhiyuan Testimonial EAE" src={`${testimonialSrc}#view=FitH`} />
        <div className="testimonial-footer">
          <a className="competition-action" href={testimonialSrc} download>
            <Download size={20} aria-hidden="true" />
            Download
          </a>
        </div>
      </div>
    </section>
  );
}
