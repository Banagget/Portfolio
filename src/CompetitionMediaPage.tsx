import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { GlbViewer } from "./Competitions";
import { publicAsset } from "./assetPath";

type VideoItem = {
  layout?: "featured" | "individual" | "mechanism" | "portrait";
  poster?: string;
  src: string;
  title: string;
};

type ModelItem = {
  glbSrc?: string;
  lumaSrc: string;
  title: string;
};

type CompetitionShowcase = {
  competition: string;
  layout: "fll" | "grid" | "international" | "pair" | "single";
  models?: ModelItem[];
  videos: VideoItem[];
};

export type CompetitionMediaSlug =
  | "2024-fll"
  | "2024-wro"
  | "2025-fll"
  | "2025-wro"
  | "2025-wro-international";

const video = (filename: string) => publicAsset(`/project-videos/${filename}`);

const fll2024Runs: VideoItem[] = Array.from({ length: 8 }, (_, index) => ({
  poster: video(`posters/24run${index + 1}.jpg`),
  src: video(`24run${index + 1}.mp4`),
  title: `Run ${index + 1}`,
}));

const fll2025Runs: VideoItem[] = Array.from({ length: 8 }, (_, index) => ({
  layout: "individual",
  src: video(`Run${index + 1}.mp4`),
  title: `Run ${index + 1}`,
}));

const showcases: Record<CompetitionMediaSlug, CompetitionShowcase> = {
  "2024-fll": {
    competition: "2024 First Lego League (FLL)",
    layout: "grid",
    videos: fll2024Runs,
  },
  "2024-wro": {
    competition: "2024 World Robot Olympiad (WRO)",
    layout: "pair",
    videos: [
      { src: video("WRO2024_RobotRun.mp4"), title: "Robot Run (Full Points)" },
      { src: video("WRO2024_SQ4.mov"), title: "Side Quest 4" },
    ],
  },
  "2025-fll": {
    competition: "2025 First Lego League (FLL)",
    layout: "fll",
    videos: [
      { layout: "featured", src: video("FLL2025_RobotRun.mp4"), title: "Ideal Full Run (Full Points)" },
      ...fll2025Runs,
      { layout: "portrait", src: video("Scubathon_Demo.mp4"), title: "Scubathon Demo" },
    ],
    models: [
      {
        lumaSrc: "https://lumalabs.ai/embed/6741b8ca-8649-41c9-8dc2-73d3f3278f77?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false",
        title: "Scubathon 3D Model",
      },
    ],
  },
  "2025-wro": {
    competition: "2025 World Robot Olympiad (WRO)",
    layout: "single",
    videos: [{ layout: "featured", src: video("WRO2025_RobotRun.mp4"), title: "Robot Run (Full Points)" }],
  },
  "2025-wro-international": {
    competition: "2025 World Robot Olympiad (WRO) — International",
    layout: "international",
    videos: [
      { layout: "featured", src: video("WRO_International_RobotRun.mp4"), title: "International Robot Run (Full Points)" },
      { layout: "mechanism", src: video("Grab and Lift.mp4"), title: "Grab and Lift Mechanism" },
      { layout: "mechanism", src: video("Locking.mp4"), title: "Grabber Locking Mechanism" },
      { layout: "mechanism", src: video("Hook.mp4"), title: "Hook Cam and Follower Mechanism" },
      { layout: "mechanism", src: video("Ball Gate.mp4"), title: "Ball Gate Lever Linkage Mechanism" },
    ],
    models: [
      {
        glbSrc: publicAsset("/models/WRO2025_Robot.glb"),
        lumaSrc: "https://lumalabs.ai/embed/51b48e56-92dd-4923-b213-1d408d253b8a?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false",
        title: "Robot 3D Model",
      },
    ],
  },
};

function CompetitionModel({ competition, item }: { competition: string; item: ModelItem }) {
  const [mode, setMode] = useState<"glb" | "luma">("luma");
  const canSwitch = Boolean(item.glbSrc);

  return (
    <article className="competition-media-card competition-model-card">
      <div className="competition-model-heading">
        <h2>{item.title}</h2>
        {canSwitch ? (
          <button
            className="competition-model-toggle"
            type="button"
            onClick={() => setMode((current) => (current === "luma" ? "glb" : "luma"))}
          >
            {mode === "luma" ? "Switch to GLB Model" : "Switch to Luma AI Model"}
          </button>
        ) : null}
      </div>
      {mode === "glb" && item.glbSrc ? (
        <GlbViewer src={item.glbSrc} title={item.title} />
      ) : (
        <iframe
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          loading="lazy"
          src={item.lumaSrc}
          title={`${competition}: ${item.title} — Luma AI`}
        />
      )}
      <p className="competition-model-controls">Left drag to rotate · Right drag to pan · Scroll to zoom</p>
    </article>
  );
}

export function CompetitionMediaPage({ slug }: { slug: CompetitionMediaSlug }) {
  const showcase = showcases[slug];
  const returnPointerX = useMotionValue(0);
  const returnPointerY = useMotionValue(0);
  const returnShiftX = useSpring(returnPointerX, { damping: 25, stiffness: 300, mass: 0.5 });
  const returnShiftY = useSpring(returnPointerY, { damping: 25, stiffness: 300, mass: 0.5 });

  const moveReturnSurface = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    returnPointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 10);
    returnPointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 8);
  };

  const settleReturnSurface = () => {
    returnPointerX.set(0);
    returnPointerY.set(0);
  };

  useEffect(() => {
    document.title = `${showcase.competition} | Zhiyuan's Portfolio`;

    return () => {
      document.title = "Zhiyuan's Portfolio";
    };
  }, [showcase.competition]);

  return (
    <section className={`competition-media-page media-layout-${showcase.layout}`} aria-labelledby="competition-media-title">
      <motion.div
        className="competition-media-return-motion"
        onPointerLeave={settleReturnSurface}
        onPointerMove={moveReturnSurface}
        style={{ x: returnShiftX, y: returnShiftY }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link className="liquid-glass nav-home-button competition-media-return" to="/">
          <span>Return to Portfolio</span>
        </Link>
      </motion.div>
      <header className="competition-media-header">
        <div className="competition-media-header-topline">
          <span>Videos{showcase.models?.length ? " and interactive 3D models" : ""}</span>
        </div>
        <h1 id="competition-media-title">{showcase.competition}</h1>
      </header>

      <div className="competition-media-grid">
        {showcase.videos.map((item) => (
          <article className={`competition-media-card${item.layout ? ` media-card-${item.layout}` : ""}`} key={item.src}>
            <h2>{item.title}</h2>
            <video controls playsInline preload="metadata" poster={item.poster} title={`${showcase.competition}: ${item.title}`}>
              <source src={item.src} />
              Your browser does not support embedded video.
            </video>
          </article>
        ))}

        {showcase.models?.map((item) => (
          <CompetitionModel competition={showcase.competition} item={item} key={item.lumaSrc} />
        ))}
      </div>
    </section>
  );
}
