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
  {
    id: "sky",
    label: "Sky",
    labelVi: "Bầu trời",
    pct: "16.3%",
    color: "#38bdf8",
    shape: { type: "rect", x: 0, y: 0, w: 900, h: 95, rx: 0 },
    tooltip: "Bầu trời — nền không gian tổng thể của hệ sinh thái",
  },
  {
    id: "cloud_left",
    label: "Cloud (Wind)",
    labelVi: "Mây trái — Gió",
    pct: "~8%",
    color: "#22d3ee",
    shape: { type: "ellipse", cx: 190, cy: 115, rx: 145, ry: 78 },
    tooltip: "Mây gió (trái) — đại diện cho Marketing, tạo lực đẩy thương hiệu",
  },
  {
    id: "cloud_right",
    label: "Cloud (Rain)",
    labelVi: "Mây phải — Mưa",
    pct: "~8%",
    color: "#818cf8",
    shape: { type: "ellipse", cx: 700, cy: 100, rx: 165, ry: 82 },
    tooltip: "Mây mưa (phải) — đại diện Thiên thời, cơ hội từ thị trường",
  },
  {
    id: "wind",
    label: "Wind",
    labelVi: "Gió",
    pct: "0.1%",
    color: "#06b6d4",
    shape: { type: "rect", x: 80, y: 110, w: 220, h: 155, rx: 20 },
    tooltip: "Gió — luồng Marketing thổi đưa thương hiệu ra thị trường",
  },
  {
    id: "rain",
    label: "Rain",
    labelVi: "Mưa",
    pct: "0.4%",
    color: "#60a5fa",
    shape: { type: "rect", x: 560, y: 85, w: 165, h: 105, rx: 20 },
    tooltip: "Mưa — Thiên thời, nguồn lực & cơ hội từ môi trường bên ngoài",
  },
  {
    id: "canopy",
    label: "Canopy",
    labelVi: "Tán lá",
    pct: "32.1%",
    color: "#4ade80",
    shape: {
      type: "path",
      d: "M450,80 C300,75 150,130 90,200 C40,260 60,330 130,360 C200,390 320,400 380,390 L380,430 L520,430 L520,390 C580,400 700,390 770,360 C840,330 860,260 810,200 C750,130 600,75 450,80 Z",
    },
    tooltip: "Tán lá — 5 phòng ban, hiệu quả hoạt động, sức sống của tổ chức",
  },
  {
    id: "branches",
    label: "Branches",
    labelVi: "Cành cây",
    pct: "5.2%",
    color: "#d97706",
    shape: {
      type: "path",
      d: "M370,300 C280,280 180,260 120,235 L135,255 C190,270 280,295 375,320 Z M530,300 C620,280 720,260 780,235 L765,255 C710,270 620,295 525,320 Z M400,350 C350,330 260,320 200,315 L210,332 C265,335 355,345 405,368 Z M500,350 C550,330 640,320 700,315 L690,332 C635,335 545,345 495,368 Z",
    },
    tooltip: "Cành cây — kết nối giữa thân (Technology) và tán lá (các phòng ban)",
  },
  {
    id: "trunk",
    label: "Trunk",
    labelVi: "Thân cây",
    pct: "3.2%",
    color: "#a78bfa",
    shape: { type: "rect", x: 393, y: 290, w: 114, h: 185, rx: 8 },
    tooltip: "Thân cây — Technology Core, nền tảng kỹ thuật dẫn đến 30 Projects",
  },
  {
    id: "roots",
    label: "Roots",
    labelVi: "Rễ cây",
    pct: "2.3%",
    color: "#fb923c",
    shape: {
      type: "path",
      d: "M420,470 C370,468 300,475 250,488 C210,498 195,510 205,520 L215,518 C225,510 250,502 295,494 C340,486 390,482 430,482 L430,470 Z M480,470 C530,468 600,475 650,488 C690,498 705,510 695,520 L685,518 C675,510 650,502 605,494 C560,486 510,482 470,482 L470,470 Z M440,474 L440,525 L460,525 L460,474 Z",
    },
    tooltip: "Rễ cây — Personnel System, nền tảng nhân sự HR của tổ chức",
  },
  {
    id: "grass",
    label: "Grass / Ground",
    labelVi: "Cỏ & Mặt đất",
    pct: "11.8%",
    color: "#34d399",
    shape: { type: "rect", x: 0, y: 485, w: 900, h: 45, rx: 0 },
    tooltip: "Mặt đất — Partner Block: Suppliers, HR Partners, Knowledge Partners, Financial Partners",
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
  const [showLayers,  setShowLayers]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const border   = dark ? "#1a3660" : "#c7dff5";
  const textSub  = dark ? "#94a3b8" : "#64748b";
  const textMain = dark ? "#f1f5f9" : "#0f172a";

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
          <button onClick={() => setShowLayers(!showLayers)} style={{
            padding: "4px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600,
            border: `1px solid ${showLayers ? "#6366f1" : (dark ? "#1a3660" : "#d1d5db")}`,
            background: showLayers ? (dark ? "#312e81" : "#eef2ff") : (dark ? "#0e1c34" : "#f9fafb"),
            color: showLayers ? "#6366f1" : textSub,
          }}>
            🔬 {showLayers ? "Ẩn layers" : "Xem layers"}
          </button>
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
            href={showLayers ? "/layer_visualization.png" : "/tree-crm.png"}
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
