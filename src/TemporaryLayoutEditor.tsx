import { useEffect, useRef, useState } from "react";

type LayoutRule = {
  height?: number;
  padding?: number;
  width?: number;
  x: number;
  y: number;
};

type StoredLayouts = Record<string, LayoutRule>;

const storageKey = "zhiyuan-portfolio-temporary-layout";

const emptyLayout: LayoutRule = {
  x: 0,
  y: 0,
};

function readLayouts(): StoredLayouts {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as StoredLayouts;
  } catch {
    return {};
  }
}

function writeLayouts(layouts: StoredLayouts) {
  window.localStorage.setItem(storageKey, JSON.stringify(layouts));
}

function cssEscape(value: string) {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function getElementPath(element: HTMLElement) {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    if (current.id) {
      parts.unshift(`#${cssEscape(current.id)}`);
      break;
    }

    const parentElement: HTMLElement | null = current.parentElement;

    if (!parentElement) {
      break;
    }

    const currentTag = current.tagName;
    const sameTagSiblings = Array.from(parentElement.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === currentTag,
    );
    const index = sameTagSiblings.indexOf(current) + 1;
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
    current = parentElement;
  }

  return parts.join(" > ");
}

function findEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  if (target.closest("[data-layout-editor], .site-nav, .liquid-filter-svg")) {
    return null;
  }

  return target.closest(
    [
      "img",
      "figure",
      ".competition-text-card",
      ".text-card",
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "button",
      ".competition-main-grid",
      ".research-grid",
      ".competition-support-row",
      ".award-card",
      ".architecture-grid",
      ".architecture-framework-grid",
      "article",
      "section",
    ].join(", "),
  ) as HTMLElement | null;
}

function applyLayout(element: HTMLElement, rule: LayoutRule) {
  element.style.transform = `translate3d(${rule.x}px, ${rule.y}px, 0)`;

  if (rule.width) {
    element.style.width = `${rule.width}px`;
  } else {
    element.style.removeProperty("width");
  }

  if (rule.height) {
    element.style.height = `${rule.height}px`;
  } else {
    element.style.removeProperty("height");
  }

  if (rule.padding !== undefined) {
    element.style.padding = `${rule.padding}px`;
  } else {
    element.style.removeProperty("padding");
  }
}

function clearLayout(element: HTMLElement) {
  element.style.removeProperty("transform");
  element.style.removeProperty("width");
  element.style.removeProperty("height");
  element.style.removeProperty("padding");
}

function cleanLayout(rule: LayoutRule): LayoutRule {
  return {
    x: Math.round(rule.x || 0),
    y: Math.round(rule.y || 0),
    ...(rule.width ? { width: Math.round(rule.width) } : {}),
    ...(rule.height ? { height: Math.round(rule.height) } : {}),
    ...(rule.padding !== undefined ? { padding: Math.round(rule.padding) } : {}),
  };
}

export default function TemporaryLayoutEditor() {
  const [enabled, setEnabled] = useState(false);
  const [layout, setLayout] = useState<LayoutRule>(emptyLayout);
  const [metrics, setMetrics] = useState({ height: 0, padding: 0, width: 0 });
  const [message, setMessage] = useState("Unsaved");
  const [resizeHandlePosition, setResizeHandlePosition] = useState<{ left: number; top: number } | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const layoutRef = useRef<LayoutRule>(emptyLayout);
  const selectedRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{
    element: HTMLElement;
    path: string;
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);
  const resizeRef = useRef<{
    element: HTMLElement;
    height: number;
    pointerX: number;
    pointerY: number;
    width: number;
  } | null>(null);

  const refreshResizeHandle = (element = selectedRef.current) => {
    if (!enabled || !element) {
      setResizeHandlePosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setResizeHandlePosition({
      left: rect.right,
      top: rect.bottom,
    });
  };

  useEffect(() => {
    const applySavedLayouts = () => {
      const savedLayouts = readLayouts();

      Object.entries(savedLayouts).forEach(([selector, savedLayout]) => {
        const element = document.querySelector(selector);

        if (element instanceof HTMLElement) {
          applyLayout(element, savedLayout);
        }
      });
    };

    applySavedLayouts();

    const root = document.getElementById("root");
    const observer = new MutationObserver(applySavedLayouts);

    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  const selectElement = (element: HTMLElement) => {
    selectedRef.current?.classList.remove("temporary-layout-selected");
    selectedRef.current = element;
    element.classList.add("temporary-layout-selected");

    const selector = getElementPath(element);
    const savedLayout = readLayouts()[selector] ?? emptyLayout;
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const nextLayout = { ...emptyLayout, ...savedLayout };

    layoutRef.current = nextLayout;
    setSelectedPath(selector);
    setLayout(nextLayout);
    setMetrics({
      height: Math.round(rect.height),
      padding: Math.round(Number.parseFloat(styles.paddingTop) || 0),
      width: Math.round(rect.width),
    });
    setMessage("Unsaved");
    applyLayout(element, nextLayout);

    window.requestAnimationFrame(() => refreshResizeHandle(element));
  };

  useEffect(() => {
    if (!enabled) {
      setResizeHandlePosition(null);
      return;
    }

    const refresh = () => refreshResizeHandle();

    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [enabled, selectedPath]);

  useEffect(() => {
    if (!enabled) {
      selectedRef.current?.classList.remove("temporary-layout-selected");
      selectedRef.current = null;
      dragRef.current = null;
      setSelectedPath(null);
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const element = findEditableElement(event.target);

      if (!element) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      selectElement(element);

      const selector = getElementPath(element);
      const currentLayout = layoutRef.current;
      dragRef.current = {
        element,
        path: selector,
        pointerX: event.clientX,
        pointerY: event.clientY,
        x: currentLayout.x,
        y: currentLayout.y,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (resizeRef.current) {
        const widthScale = (resizeRef.current.width + event.clientX - resizeRef.current.pointerX) / resizeRef.current.width;
        const heightScale =
          (resizeRef.current.height + event.clientY - resizeRef.current.pointerY) / resizeRef.current.height;
        const scale = Math.max(
          0.08,
          Math.abs(widthScale - 1) > Math.abs(heightScale - 1) ? widthScale : heightScale,
        );
        const nextLayout = cleanLayout({
          ...layoutRef.current,
          height: resizeRef.current.height * scale,
          width: resizeRef.current.width * scale,
        });

        applyLayout(resizeRef.current.element, nextLayout);
        layoutRef.current = nextLayout;
        setLayout(nextLayout);
        setMetrics((current) => ({
          ...current,
          height: nextLayout.height ?? current.height,
          width: nextLayout.width ?? current.width,
        }));
        setMessage("Unsaved");
        refreshResizeHandle(resizeRef.current.element);
        return;
      }

      if (!dragRef.current) {
        return;
      }

      const nextLayout = cleanLayout({
        ...layoutRef.current,
        x: dragRef.current.x + event.clientX - dragRef.current.pointerX,
        y: dragRef.current.y + event.clientY - dragRef.current.pointerY,
      });

      applyLayout(dragRef.current.element, nextLayout);
      layoutRef.current = nextLayout;
      setLayout(nextLayout);
      setMessage("Unsaved");
      refreshResizeHandle(dragRef.current.element);
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerup", handlePointerUp, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
    };
  }, [enabled]);

  const updateLayout = (nextLayout: LayoutRule) => {
    const cleanedLayout = cleanLayout(nextLayout);

    layoutRef.current = cleanedLayout;
    setLayout(cleanedLayout);
    setMessage("Unsaved");

    if (selectedRef.current) {
      applyLayout(selectedRef.current, cleanedLayout);
      window.requestAnimationFrame(() => refreshResizeHandle(selectedRef.current));
    }
  };

  const startUniformResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!selectedRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = selectedRef.current.getBoundingClientRect();
    resizeRef.current = {
      element: selectedRef.current,
      height: rect.height,
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: rect.width,
    };
  };

  const saveSelected = () => {
    if (!selectedPath) {
      return;
    }

    const savedLayouts = readLayouts();
    savedLayouts[selectedPath] = cleanLayout(layout);
    writeLayouts(savedLayouts);
    setMessage("Saved");
  };

  const resetSelected = () => {
    if (!selectedPath || !selectedRef.current) {
      return;
    }

    const savedLayouts = readLayouts();
    delete savedLayouts[selectedPath];
    writeLayouts(savedLayouts);
    clearLayout(selectedRef.current);
    layoutRef.current = emptyLayout;
    setLayout(emptyLayout);
    window.requestAnimationFrame(() => refreshResizeHandle(selectedRef.current));
    setMessage("Reset");
  };

  const resetAll = () => {
    const savedLayouts = readLayouts();
    Object.keys(savedLayouts).forEach((selector) => {
      const element = document.querySelector(selector);

      if (element instanceof HTMLElement) {
        clearLayout(element);
      }
    });

    window.localStorage.removeItem(storageKey);
    selectedRef.current?.classList.remove("temporary-layout-selected");
    selectedRef.current = null;
    setSelectedPath(null);
    setResizeHandlePosition(null);
    layoutRef.current = emptyLayout;
    setLayout(emptyLayout);
    setMessage("All reset");
  };

  const selectParent = () => {
    const parent = selectedRef.current?.parentElement;

    if (parent && !parent.closest("[data-layout-editor], .site-nav")) {
      selectElement(parent);
    }
  };

  return (
    <aside className={`temporary-layout-editor${enabled ? " is-enabled" : ""}`} data-layout-editor>
      <button className="temporary-editor-toggle" type="button" onClick={() => setEnabled((current) => !current)}>
        {enabled ? "Stop Editing" : "Edit Layout"}
      </button>

      {enabled && resizeHandlePosition ? (
        <button
          className="temporary-resize-handle"
          type="button"
          aria-label="Resize selected element"
          onPointerDown={startUniformResize}
          style={{ left: resizeHandlePosition.left, top: resizeHandlePosition.top }}
        />
      ) : null}

      {enabled ? (
        <div className="temporary-editor-panel">
          <p>{selectedPath ? "Selected" : "Click any page element"}</p>

          <label>
            X
            <input
              type="number"
              value={layout.x}
              onChange={(event) => updateLayout({ ...layout, x: Number(event.target.value) || 0 })}
            />
          </label>
          <label>
            Y
            <input
              type="number"
              value={layout.y}
              onChange={(event) => updateLayout({ ...layout, y: Number(event.target.value) || 0 })}
            />
          </label>
          <label>
            Width
            <input
              type="number"
              placeholder={`${metrics.width}`}
              value={layout.width ?? ""}
              onChange={(event) =>
                updateLayout({ ...layout, width: event.target.value ? Number(event.target.value) : undefined })
              }
            />
          </label>
          <label>
            Height
            <input
              type="number"
              placeholder={`${metrics.height}`}
              value={layout.height ?? ""}
              onChange={(event) =>
                updateLayout({ ...layout, height: event.target.value ? Number(event.target.value) : undefined })
              }
            />
          </label>
          <label>
            Padding
            <input
              type="number"
              placeholder={`${metrics.padding}`}
              value={layout.padding ?? ""}
              onChange={(event) =>
                updateLayout({ ...layout, padding: event.target.value ? Number(event.target.value) : undefined })
              }
            />
          </label>

          <div className="temporary-editor-actions">
            <button type="button" onClick={saveSelected} disabled={!selectedPath}>
              Save
            </button>
            <button type="button" onClick={selectParent} disabled={!selectedPath}>
              Parent
            </button>
            <button type="button" onClick={resetSelected} disabled={!selectedPath}>
              Reset
            </button>
            <button type="button" onClick={resetAll}>
              Reset All
            </button>
          </div>

          <small>{message}</small>
        </div>
      ) : null}
    </aside>
  );
}
