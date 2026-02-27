"use client";

import { useState, useEffect } from "react";

// ── Layer zones — mapped to SVG viewBox 0 0 900 530 ──────────────────────────
// Coords derived from Python HSV analysis of tree-crm.png (2150x1266 px)
// Scale factor: 0.4186  (px * 0.4186 = SVG unit)
type LayerShape =
  | { type: "rect";    x: number; y: number; w: number; h: number; rx?: number }
  | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { type: "path";    d: string };

interface LayerDef {
  id: string;
  label: string;
  labelVi: string;
  pct: string;
  color: string;       // glow/highlight color
  shape: LayerShape;
  tooltip: string;
}

const LAYERS: LayerDef[] = [
  // ── 1. Mây (gộp cả 2 đám mây trái + phải) ───────────────────────
  {
    id: "clouds",
    label: "Clouds",
    labelVi: "Mây",
    pct: "~16%",
    color: "#aaaaaa",
    shape: {
      type: "path",
      // Mây trái (cx≈185, cy≈108) + Mây phải (cx≈695, cy≈95) — 2 sub-paths
      d: "M185,68 C138,54 68,64 44,98 C22,132 50,168 104,176 C146,182 198,168 235,148 C268,130 292,104 278,84 C265,66 222,58 185,68 Z M695,52 C624,40 546,62 533,97 C520,132 556,165 622,174 C668,180 730,170 772,150 C810,132 844,106 830,80 C816,58 758,48 695,52 Z",
    },
    tooltip: "Mây — nguồn lực & cơ hội từ môi trường bên ngoài",
  },

  // ── 2. Gió (trái — vùng luồng gió cuộn) ─────────────────────────
  {
    id: "wind",
    label: "Wind",
    labelVi: "Gió",
    pct: "0.1%",
    color: "#999999",
    shape: { type: "rect", x: 58, y: 98, w: 268, h: 188, rx: 30 },
    tooltip: "Gió — Marketing, luồng lực đẩy thương hiệu ra thị trường",
  },

  // ── 3. Mưa (phải — vùng hạt mưa rơi) ────────────────────────────
  {
    id: "rain",
    label: "Rain",
    labelVi: "Mưa",
    pct: "0.4%",
    color: "#aaaaaa",
    shape: { type: "rect", x: 524, y: 72, w: 202, h: 158, rx: 24 },
    tooltip: "Mưa — Thiên thời, nguồn lực & cơ hội từ môi trường bên ngoài",
  },

  // ── 4. Thân cây (trunk) ──────────────────────────────────────────
  {
    id: "trunk",
    label: "Trunk",
    labelVi: "Thân cây",
    pct: "3.2%",
    color: "#999999",
    shape: { type: "rect", x: 400, y: 296, w: 100, h: 178, rx: 10 },
    tooltip: "Thân cây — Technology Core, nền tảng kỹ thuật dẫn đến 30 Projects",
  },

  // ── 5. Rễ cây (roots — toả ra từ gốc thân) ──────────────────────
  {
    id: "roots",
    label: "Roots",
    labelVi: "Rễ cây",
    pct: "2.3%",
    color: "#bbbbbb",
    shape: {
      type: "path",
      // Rễ trái + rễ phải + rễ trung tâm thẳng đứng
      d: "M424,468 Q382,464 336,472 Q284,482 252,496 Q225,510 230,522 Q240,528 262,522 Q294,512 342,502 Q388,492 426,490 Z M476,468 Q518,464 564,472 Q616,482 648,496 Q675,510 670,522 Q660,528 638,522 Q606,512 558,502 Q512,492 474,490 Z M448,468 L448,526 L452,526 L452,468 Z",
    },
    tooltip: "Rễ cây — Personnel System, nền tảng nhân sự HR của tổ chức",
  },

  // ── 6. Cỏ & hoa lá dưới mặt đất (grass / ground cover) ──────────
  {
    id: "grass",
    label: "Grass / Ground",
    labelVi: "Cỏ & Hoa lá đất",
    pct: "~12%",
    color: "#cccccc",
    shape: { type: "rect", x: 0, y: 472, w: 900, h: 58, rx: 0 },
    tooltip: "Mặt đất — tất cả cỏ, hoa, lá dưới mặt đất; Partner Block bên ngoài",
  },
];

// Render a LayerShape as SVG element
function ShapeEl({
  shape, fill, stroke, strokeWidth, style, onMouseEnter, onMouseLeave, onClick,
}: {
  shape: LayerShape;
  fill: string; stroke: string; strokeWidth: number;
  style?: React.CSSProperties;
  onMouseEnter: (e: React.MouseEvent<SVGElement>) => void;
  onMouseLeave: () => void; onClick?: () => void;
}) {
  const common = { fill, stroke, strokeWidth, style, onMouseEnter, onMouseLeave, onClick };
  if (shape.type === "rect")
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx ?? 0} {...common} />;
  if (shape.type === "ellipse")
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
  return <path d={shape.d} {...common} />;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EcosystemTree() {
  const [mounted,     setMounted]     = useState(false);
  const [dark,        setDark]        = useState(false);
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const border   = dark ? "rgba(255,255,255,0.10)" : "#c7dff5";
  const textSub  = dark ? "#888888" : "#64748b";
  const textMain = dark ? "#eeeeee" : "#0f172a";

  const handleEnter = (layer: LayerDef, e: React.MouseEvent<SVGElement>) => {
    setHoveredId(layer.id);
    void e;
  };
  const handleLeave = () => { setHoveredId(null); };

  if (!mounted) return (
    <div style={{ width: "100%", borderRadius: 16, minHeight: 480,
      background: "#f0f7ff", border: "1px solid #c7dff5" }} />
  );

  return (
    <div style={{
      width: "100%", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
      background: dark ? "#080f1a" : "#f0f7ff",
      border: `1px solid ${border}`,
    }}>

      <style>{`
        @keyframes layer-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.72} }
        .layer-hov { transition: opacity 0.18s, filter 0.18s; }
      `}</style>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px",
        borderBottom: `1px solid ${border}`,
        background: dark ? "rgba(8,15,26,0.92)" : "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          fontFamily: "'Georgia','Times New Roman',serif",
          fontSize: 15, fontWeight: 700, letterSpacing: "0.05em", color: textMain,
        }}>🌳 Corporate Growth Tree Dashboard</span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setDark(!dark)} style={{
            padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 500,
            background: dark ? "#1a3660" : "#f1f5f9", color: dark ? "#e2e8f0" : "#475569",
          }}>{dark ? "☀ Light" : "🌙 Dark"}</button>
        </div>
      </div>

      {/* ── SVG canvas: image + interactive layer zones ───────────── */}
      <div style={{ position: "relative", width: "100%", lineHeight: 0 }}>
        <svg
          viewBox="0 0 900 530"
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
          onMouseLeave={handleLeave}
        >
          <defs>
            {/* Glow filters — one per layer color */}
            {LAYERS.map(l => (
              <filter key={l.id} id={`glow-${l.id}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feFlood floodColor={l.color} floodOpacity="0.55" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
            <filter id="dim-others" x="-5%" y="-5%" width="110%" height="110%">
              <feColorMatrix type="saturate" values="0.3" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="0.6" />
                <feFuncG type="linear" slope="0.6" />
                <feFuncB type="linear" slope="0.6" />
              </feComponentTransfer>
            </filter>
          </defs>

          {/* Background image */}
          <image
            href="/tree-crm.png"
            x="0" y="0" width="900" height="530"
            preserveAspectRatio="xMidYMid meet"
            style={{ filter: dark ? "brightness(0.75)" : "none" }}
          />

          {/* Transparent layer zones — interactive hover highlights */}
          {LAYERS.map(layer => {
            const isHov = hoveredId === layer.id;
            const anyHov = hoveredId !== null;
            return (
              <ShapeEl
                key={layer.id}
                shape={layer.shape}
                fill={isHov
                  ? `${layer.color}44`          // highlighted fill
                  : anyHov
                    ? "rgba(0,0,0,0.08)"         // others dim slightly
                    : "transparent"}
                stroke={isHov ? layer.color : "transparent"}
                strokeWidth={isHov ? 2 : 0}
                style={{
                  cursor: "pointer",
                  filter: isHov ? `url(#glow-${layer.id})` : "none",
                  transition: "fill 0.18s, stroke 0.18s",
                }}
                onMouseEnter={(e) => handleEnter(layer, e)}
                onMouseLeave={handleLeave}
              />
            );
          })}

          {/* Layer name badge that appears on hover — follows mouse roughly */}
          {/* Rendered as SVG text, not foreignObject, to avoid DOM issues */}
          {hoveredId && (() => {
            const layer = LAYERS.find(l => l.id === hoveredId)!;
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect x="10" y="488" width="560" height="36" rx="8"
                  fill={dark ? "rgba(8,15,26,0.92)" : "rgba(255,255,255,0.95)"}
                  stroke={layer.color} strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0 2px 12px ${layer.color}55)` }}/>
                <text x="22" y="503" fontSize="12" fontWeight="700" fill={layer.color}>
                  {layer.label} ({layer.pct}) — {layer.labelVi}
                </text>
                <text x="22" y="518" fontSize="9.5" fill={dark ? "#94a3b8" : "#64748b"}>
                  {layer.tooltip}
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Layer legend (bottom-right) — always visible */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          background: dark ? "rgba(8,15,26,0.90)" : "rgba(255,255,255,0.93)",
          border: `1px solid ${border}`,
          borderRadius: 10, padding: "7px 11px",
          fontSize: 9.5, lineHeight: 1.85,
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          maxWidth: 178,
        }}>
          <div style={{ fontWeight: 700, color: textMain, marginBottom: 3, fontSize: 10 }}>
            🖱 Hover để xem layer
          </div>
          {LAYERS.map(l => (
            <div
              key={l.id}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                cursor: "pointer",
                opacity: hoveredId === null || hoveredId === l.id ? 1 : 0.45,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={() => setHoveredId(l.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={{
                width: 9, height: 9, borderRadius: 2, flexShrink: 0,
                background: l.color,
                boxShadow: hoveredId === l.id ? `0 0 6px ${l.color}` : "none",
                transition: "box-shadow 0.15s",
              }} />
              <span style={{
                color: hoveredId === l.id ? l.color : textSub,
                fontWeight: hoveredId === l.id ? 700 : 400,
                transition: "color 0.15s",
              }}>
                {l.label} <span style={{ opacity: 0.6 }}>({l.pct})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div style={{
        textAlign: "center", padding: "9px 16px", fontSize: 11,
        color: textSub, borderTop: `1px solid ${border}`,
        background: dark ? "rgba(8,15,26,0.92)" : "rgba(255,255,255,0.85)",
      }}>
        🔧 Đang xây dựng lại — hover từng vùng để kiểm tra layer mapping
      </div>
    </div>
  );
}
