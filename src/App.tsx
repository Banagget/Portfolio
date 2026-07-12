import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Competitions from "./Competitions";
import Projects from "./Projects";
import { StaticReferencePage, TestimonialPage } from "./ReferencePages";
import { publicAsset } from "./assetPath";

const navItems = [
  { label: "Competitions", href: "/competitions" },
  { label: "Projects", href: "/projects" },
  { label: "Contribution, Leadership and Community Engagements", href: "/contribution-leadership-community" },
  { label: "LEAPS", href: "/leaps" },
  { label: "Skills and Development", href: "/skills-development" },
  { label: "Testimonial", href: "/testimonial" },
];

export default function App() {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavCompact, setIsNavCompact] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const location = useLocation();

  // iOS-style spring physics for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Horizontal and vertical shift distances
  const navShiftX = useTransform(smoothX, (v) => v * (isMenuOpen ? 4 : 8));
  const navShiftY = useTransform(smoothY, (v) => v * (isMenuOpen ? 1.2 : 5));

  useEffect(() => {
    document.title = "Zhiyuan's Portfolio";
  }, []);

  useEffect(() => {
    const updateScrollState = () => {
      const hasScrolled = window.scrollY > 110;
      setIsNavCompact(hasScrolled);
      setShowBackToTop(window.scrollY > 520);

      if (!hasScrolled && window.innerWidth > 1180) {
        setIsMenuOpen(false);
      }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const sectionId = window.location.hash.slice(1);

      if (!sectionId) {
        window.scrollTo({ top: 0, left: 0 });
        return;
      }

      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
      });
    };

    scrollToHash();
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  const moveNavSurface = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const settleNavSurface = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHoveredNav(null);
  };

  return (
    <main className="page-shell">
      <svg className="liquid-filter-svg" aria-hidden="true" focusable="false">
        <filter id="liquid-glass-refraction" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.024"
            numOctaves="2"
            seed="7"
            result="liquidNoise"
          />
          <feGaussianBlur in="liquidNoise" stdDeviation="1.4" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="refracted"
          />
          <feColorMatrix
            in="refracted"
            type="matrix"
            values="1.08 0 0 0 0  0 1.08 0 0 0  0 0 1.1 0 0  0 0 0 1 0"
          />
        </filter>
      </svg>

      <nav
        className={`site-nav${isNavCompact ? " is-compact" : ""}`}
        aria-label="Primary navigation"
      >
        <motion.div 
          className="liquid-glass nav-home-button" 
           
          aria-current={location.pathname === "/" ? "page" : undefined}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link to="/" className="nav-home-link">Home</Link>
        </motion.div>

        <motion.div
          className="nav-right"
          onPointerLeave={settleNavSurface}
          onPointerMove={moveNavSurface}
          style={{ x: navShiftX, y: navShiftY }}
        >
          <div className="liquid-glass nav-glass nav-desktop-links">
            <div className="nav-links">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="nav-link"
                  to={item.href}
                  onFocus={() => setHoveredNav(item.href)}
                  onPointerEnter={() => setHoveredNav(item.href)}
                >
                  {hoveredNav === item.href && (
                    <motion.span
                      layoutId="nav-bubble"
                      className="nav-bubble"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="nav-link-text">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <motion.button
            className={`liquid-glass menu-button${isMenuOpen ? " is-open" : ""}`}
            type="button"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="compact-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <img src={publicAsset("/MenuIcon.png")} alt="" aria-hidden="true" />
          </motion.button>

          <div
            id="compact-navigation"
            className={`liquid-glass compact-menu${isMenuOpen ? " is-open" : ""}`}
            aria-hidden={!isMenuOpen}
          >
            <div className="compact-menu-links">
              {navItems.map((item) => (
              <Link
                key={item.href}
                className="compact-menu-link"
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </nav>

      <div className="route-fade">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contribution-leadership-community" element={<StaticReferencePage page="clce" />} />
          <Route path="/leaps" element={<StaticReferencePage page="leaps" />} />
          <Route path="/skills-development" element={<StaticReferencePage page="skills" />} />
          <Route path="/testimonial" element={<TestimonialPage />} />
        </Routes>
      </div>

      <motion.button
        className={`liquid-glass back-to-top-button${showBackToTop ? " is-visible" : ""}`}
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
        whileHover={{ y: -2, scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
      >
        <ArrowUp aria-hidden="true" size={25} strokeWidth={2.2} />
      </motion.button>

    </main>
  );
}

function HomePage() {
  return (
    <>
      <section id="home" className="hero-section" aria-label="Home">
        <h1>
          Zhiyuan&rsquo;s
          <br />
          Portfolio
        </h1>
        <img className="profile-image" src={publicAsset("/Profile.png")} alt="Zhiyuan smiling while holding a folder" />
      </section>

      <section className="about-section" aria-label="About me">
        <div className="about-copy">
          <h2>About Me</h2>
          <div className="about-rule" aria-hidden="true" />

          <div className="text-card">
            <p>
              I am Lin Zhiyuan, a Secondary 4 student at Admiralty Secondary School, serving as a Student Councillor and
              the Vice President of the Robotics Club. I have always been fascinated by how different mechanisms work
              together and enjoy understanding how the things around me function, especially vehicles, aircraft,
              electronics, and technologies. Outside of school, I enjoy watching creators on YouTube who design and build
              custom tools and workspace improvements. Seeing their ideas come to life inspires me to one day design and
              build my own creations that solve everyday problems. Moreover, I also enjoy how they can transform ideas
              into engaging visuals and make complex concepts easier to understand. One goal I have is to learn Blender so
              that I can animate models or robots that I designed in CAD software like Fusion 360, and create cinematic
              demonstrations with dynamic camera angles and simulations that would be difficult or impossible to capture in
              real life. It allows me to communicate ideas more effectively while expanding my creativity.
              <br />I believe that combining creativity with engineering allows ideas to become practical solutions, and I
              am always eager to learn new skills, take on challenges, and continuously improve myself.
            </p>
          </div>

          <h3>-What got me interested in STEM?</h3>

          <div className="text-card text-card-short">
            <p>
              My passion for engineering began with LEGO Technics, where I fell in love with turning simple components
              into complex, functional machines. Today, that same curiosity drives my interest in automation. My natural
              inclination toward efficiency drives me to seek automation solutions that minimise manual effort and simplify
              daily tasks. Realising that my ambitions were bound by my foundational knowledge, I was motivated to dive
              deeper into engineering to bring my own ideas to life.
            </p>
          </div>
        </div>

        <img className="bugatti-image" src={publicAsset("/Bugatti.png")} alt="Zhiyuan working on a blue LEGO Bugatti model" />
      </section>
    </>
  );
}
