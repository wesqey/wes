"use client";

import { useEffect, useRef, useState } from "react";

type View = { scale: number; x: number; y: number };
const MIN = 1;
const MAX = 6;

function clampView(v: View, w: number, h: number): View {
  const s = Math.min(MAX, Math.max(MIN, v.scale));
  if (s === 1) return { scale: 1, x: 0, y: 0 };
  const maxX = ((s - 1) * w) / 2;
  const maxY = ((s - 1) * h) / 2;
  return {
    scale: s,
    x: Math.min(maxX, Math.max(-maxX, v.x)),
    y: Math.min(maxY, Math.max(-maxY, v.y)),
  };
}

export default function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinch = useRef<number | null>(null);

  function size() {
    const r = stageRef.current?.getBoundingClientRect();
    return { w: r?.width ?? window.innerWidth, h: r?.height ?? window.innerHeight, r };
  }

  // Zoom by a factor, keeping the point (cx, cy) fixed. Coordinates are
  // relative to the center of the screen.
  function zoomAt(factor: number, cx: number, cy: number) {
    const { w, h } = size();
    setView((v) => {
      const ns = Math.min(MAX, Math.max(MIN, v.scale * factor));
      const r = ns / v.scale;
      return clampView({ scale: ns, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r }, w, h);
    });
  }

  function close() {
    setOpen(false);
    setView({ scale: 1, x: 0, y: 0 });
    pointers.current.clear();
  }

  // Esc to close, lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") zoomAt(1.4, 0, 0);
      if (e.key === "-") zoomAt(1 / 1.4, 0, 0);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll-wheel zoom (needs a non-passive listener to block page scroll)
  useEffect(() => {
    const el = stageRef.current;
    if (!open || !el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - (r.left + r.width / 2);
      const cy = e.clientY - (r.top + r.height / 2);
      zoomAt(Math.exp(-e.deltaY * 0.0015), cx, cy);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) setDragging(true);
    if (pointers.current.size === 2) lastPinch.current = null;
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    const { w, h, r } = size();

    if (pointers.current.size === 1) {
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      setView((v) => clampView({ ...v, x: v.x + dx, y: v.y + dy }, w, h));
    } else if (pointers.current.size === 2 && r) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch.current) {
        const mx = (a.x + b.x) / 2 - (r.left + r.width / 2);
        const my = (a.y + b.y) / 2 - (r.top + r.height / 2);
        zoomAt(dist / lastPinch.current, mx, my);
      }
      lastPinch.current = dist;
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    lastPinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }

  function onDoubleClick(e: React.MouseEvent) {
    const { r } = size();
    if (!r) return;
    if (view.scale > 1) {
      setView({ scale: 1, x: 0, y: 0 });
    } else {
      zoomAt(2.5, e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    }
  }

  const btn: React.CSSProperties = {
    background: "rgba(11,11,10,0.7)",
    color: "var(--fg)",
    border: "1px solid var(--line)",
    padding: "10px 14px",
    fontSize: 12,
    cursor: "pointer",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`View ${alt} full screen`}
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--line)",
          padding: 0,
          cursor: "zoom-in",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxHeight: "80vh",
          width: "100%",
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain", display: "block" }}
        />
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000" }}>
          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
              cursor: view.scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
              overflow: "hidden",
            }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                maxWidth: "100vw",
                maxHeight: "100vh",
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transformOrigin: "center center",
                transition: dragging ? "none" : "transform 0.12s ease-out",
              }}
            />
          </div>

          <button className="mono" onClick={close} style={{ ...btn, position: "absolute", top: 16, right: 16 }}>
            CLOSE ✕
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
            }}
          >
            <button className="mono" style={btn} onClick={() => zoomAt(1 / 1.4, 0, 0)}>−</button>
            <button className="mono" style={btn} onClick={() => setView({ scale: 1, x: 0, y: 0 })}>RESET</button>
            <button className="mono" style={btn} onClick={() => zoomAt(1.4, 0, 0)}>+</button>
          </div>
        </div>
      )}
    </>
  );
}