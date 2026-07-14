import { useEffect, useRef, useState } from "react";

export function ModelControlsHint({ embedded = false }: { embedded?: boolean }) {
  const hintRef = useRef<HTMLDivElement>(null);
  const usedControls = useRef(new Set<string>());
  const fadeTimer = useRef<number | undefined>(undefined);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const container = hintRef.current?.parentElement;
    if (!container) return;

    usedControls.current.clear();
    setIsHidden(false);

    const markUsed = (control: string) => {
      usedControls.current.add(control);
      if (usedControls.current.size === 3) setIsHidden(true);
    };

    if (embedded) {
      const iframe = container.querySelector("iframe");
      const handleWindowBlur = () => {
        window.setTimeout(() => {
          if (document.activeElement !== iframe) return;
          window.clearTimeout(fadeTimer.current);
          fadeTimer.current = window.setTimeout(() => setIsHidden(true), 5000);
        }, 0);
      };

      window.addEventListener("blur", handleWindowBlur);
      return () => {
        window.removeEventListener("blur", handleWindowBlur);
        window.clearTimeout(fadeTimer.current);
      };
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button === 0) markUsed("rotate");
      if (event.button === 2) markUsed("pan");
    };
    const handleWheel = () => markUsed("zoom");

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [embedded]);

  return (
    <div
      ref={hintRef}
      className={`model-controls-pill${isHidden ? " is-hidden" : ""}`}
      aria-label="3D viewer controls"
      aria-hidden={isHidden}
    >
      <span><strong>Left drag</strong> Rotate</span>
      <span><strong>Right drag</strong> Pan</span>
      <span><strong>Scroll</strong> Zoom</span>
    </div>
  );
}
