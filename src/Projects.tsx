import { Suspense, useEffect, useMemo, useState } from "react";
import { publicAsset } from "./assetPath";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box, Maximize2, Minimize2, X } from "lucide-react";
import type { Color, Material, Object3D } from "three";

const imageBase = publicAsset("/page-assets/projects/");
const legacyImageBase = publicAsset("/projects/");
const handleModelSrc = publicAsset("/models/Handle.glb");

type TunableMaterial = Material & {
  color?: Color;
  envMapIntensity?: number;
  metalness?: number;
  roughness?: number;
};

type MeshLikeObject = Object3D & {
  isMesh?: boolean;
  material?: Material | Material[];
};

function projectImage(name: string) {
  return `${imageBase}${name}`;
}

function legacyProjectImage(name: string) {
  return `${legacyImageBase}${name}`;
}

function tuneHandleMaterial(material: Material) {
  const tunedMaterial = material.clone() as TunableMaterial;

  if (tunedMaterial.color) {
    const hsl = { h: 0, s: 0, l: 0 };
    tunedMaterial.color.getHSL(hsl);
    tunedMaterial.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.08), Math.max(0, Math.min(0.58, hsl.l * 0.82)));
  }

  if (typeof tunedMaterial.roughness === "number") {
    tunedMaterial.roughness = Math.max(0.45, tunedMaterial.roughness * 0.92);
  }

  if (typeof tunedMaterial.metalness === "number") {
    tunedMaterial.metalness = Math.min(tunedMaterial.metalness, 0.08);
  }

  if (typeof tunedMaterial.envMapIntensity === "number") {
    tunedMaterial.envMapIntensity = 0.5;
  }

  tunedMaterial.needsUpdate = true;
  return tunedMaterial;
}

function HandleModel() {
  const { scene } = useGLTF(handleModelSrc);
  const tunedScene = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((object) => {
      const mesh = object as MeshLikeObject;
      if (!mesh.isMesh || !mesh.material) return;

      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(tuneHandleMaterial)
        : tuneHandleMaterial(mesh.material);
    });

    return clonedScene;
  }, [scene]);

  return <primitive object={tunedScene} />;
}

function HandleModelViewer() {
  return (
    <div className="glb-viewer project-handle-viewer" aria-label="Water bottle handle GLB viewer">
      <Canvas flat camera={{ position: [4.2, 2.8, 4.8], fov: 38 }} dpr={[1, 2]}>
        <color attach="background" args={["#f2e8d9"]} />
        <ambientLight intensity={0.3} />
        <hemisphereLight args={["#fff8ef", "#b89a78", 0.48]} />
        <directionalLight position={[4, 5, 4]} intensity={1.1} />
        <directionalLight position={[-3, 2, -4]} intensity={0.22} color="#dfeaff" />
        <Suspense
          fallback={
            <Html center>
              <div className="glb-loading">Loading model...</div>
            </Html>
          }
        >
          <Bounds fit clip observe margin={1.2}>
            <HandleModel />
          </Bounds>
          <Environment preset="studio" environmentIntensity={0.28} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}

function HandleModelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsFullscreen(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="media-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`media-modal is-model-modal ${isFullscreen ? "is-fullscreen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Water bottle handle model"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="media-modal-toolbar">
          <h3>Water Bottle Handle Model</h3>
          <div className="media-modal-actions">
            <span className="model-view-toggle project-model-label">GLB Viewer</span>
            <button type="button" onClick={() => setIsFullscreen((value) => !value)} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            </button>
            <button type="button" onClick={onClose} aria-label="Close popup">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="media-modal-body">
          <HandleModelViewer />
        </div>
      </div>
    </div>
  );
}

function ProjectImage({
  alt,
  className = "",
  imageClassName,
  src,
}: {
  alt: string;
  className?: string;
  imageClassName: string;
  src: string;
}) {
  return (
    <div className={className}>
      <img className={imageClassName} src={src} alt={alt} loading="lazy" />
    </div>
  );
}

function FramedImage({
  alt,
  className = "",
  src,
}: {
  alt: string;
  className?: string;
  src: string;
}) {
  return (
    <ProjectImage
      alt={alt}
      className={`project-framed-shell ${className}`}
      imageClassName="project-framed-image"
      src={src}
    />
  );
}

function ProjectCardImage({
  alt,
  className = "",
  src,
}: {
  alt: string;
  className?: string;
  src: string;
}) {
  return (
    <ProjectImage
      alt={alt}
      className={`project-card-shell ${className}`}
      imageClassName="project-card-image"
      src={src}
    />
  );
}

function RealProjects() {
  const [isHandleModelOpen, setIsHandleModelOpen] = useState(false);

  return (
    <>
      <section id="projects" className="projects-page" aria-label="Projects">
        <article className="project-section design-challenge-section">
          <h1 className="project-page-title">2024 &amp; 2025 Design Challenge [DC]</h1>
          <div className="project-text-pill">
            DC is a school-based event that gives students the freedom to impose their own innovation question and
            design their own innovation project.
          </div>

          <div className="dc-caption-row" aria-hidden="true">
            <span>My 2024 team!</span>
            <span>2024</span>
            <span>2025</span>
          </div>

          <div className="dc-photo-grid">
            <FramedImage
              src={projectImage("dc-2024-team.png")}
              alt="2024 Design Challenge team working with LEGO pieces"
            />
            <FramedImage
              src={projectImage("dc-2024-group.png")}
              alt="2024 Design Challenge group photo"
            />
            <FramedImage
              src={projectImage("dc-2025-group.png")}
              alt="2025 Design Challenge group photo"
            />
          </div>

          <div className="dc-card-stack">
            <ProjectCardImage
              className="wide-reference-card"
              src={projectImage("dc-problem-card.png")}
              alt="2024 Design Challenge problem statement card"
            />
            <ProjectCardImage
              className="wide-reference-card"
              src={projectImage("dc-solution-card.png")}
              alt="2024 Design Challenge solution card"
            />
            <ProjectCardImage
              className="wide-reference-card"
              src={projectImage("dc-feedback-card.png")}
              alt="Design Challenge feedback card"
            />
          </div>
        </article>

        <article className="project-section evo-section">
          <div className="project-title-with-icon">
            <img src={legacyProjectImage("2025-evo-beta-tester-icon.png")} alt="" aria-hidden="true" />
            <h2>2025 EVO Beta Tester</h2>
          </div>

          <div className="project-text-card">
            During the WRO 2025 season, my robotics coach organisation was developing a custom microcontroller named
            EVO. A few of us had the chance to serve as beta testers, and I am grateful for the opportunity. Our efforts
            as Team EVO demonstrated EVO's capabilities on the national and international stage, resulted in a product
            that many competitors expressed interest in purchasing.
          </div>

          <ProjectImage
            alt="Some of my EVO beta tester contributions"
            className="evo-contribution-reference-card"
            imageClassName="project-plain-image"
            src={projectImage("evo-contributions-card.png")}
          />

          <div className="evo-proof-grid">
            <figure>
              <FramedImage
                src={projectImage("evo-team-photo.png")}
                alt="Team EVO group photo"
              />
              <figcaption>Team EVO - Admiralty, Temasek Sec and some seniors</figcaption>
            </figure>
            <FramedImage
              src={projectImage("evo-certificate.png")}
              alt="EVO beta tester certificate"
            />
          </div>
        </article>

        <article className="project-section personal-project-section">
          <h2>2026 Personal Project</h2>
          <div className="project-text-card">
            I fixed my friend's water bottle handle by reverse-engineering the original design using Fusion 360. I then
            created my own attachment mechanism and 3D-printed it in PETG for its impermeability and durability.
          </div>

          <div className="personal-project-grid">
            <ProjectCardImage
              className="personal-card analysed-card"
              src={projectImage("personal-analysed-card.png")}
              alt="Analysis of different print orientations"
            />
            <ProjectCardImage
              className="personal-card utilised-card"
              src={projectImage("personal-utilised-card.png")}
              alt="Interlocking geometry made from the existing dent"
            />
            <ProjectCardImage
              className="personal-card designed-card"
              src={projectImage("personal-designed-card.png")}
              alt="Internal pinhole design in Fusion 360"
            />
            <ProjectCardImage
              className="personal-card final-product-card"
              src={projectImage("personal-final-product-card.png")}
              alt="Final water bottle handle product with annotations"
            />
            <ProjectCardImage
              className="personal-card printer-card"
              src={projectImage("personal-printer-card.png")}
              alt="Bambu P1S 3D printer"
            />
            <div className="handle-model-card">
              <ProjectCardImage
                className="personal-card handle-preview-card"
                src={projectImage("personal-handle-model-card.png")}
                alt="Water bottle handle model screenshot made in Fusion 360"
              />
              <button className="competition-action project-action" type="button" onClick={() => setIsHandleModelOpen(true)}>
                <Box aria-hidden="true" size={26} strokeWidth={1.8} />
                Click here to view 3D model!
              </button>
            </div>
          </div>
        </article>

        <article className="project-section hobby-section">
          <h2>2025-2026 Hobby</h2>
          <div className="project-text-card">
            In my spare time, I enjoy searching for CAD model drawings from SolidWorks, Autodesk Fusion, and other
            websites. After finding them, I attempt to recreate the model in Fusion 360 under the given time limit.
          </div>

          <div className="hobby-grid">
            <div className="hobby-left">
              <FramedImage
                className="hobby-library-image"
                src={projectImage("hobby-all-models.png")}
                alt="Fusion 360 practice model library"
              />
              <div className="project-text-card hobby-note">
                When the volume of my model matches the expected result, I turn to YouTube to learn how professionals
                model theirs. It helped me broaden my understanding of the tools and how to use them effectively.
              </div>
            </div>
            <figure className="hobby-right">
              <FramedImage
                className="hobby-cad-image"
                src={projectImage("hobby-solidworks-cad.png")}
                alt="Fusion 360 model recreated from a SolidWorks drawing"
              />
              <figcaption>
                This CAD drawing is by SolidWorks
                <br />
                Difficulty: Easy | Duration: 10 mins | Volume: 143801 mm<sup>3</sup>
              </figcaption>
            </figure>
          </div>
        </article>
      </section>

      <HandleModelModal isOpen={isHandleModelOpen} onClose={() => setIsHandleModelOpen(false)} />
    </>
  );
}

export default function Projects() {
  const [isHandleModelOpen, setIsHandleModelOpen] = useState(false);

  return (
    <>
      <section id="projects" className="reference-page projects-reference-page" aria-label="Projects">
        <div className="reference-sheet projects-reference-sheet">
          <img
            className="reference-sheet-image"
            src={publicAsset("/page-assets/projects/reference-no-buttons.png")}
            alt="Projects portfolio page"
            loading="eager"
            decoding="async"
          />
          <button
            className="reference-action-button projects-handle-model-hotspot"
            type="button"
            aria-label="View water bottle handle 3D model"
            onClick={() => setIsHandleModelOpen(true)}
          >
            <Box aria-hidden="true" />
            Click here to view 3D model!
          </button>
        </div>
      </section>

      <HandleModelModal isOpen={isHandleModelOpen} onClose={() => setIsHandleModelOpen(false)} />
    </>
  );
}

useGLTF.preload(handleModelSrc);
