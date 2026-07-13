import { useEffect } from "react";
import { GlbViewer } from "./Competitions";
import { publicAsset } from "./assetPath";

type VideoItem = {
  poster?: string;
  src: string;
  title: string;
};

type ModelItem =
  | {
      kind: "glb";
      src: string;
      title: string;
    }
  | {
      kind: "luma";
      src: string;
      title: string;
    };

type CompetitionShowcase = {
  competition: string;
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
  title: `Robot Run ${index + 1}`,
}));

const fll2025Runs: VideoItem[] = Array.from({ length: 8 }, (_, index) => ({
  src: video(`Run${index + 1}.mp4`),
  title: `Individual Robot Run ${index + 1}`,
}));

const showcases: Record<CompetitionMediaSlug, CompetitionShowcase> = {
  "2024-fll": {
    competition: "2024 First Lego League (FLL)",
    videos: fll2024Runs,
  },
  "2024-wro": {
    competition: "2024 World Robot Olympiad (WRO)",
    videos: [
      { src: video("WRO2024_RobotRun.mp4"), title: "Competition Robot Run" },
      { src: video("WRO2024_SQ4.mov"), title: "Side Quest 4" },
    ],
  },
  "2025-fll": {
    competition: "2025 First Lego League (FLL)",
    videos: [
      { src: video("FLL2025_RobotRun.mp4"), title: "Full Competition Robot Run" },
      ...fll2025Runs,
      { src: video("Scubathon_Demo.mp4"), title: "Scubathon Research Project Demo" },
    ],
    models: [
      {
        kind: "luma",
        src: "https://lumalabs.ai/embed/6741b8ca-8649-41c9-8dc2-73d3f3278f77?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false",
        title: "Scubathon 3D Model",
      },
    ],
  },
  "2025-wro": {
    competition: "2025 World Robot Olympiad (WRO)",
    videos: [{ src: video("WRO2025_RobotRun.mp4"), title: "Competition Robot Run" }],
  },
  "2025-wro-international": {
    competition: "2025 World Robot Olympiad (WRO) — International",
    videos: [
      { src: video("WRO_International_RobotRun.mp4"), title: "International Competition Robot Run" },
      { src: video("Grab and Lift.mp4"), title: "Grab and Lift Mechanism" },
      { src: video("Locking.mp4"), title: "Grabber Locking Mechanism" },
      { src: video("Hook.mp4"), title: "Hook Cam and Follower Mechanism" },
      { src: video("Ball Gate.mp4"), title: "Ball Gate Lever Linkage Mechanism" },
    ],
    models: [
      {
        kind: "glb",
        src: publicAsset("/models/WRO2025_Robot.glb"),
        title: "International Competition Robot 3D Model",
      },
    ],
  },
};

export function CompetitionMediaPage({ slug }: { slug: CompetitionMediaSlug }) {
  const showcase = showcases[slug];

  useEffect(() => {
    document.title = `${showcase.competition} | Zhiyuan's Portfolio`;

    return () => {
      document.title = "Zhiyuan's Portfolio";
    };
  }, [showcase.competition]);

  return (
    <section className="competition-media-page" aria-labelledby="competition-media-title">
      <header className="competition-media-header">
        <p>Competition media archive</p>
        <h1 id="competition-media-title">{showcase.competition}</h1>
        <span>Videos{showcase.models?.length ? " and interactive 3D models" : ""}</span>
      </header>

      <div className="competition-media-grid">
        {showcase.videos.map((item) => (
          <article className="competition-media-card" key={item.src}>
            <h2>{item.title}</h2>
            <video controls playsInline preload="metadata" poster={item.poster} title={`${showcase.competition}: ${item.title}`}>
              <source src={item.src} />
              Your browser does not support embedded video.
            </video>
          </article>
        ))}

        {showcase.models?.map((item) => (
          <article className="competition-media-card competition-model-card" key={item.src}>
            <h2>{item.title}</h2>
            {item.kind === "glb" ? (
              <GlbViewer src={item.src} title={item.title} />
            ) : (
              <iframe
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                loading="lazy"
                src={item.src}
                title={`${showcase.competition}: ${item.title}`}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
