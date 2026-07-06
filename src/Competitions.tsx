import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box, ExternalLink, Maximize2, Minimize2, PlayCircle, X } from "lucide-react";
import type { Color, Material, Object3D } from "three";

const imageBase = "/competitions/";
const videoBase = "/project-videos/";

const scubathonLumaSrc =
  "https://lumalabs.ai/embed/6741b8ca-8649-41c9-8dc2-73d3f3278f77?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false";
const wroRobotLumaSrc =
  "https://lumalabs.ai/embed/51b48e56-92dd-4923-b213-1d408d253b8a?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false";
const wroRobotGlbSrc = "/models/WRO2025_Robot.glb";

type ImageModalContent = {
  alt?: string;
  src: string;
  title: string;
  type: "image";
};

type VideoModalContent = {
  src: string;
  title: string;
  type: "video";
};

type ModelModalContent = {
  glbSrc?: string;
  lumaSrc: string;
  title: string;
  type: "model";
};

type ModalContent = ImageModalContent | VideoModalContent | ModelModalContent;

type FigureProps = {
  alt: string;
  caption?: string;
  className?: string;
  framed?: boolean;
  shadow?: boolean;
  src: string;
};

type ActionButtonProps = {
  children: ReactNode;
  icon?: "box" | "external" | "play";
  onClick?: () => void;
};

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

function tuneGlbMaterial(material: Material) {
  const tunedMaterial = material.clone() as TunableMaterial;

  if (tunedMaterial.color) {
    const color = tunedMaterial.color;
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);

    if (hsl.l > 0.72) {
      const lightness = hsl.s > 0.04 ? hsl.l * 0.84 : hsl.l * 0.76;
      const maxLightness = hsl.s > 0.04 ? 0.86 : 0.8;
      color.setHSL(hsl.h, Math.min(1, hsl.s * 1.18), Math.min(maxLightness, Math.max(0, lightness)));
    } else if (hsl.s > 0.04) {
      color.setHSL(hsl.h, Math.min(1, hsl.s * 1.22), Math.max(0, hsl.l * 0.94));
    } else {
      color.setHSL(hsl.h, hsl.s, Math.max(0, hsl.l * 0.92));
    }
  }

  if (typeof tunedMaterial.roughness === "number") {
    tunedMaterial.roughness = Math.max(0.38, tunedMaterial.roughness * 0.82);
  }

  if (typeof tunedMaterial.metalness === "number") {
    tunedMaterial.metalness = Math.min(tunedMaterial.metalness, 0.18);
  }

  if (typeof tunedMaterial.envMapIntensity === "number") {
    tunedMaterial.envMapIntensity = 0.72;
  }

  tunedMaterial.needsUpdate = true;
  return tunedMaterial;
}

function Figure({ alt, caption, className = "", framed = true, shadow = false, src }: FigureProps) {
  return (
    <figure className={`competition-figure ${shadow ? "shadow-figure" : ""} ${className}`}>
      <img className={framed ? "competition-image framed-image" : "competition-image"} src={src} alt={alt} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function CardImage({ alt, className = "", src }: { alt: string; className?: string; src: string }) {
  return (
    <figure className={`competition-card-image ${className}`}>
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}

function TextCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`competition-text-card ${className}`}>{children}</div>;
}

function ActionButton({ children, icon = "play", onClick }: ActionButtonProps) {
  const Icon = icon === "box" ? Box : icon === "external" ? ExternalLink : PlayCircle;

  return (
    <button className="competition-action" type="button" onClick={onClick}>
      <Icon aria-hidden="true" size={26} strokeWidth={1.8} />
      {children}
    </button>
  );
}

function GlbModel({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  const tunedScene = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((object) => {
      const mesh = object as MeshLikeObject;
      if (!mesh.isMesh || !mesh.material) return;

      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tuneGlbMaterial) : tuneGlbMaterial(mesh.material);
    });

    return clonedScene;
  }, [scene]);

  return <primitive object={tunedScene} />;
}

function GlbViewer({ src, title }: { src: string; title: string }) {
  return (
    <div className="glb-viewer" aria-label={`${title} GLB viewer`}>
      <Canvas flat camera={{ position: [4, 3, 5], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#f2e8d9"]} />
        <ambientLight intensity={0.24} />
        <hemisphereLight args={["#fff8ef", "#c29b70", 0.5]} />
        <directionalLight position={[4, 6, 5]} intensity={1.35} />
        <directionalLight position={[-4, 3, -5]} intensity={0.26} color="#dfeaff" />
        <Suspense
          fallback={
            <Html center>
              <div className="glb-loading">Loading model...</div>
            </Html>
          }
        >
          <Bounds fit clip observe margin={1.15}>
            <GlbModel src={src} />
          </Bounds>
          <Environment preset="studio" environmentIntensity={0.34} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}

function ModelViewer({ mode, model }: { mode: "luma" | "glb"; model: ModelModalContent }) {
  const activeGlbSrc = mode === "glb" ? model.glbSrc : undefined;

  return (
    <div className="model-viewer-shell">
      {activeGlbSrc ? (
        <GlbViewer src={activeGlbSrc} title={model.title} />
      ) : (
        <div className="luma-viewer-wrap">
          <iframe
            src={model.lumaSrc}
            title={`${model.title} Luma AI viewer`}
            allow="fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

function MediaModal({
  content,
  onClose,
}: {
  content: ModalContent | null;
  onClose: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelMode, setModelMode] = useState<"luma" | "glb">("luma");

  useEffect(() => {
    if (!content) return;

    setIsFullscreen(content.type === "video" || content.type === "model");
    setModelMode("luma");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [content, onClose]);

  if (!content) return null;

  const hasGlbViewer = content.type === "model" && Boolean(content.glbSrc);

  return (
    <div className="media-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`media-modal ${isFullscreen ? "is-fullscreen" : ""} ${content.type === "model" ? "is-model-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="media-modal-toolbar">
          <h3>{content.title}</h3>
          <div className="media-modal-actions">
            {hasGlbViewer ? (
              <button
                className="model-view-toggle"
                type="button"
                onClick={() => setModelMode((value) => (value === "luma" ? "glb" : "luma"))}
                aria-label={modelMode === "luma" ? "Switch to GLB viewer" : "Switch to Luma AI viewer"}
              >
                {modelMode === "luma" ? "GLB Viewer" : "Luma AI Viewer"}
              </button>
            ) : null}
            <button type="button" onClick={() => setIsFullscreen((value) => !value)} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            </button>
            <button type="button" onClick={onClose} aria-label="Close popup">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="media-modal-body">
          {content.type === "video" ? (
            <video src={content.src} controls autoPlay playsInline />
          ) : content.type === "model" ? (
            <ModelViewer mode={modelMode} model={content} />
          ) : (
            <img src={content.src} alt={content.alt ?? content.title} />
          )}
        </div>
      </div>
    </div>
  );
}

function MechanismVideo({ src, title }: { src: string; title: string }) {
  return (
    <figure className="mechanism-video-card">
      <video src={src} title={title} muted loop autoPlay playsInline preload="metadata" />
    </figure>
  );
}

function MechanismText({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="mechanism-text-card">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function RealCompetitions() {
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  const openVideo = (title: string, src: string) => setModalContent({ title, src, type: "video" });
  const openImage = (title: string, src: string, alt?: string) => setModalContent({ title, src, alt, type: "image" });
  const openModel = (title: string, lumaSrc: string, glbSrc?: string) => setModalContent({ title, lumaSrc, glbSrc, type: "model" });

  return (
    <>
      <section id="competitions" className="competitions-page" aria-label="Competitions">
        <article className="competition-entry nrc-entry">
          <div className="competition-main-grid">
            <div className="competition-copy-stack">
              <h2>2023 National Robotics Competition [NRC]</h2>
              <TextCard>
                <p>
                  Competed in the Regular Category as the team&apos;s main robot builder and assitant programmer. As the main 
                  builder, where I designed the robot&apos;s chassis using LEGO Technic beams and frames. Through continuous 
                  testing and redesign, I learned how to maximise structural rigidity while using the fewest possible parts. This taught me the importance of
                  efficient usage of parts, where thoughtful design could produce stronger and more reliable structures than
                  simply adding more parts. As the assistant programmer, I help my main programmer in troubleshooting and share robot movement route plans. 
                </p>
                <p>
                  This experience sparked a strong interest in robotics, particularly in building and programming. This
                  motivated me to dedicate more time after school and effort to upcoming competitions throughout my CCA journey.
                </p>
              </TextCard>
              <CardImage className="support-card nrc-support-card" src={`${imageBase}2024-nrc-spike-prime-card.png`} alt="LEGO Spike Prime software card" />
            </div>

            <Figure src={`${imageBase}nrc-group-photo.png`} alt="NRC team group photo" />
          </div>
        </article>

        <article className="competition-entry">
          <div className="competition-main-grid">
            <div className="competition-copy-stack">
              <h2>2024 First Lego League [FLL]</h2>
              <TextCard>
                <p>
                  I participated in the Challenge Category as my team&apos;s primary builder and assistant programmer. I was
                  responsible for designing the attachments while contributing to their programming and strategy. Through this
                  competition, I gained valuable experience in designing efficient gearboxes, such as prioritising speed or
                  torque, passive mechanisms such as rubber band triggers, and linkage systems, maximising the functionality
                  of the attachments with the limited motor output.
                </p>
                <p>
                  Beyond the technical aspects, I learned how to analyse missions strategically, balancing risk, reliability,
                  and efficiency to maximise the number of missions completed within a single robot run. The competition also
                  strengthened my teamwork and communication skills, as we had to manage tight deadlines and coordinate our
                  approach.
                </p>
                <p>
                  The Research Project was my first opportunity to tackle a real-world problem. It taught me that ideating
                  meaningful solutions is not simply about solving the obvious problem, but about understanding the bigger
                  picture, identifying the root cause, and thinking creatively to explore solutions from different perspectives.
                </p>
              </TextCard>
              <CardImage className="support-card fll-2024-support-card" src={`${imageBase}2024-fll-robot-base-card.png`} alt="2024 FLL EV3 robot base card" />
            </div>

            <div className="side-stack">
              <h3>My Team!</h3>
              <Figure src={`${imageBase}2024-fll-team-photo.png`} alt="2024 FLL team photo" />
              <Figure src={`${imageBase}2024-fll-certificate.png`} alt="2024 FLL certificate of participation" />
            </div>
          </div>
        </article>

        <article className="competition-entry research-entry">
          <h2>Research Project</h2>
          <div className="research-grid">
            <div>
              <TextCard>
                <h4>The Problem Statement:</h4>
                <p>How can you use technology and the arts to help engage others or increase participation in what you love to do?</p>
                <h4>Our Solution:</h4>
                <p>
                  To lower the barrier to entry for aspiring musicians, we developed an intuitive, open-source guitar app built
                  on MIT App Inventor. The software processes real-time user inputs, utilising precise touch-coordinate tracking
                  to display instant feedback on chord progression and finger placement. With easy-to-follow lessons on chords,
                  this app aims to make the learning experience enjoyable and stress-free.
                </p>
              </TextCard>

              <Figure src={`${imageBase}2024-fll-project-code.png`} alt="MIT App Inventor project code blocks" />
            </div>

            <Figure
              className="phone-figure"
              src={`${imageBase}2024-fll-guitar-app.png`}
              alt="Guitar learning app interface"
              framed={false}
              caption="The text displayed at the bottom indicates the keys being pressed and strummed by the user, along with the corresponding coordinates."
            />
          </div>
        </article>

        <article className="competition-entry">
          <div className="competition-main-grid">
            <div className="competition-copy-stack">
              <h2>2024 World Robot Olympiad [WRO]</h2>
              <TextCard>
                <p>
                  Competing in the RoboMission Junior Category, I learned to develop a program using light sensors to detect
                  colours and make an algorithm that enabled the robot to collect and sort coloured elements into their
                  designated locations.
                </p>
                <p>
                  I also explored and understood how PID control for angle and position can improve the accuracy of
                  line-tracking. In addition, building the robot taught me the importance of the centre of mass in ensuring
                  movement stability and consistency, which led me to prioritise structural design and minimise unnecessary
                  components rather than adding parts indiscriminately.
                </p>
                <p>
                  Furthermore, I learned more mechanical solutions to optimise motor usage, such as using a single motor with a
                  lever mechanism to independently control left and right grabbers, allowing multiple outputs from one motor.
                </p>
                <p>Reflecting on repeated changes to strategy, unfortunately, we were unable to participate due to an unforeseen travel disruption.</p>
              </TextCard>
              <CardImage className="wro-before-after-card" src={`${imageBase}2024-wro-before-after-card.png`} alt="2024 WRO before and after robot revamp card" />
              <CardImage className="support-card wro-2024-support-card" src={`${imageBase}2024-wro-ev3-card.png`} alt="2024 WRO EV3 software card" />
            </div>

            <div className="side-stack">
              <h3>My Team!</h3>
              <Figure src={`${imageBase}2024-wro-team-photo.png`} alt="2024 WRO team photo" />
              <Figure src={`${imageBase}2024-wro-robot.png`} alt="2024 WRO robot displayed at CCA open house" caption="Our robot used for display at our CCA open house!" />
            </div>
          </div>

          <div className="award-grid">
            <div className="award-card">
              <h3>Runner Up</h3>
              <Figure src={`${imageBase}2024-wro-runner-up.png`} alt="WRO Runner Up announcement" />
              <img className="medal-overlay medal-left" src={`${imageBase}runner-up-medal.png`} alt="Runner Up medal" loading="lazy" />
              <ActionButton onClick={() => openVideo("2024 WRO Robot Run", `${videoBase}WRO2024_RobotRun.mp4`)}>
                Click here to watch our robot run!
              </ActionButton>
            </div>
            <div className="award-card">
              <h3>Exploration Award</h3>
              <Figure
                src={`${imageBase}2024-wro-exploration-award.png`}
                alt="WRO Exploration Award announcement"
                caption="50Q 4 or Side Quest 4 requires using the robot to complete a few missions in the shortest amount of time possible."
              />
              <img className="medal-overlay medal-right" src={`${imageBase}exploration-award-medal.png`} alt="Exploration Award medal" loading="lazy" />
              <ActionButton onClick={() => openVideo("2024 WRO Side Quest 4", `${videoBase}WRO2024_SQ4.mov`)}>
                Click here to watch SQ4!
              </ActionButton>
            </div>
          </div>
        </article>

        <article className="competition-entry">
          <div className="competition-main-grid fll-2025-main-grid">
            <div className="competition-copy-stack">
              <h2>2025 First Lego League [FLL]</h2>
              <TextCard>
                <p>Achieved a total score of 585/620 points.</p>
                <p>
                  As a team, we made school history by migrating our block-based code architecture to Pybricks (Python). My
                  teammates and I independently learned Python and the Pybricks framework, then developed a foundational
                  codebase from scratch, recreating core functions such as line-tracking and motor movements.
                </p>
                <p>
                  Our team highlighted the advantages of Pybricks to my coach, such as its lightweight firmware and improved
                  control over movement execution, resulting in faster, more accurate, and more consistent robot performance.
                  As a result, the club adopted Pybricks as its standard platform, retiring the legacy EV3 microcontroller
                  framework.
                </p>
                <p>
                  The Research Project exposed me to higher-level programming in C++ with the raw microcontrollers, expanding
                  my knowledge beyond LEGO-based robotics. It also introduced me to the complete prototyping process, from
                  designing custom parts for 3D printing to assembling them into a functional prototype.
                </p>
                <p className="italic-note">Selected to represent Singapore in Houston, Texas; unfortunately, we were unable to participate due to logistical limitations.</p>
              </TextCard>
            </div>

            <div className="side-stack team-logo-stack fll-2025-side-stack">
              <h3>My Team!</h3>
              <Figure src={`${imageBase}2025-fll-team-photo.png`} alt="2025 FLL team photo" />
              <Figure className="logo-figure" src={`${imageBase}2025-fll-team-logo.png`} alt="Deep Fried Lobsters team logo" framed={false} />
              <CardImage className="support-card fll-2025-support-card" src={`${imageBase}2025-fll-robot-base-card.png`} alt="2025 FLL robot base card" />
            </div>
          </div>

          <div className="award-grid fll-awards">
            <div className="award-card">
              <h3>Overall Champion</h3>
              <Figure src={`${imageBase}2025-fll-overall-champion.png`} alt="2025 FLL Overall Champion award" />
              <ActionButton icon="external" onClick={() => openImage("Overall Champion Certificate", `${imageBase}2025-fll-overall-champion-certificate.png`, "Overall Champion certificate")}>
                Click here to view the certificate!
              </ActionButton>
            </div>
            <div className="award-card">
              <h3>Robot Performance Award</h3>
              <Figure src={`${imageBase}2025-fll-robot-performance-award.png`} alt="2025 FLL Robot Performance Award" />
              <ActionButton onClick={() => openVideo("2025 FLL Robot Run", `${videoBase}FLL2025_RobotRun.mp4`)}>Click here to watch our robot run!</ActionButton>
            </div>
          </div>
        </article>

        <article className="competition-entry research-entry">
          <h2>Research Project</h2>
          <div className="research-grid scubathon-research-grid">
            <div>
              <TextCard>
                <h4>Our Problem Statement:</h4>
                <p>How can divers easily monitor each other&apos;s status, manage gauges, and avoid collisions for safety?</p>
                <h4>Our Solution:</h4>
                <p>
                  Integrate Augmented Reality into a diver mask that overlays critical safety telemetry, such as oxygen depth
                  gauges and obstacle alerts, directly onto the diver&apos;s field of view.
                </p>
                <p>
                  Extra: Added artificial gills to provide oxygen by extracting from water through a chemical process, ensuring
                  divers have sufficient air in case of a punctured oxygen tank while returning to the surface.
                </p>
              </TextCard>
              <Figure className="tinkercad-figure" src={`${imageBase}2025-fll-tinkercad.png`} alt="TinkerCAD model of Scubathon" />
            </div>

            <div>
              <Figure
                className="scubathon-product-figure"
                src={`${imageBase}2025-fll-scubathon.png`}
                alt="Final Scubathon prototype"
                caption="Final product powered by a powerbank on a stand."
              />
              <ActionButton icon="box" onClick={() => openModel("Scubathon 3D Model", scubathonLumaSrc)}>Click here to view 3D model!</ActionButton>
            </div>
          </div>

          <h3 className="architecture-title">Scubathon Tech Stack</h3>
          <div className="scubathon-tech-grid">
            <CardImage src={`${imageBase}2025-fll-ar-simulation-card.png`} alt="Scubathon augmented reality simulation card" />
            <CardImage src={`${imageBase}2025-fll-obstacle-alert-card.png`} alt="Scubathon obstacle alert card" />
            <CardImage src={`${imageBase}2025-fll-voice-commands-card.png`} alt="Scubathon voice commands card" />
            <CardImage src={`${imageBase}2025-fll-main-controller-card.png`} alt="Scubathon main controller card" />
          </div>

          <div className="center-action">
            <ActionButton onClick={() => openVideo("Scubathon Demo", `${videoBase}Scubathon_Demo.mp4`)}>Click here to watch the demo!</ActionButton>
          </div>
        </article>

        <article className="competition-entry">
          <div className="competition-main-grid wro-2025-main-grid">
            <div className="competition-copy-stack">
              <h2>2025 World Robot Olympiad [WRO]</h2>
              <TextCard>
                <p>
                  Through this competition, I expanded my hardware knowledge by programming the EVO microcontroller (ESP32-S3
                  architecture). This exposed me to working with more electronic modules, such as the HuskyLens AI vision
                  sensor and the BNO055 inertial measurement unit (gyroscope).
                </p>
                <p>
                  In addition, I strengthened my CAD skills by designing custom sensor mounts and structural enhancements in
                  Tinkercad, enabling the hardware to be securely mounted while meeting the specific requirements of our robot
                  design.
                </p>
              </TextCard>
              <CardImage className="wro-evo-card" src={`${imageBase}2025-wro-evo-card.png`} alt="EVO microcontroller card" />
              <CardImage className="wro-my-robot-card" src={`${imageBase}2025-wro-my-robot-card.png`} alt="2025 WRO robot components card" />
            </div>

            <div className="side-stack team-logo-stack wro-2025-side-stack">
              <Figure src={`${imageBase}2025-wro-team-photo.png`} alt="2025 WRO team photo" />
              <Figure className="logo-figure wro-logo-figure" src={`${imageBase}2025-wro-astro-banagget-logo.png`} alt="Astro Banaggets team logo" framed={false} />
              <h3>My Team!</h3>
              <Figure src={`${imageBase}2025-wro-tinkercad.png`} alt="2025 WRO TinkerCAD robot design" />
            </div>
          </div>

          <div className="triple-award-grid">
            <div className="award-card">
              <h3>Preliminary - Gold</h3>
              <Figure src={`${imageBase}astro-banagget-nationals-gold-certificate.png`} alt="WRO Nationals Gold certificate" />
            </div>
            <div className="award-card award-card-no-title">
              <Figure src={`${imageBase}2025-wro-group-photo.png`} alt="2025 WRO group photo" />
            </div>
            <div className="award-card">
              <h3>Finals - Silver</h3>
              <Figure src={`${imageBase}astro-banagget-finals-silver-certificate.png`} alt="WRO Finals Silver certificate" />
            </div>
          </div>

          <div className="center-action">
            <ActionButton onClick={() => openVideo("2025 WRO Robot Run", `${videoBase}WRO2025_RobotRun.mp4`)}>Click here to watch our robot run!</ActionButton>
          </div>
        </article>

        <article className="competition-entry international-entry">
          <h2>2025 World Robot Olympiad [WRO] - International</h2>
          <div className="international-intro-grid">
            <TextCard>
              <p>
                Although a critical oversight during the National Finals cost my team an international qualification, the
                technical skills and mechanism design ability I had demonstrated throughout the season led Team Astro-Nuts to
                invite me to join them on the global stage. Competing at WRO International exposed me to a wide variety of
                robot designs, solutions, and game strategies from top teams around the world. Observing their innovative
                mechanisms and problem-solving techniques broadened my perspective on robotics and inspired me to continuously
                improve my own designs. This experience reinforced my determination to work harder to get every opportunity to
                represent Singapore on the international stage.
              </p>
            </TextCard>
            <Figure src={`${imageBase}2025-wro-international-singapore-flag.png`} alt="Team holding the Singapore flag at WRO International" />
          </div>

          <div className="international-photo-grid">
            <div className="international-left-stack">
              <Figure src={`${imageBase}2025-wro-international-robot.png`} alt="WRO International robot on the field" />
              <ActionButton icon="box" onClick={() => openModel("WRO International Robot", wroRobotLumaSrc, wroRobotGlbSrc)}>Click here to view 3D model!</ActionButton>
            </div>
            <Figure src={`${imageBase}2025-wro-international-robot-open-house.png`} alt="Robot displayed at CCA open house" caption="Our robot used for display at our CCA open house!" />
            <Figure src={`${imageBase}2025-wro-international-team-photo.png`} alt="WRO International team beside the robot field" />
          </div>

          <h3 className="international-title">Internationals - Silver</h3>
          <div className="international-award-grid">
            <Figure src={`${imageBase}2025-wro-international-silver-certificate.png`} alt="WRO International Silver certificate" />
            <Figure src={`${imageBase}2025-wro-international-ceremony.png`} alt="WRO International Silver Award ceremony" />
          </div>
          <Figure className="ranking-figure" src={`${imageBase}2025-wro-international-ranking.png`} alt="WRO International ranking row" />
          <p className="international-note">Represented Singapore internationally and ranked 35th place out of 112, the highest standing among all Singaporean competitors in our category.</p>
          <img className="international-charm" src={`${imageBase}2025-wro-international-astro-nut-charm.png`} alt="Astro-Nuts charm" loading="lazy" />
          <div className="center-action">
            <ActionButton onClick={() => openVideo("WRO International Robot Run", `${videoBase}WRO_International_RobotRun.mp4`)}>Click here to watch our robot run!</ActionButton>
          </div>
        </article>

        <article className="competition-entry robot-revamps-entry">
          <h2>Robot Revamps</h2>
          <TextCard>
            <p>
              WRO International introduces surprise missions on the day of the competition that can significantly change the
              game rules or add new elements to the playfield. Upon joining Team Astro-Nuts, my robot design was selected to
              be used for the international competition because of its performance consistency and better structural design.
            </p>
          </TextCard>
          <CardImage className="robot-revamp-card" src={`${imageBase}robot-revamp-card.png`} alt="Robot revamp before and after card" />

          <h3 className="mechanism-overview-title">Robot Mechanisms Overview</h3>
          <div className="mechanism-grid">
            <MechanismVideo src={`${videoBase}Grab and Lift.mp4`} title="Grab and lift mechanism video" />
            <MechanismText title="Grabber - Grab and Lift Mechanism">
              <ul>
                <li>The Motor drives 2 axles in the parallel linkage.</li>
                <li>The Grabber moves down as it requires less force than opening the Grabber, due to the tension of the Rubber Bands tied to the Grabber Hands.</li>
                <li>After the Grabber cannot go down anymore, it forces the Grabber Hands to open.</li>
                <li>When the motor reverses, it closes the Grabber Hands first as it requires less force compared to lifting due to weight.</li>
                <li>When it fully closes, the Motor is forced to lift the Grabber up.</li>
              </ul>
            </MechanismText>

            <MechanismText title="Grabber - Locking Mechanism">
              <ul>
                <li>Motor drives 2 axles in the parallel linkage.</li>
                <li>The grabber moves down to the desired height.</li>
                <li>A Beam pushes the Locking Arm forward and anchors the gear connected to the linkage, preventing it from going down.</li>
                <li>Because it cannot go down, the motor is forced to open the Grabber.</li>
                <li>The Locking Arm is pulled back to its position by a Rubber Band, unanchoring the Grabber.</li>
              </ul>
            </MechanismText>
            <MechanismVideo src={`${videoBase}Locking.mp4`} title="Locking mechanism video" />

            <MechanismVideo src={`${videoBase}Hook.mp4`} title="Hook cam and follower mechanism video" />
            <MechanismText title="Hook - Cam and Follower Mechanism">
              <ul>
                <li>Each Hook is tied to a Rubber Band pulling it up.</li>
                <li>2 Custom Cam shapes are fixed onto the axle, 1 on each side in different orientations.</li>
                <li>When the Servo rotates, the Cam pushes the lever up, bringing the Hook down.</li>
                <li>Due to its shape, the servo is able to control the hook individually just by rotating clockwise or anticlockwise.</li>
              </ul>
            </MechanismText>

            <MechanismText title="Ball Gate - Lever Linkage Mechanism">
              <ul>
                <li>A Beam pushes the Lever down.</li>
                <li>The Gate opens outwards.</li>
                <li>The Gate gets pulled back into its position by a Rubber Band.</li>
              </ul>
            </MechanismText>
            <MechanismVideo src={`${videoBase}Ball Gate.mp4`} title="Ball gate mechanism video" />
          </div>
        </article>

        <article className="competition-entry noi-entry">
          <h2>2026 National Olympiad in Informatics [NOI]</h2>
          <TextCard>
            <p>
              Hosted by the School of Computing (SoC) of the National University of Singapore (NUS), a five-hour session in
              which each contestant is required to individually solve and program a solution in C++ or Python to each of the
              four to five programming tasks (with subtasks of varying difficulties).
            </p>
          </TextCard>
          <TextCard>
            <p>
              Although computing was not my chosen elective, I honed my programming skills entirely through the Robotics CCA.
              Although I had a grasp of Python fundamentals, I initially struggled with algorithms. Therefore, I took the
              initiative to self-teach using resources like YouTube and W3Schools.
            </p>
            <p>
              This journey of self-directed learning proved to be both challenging and rewarding. I dedicated countless hours
              to watching tutorials and tackling past NOI programming tasks. Gradually, I started to understand the complexities
              of various algorithms and their practical applications.
            </p>
            <p>
              Through perseverance and commitment, I discovered that learning is a lifelong endeavour. With the right resources
              and mindset, anything is achievable. After all, I successfully qualified as a finalist!
            </p>
          </TextCard>

          <div className="noi-grid">
            <CardImage src={`${imageBase}2026-noi-binary-search-card.png`} alt="Binary search learning card" />
            <Figure src={`${imageBase}noi-certificate.png`} alt="NOI certificate of participation" />
          </div>
        </article>
      </section>
      <MediaModal content={modalContent} onClose={() => setModalContent(null)} />
    </>
  );
}

export default function Competitions() {
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  const openVideo = (title: string, src: string) => setModalContent({ title, src, type: "video" });
  const openImage = (title: string, src: string, alt?: string) => setModalContent({ title, src, alt, type: "image" });
  const openModel = (title: string, lumaSrc: string, glbSrc?: string) => setModalContent({ title, lumaSrc, glbSrc, type: "model" });

  return (
    <>
      <section id="competitions" className="reference-page competitions-reference-page" aria-label="Competitions">
        <div className="reference-sheet competition-reference-sheet">
          <img
            className="reference-sheet-image"
            src="/page-assets/competitions/reference-no-buttons.png"
            alt="Competitions portfolio page"
            loading="eager"
            decoding="async"
          />
          <video
            className="mechanism-video-overlay grab-lift-video-hotspot"
            src={`${videoBase}Grab and Lift.mp4`}
            aria-label="Grab and lift mechanism simulation"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <video
            className="mechanism-video-overlay locking-video-hotspot"
            src={`${videoBase}Locking.mp4`}
            aria-label="Grabber locking mechanism simulation"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <video
            className="mechanism-video-overlay hook-video-hotspot"
            src={`${videoBase}Hook.mp4`}
            aria-label="Hook cam and follower mechanism simulation"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <video
            className="mechanism-video-overlay ball-gate-video-hotspot"
            src={`${videoBase}Ball Gate.mp4`}
            aria-label="Ball gate lever linkage mechanism simulation"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />

          <button
            className="reference-action-button wro-2024-run-hotspot"
            type="button"
            aria-label="Watch 2024 WRO robot run"
            onClick={() => openVideo("2024 WRO Robot Run", `${videoBase}WRO2024_RobotRun.mp4`)}
          >
            <PlayCircle aria-hidden="true" />
            Click here to watch our robot run!
          </button>
          <button
            className="reference-action-button wro-2024-sq-hotspot"
            type="button"
            aria-label="Watch WRO 2024 Side Quest 4"
            onClick={() => openVideo("2024 WRO Side Quest 4", `${videoBase}WRO2024_SQ4.mov`)}
          >
            <PlayCircle aria-hidden="true" />
            Click here to watch our SQ4!
          </button>
          <button
            className="reference-action-button fll-2025-certificate-hotspot"
            type="button"
            aria-label="View 2025 FLL Overall Champion certificate"
            onClick={() =>
              openImage(
                "Overall Champion Certificate",
                `${imageBase}2025-fll-overall-champion-certificate.png`,
                "Overall Champion certificate"
              )
            }
          >
            <ExternalLink aria-hidden="true" />
            Click here to view certificate!
          </button>
          <button
            className="reference-action-button fll-2025-run-hotspot"
            type="button"
            aria-label="Watch 2025 FLL robot run"
            onClick={() => openVideo("2025 FLL Robot Run", `${videoBase}FLL2025_RobotRun.mp4`)}
          >
            <PlayCircle aria-hidden="true" />
            Click here to watch our robot run!
          </button>
          <button
            className="reference-action-button scubathon-model-hotspot"
            type="button"
            aria-label="View Scubathon 3D model"
            onClick={() => openModel("Scubathon 3D Model", scubathonLumaSrc)}
          >
            <Box aria-hidden="true" />
            Click here to view 3D model!
          </button>
          <button
            className="reference-action-button scubathon-demo-hotspot"
            type="button"
            aria-label="Watch Scubathon demo"
            onClick={() => openVideo("Scubathon Demo", `${videoBase}Scubathon_Demo.mp4`)}
          >
            <PlayCircle aria-hidden="true" />
            Click here to watch the demo!
          </button>
          <button
            className="reference-action-button wro-2025-run-hotspot"
            type="button"
            aria-label="Watch 2025 WRO robot run"
            onClick={() => openVideo("2025 WRO Robot Run", `${videoBase}WRO2025_RobotRun.mp4`)}
          >
            <PlayCircle aria-hidden="true" />
            Click here to watch our robot run!
          </button>
          <button
            className="reference-action-button wro-international-model-hotspot"
            type="button"
            aria-label="View WRO International robot 3D model"
            onClick={() => openModel("WRO International Robot", wroRobotLumaSrc, wroRobotGlbSrc)}
          >
            <Box aria-hidden="true" />
            Click here to view 3D model!
          </button>
          <button
            className="reference-action-button wro-international-run-hotspot"
            type="button"
            aria-label="Watch WRO International robot run"
            onClick={() => openVideo("WRO International Robot Run", `${videoBase}WRO_International_RobotRun.mp4`)}
          >
            <PlayCircle aria-hidden="true" />
            Click here to watch our robot run!
          </button>
        </div>
      </section>
      <MediaModal content={modalContent} onClose={() => setModalContent(null)} />
    </>
  );
}

useGLTF.preload(wroRobotGlbSrc);
