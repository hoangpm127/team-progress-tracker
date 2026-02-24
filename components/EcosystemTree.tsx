"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";

// ─────────────────────────────────────────────────────────────────────────────
// Q1 Timing
// ─────────────────────────────────────────────────────────────────────────────
const Q1_ELAPSED = 54;
const Q1_TOTAL   = 89;
const EXPECTED   = Math.round((Q1_ELAPSED / Q1_TOTAL) * 100); // 61 %

// ─────────────────────────────────────────────────────────────────────────────
// Department accent colours
// ─────────────────────────────────────────────────────────────────────────────
const DEPT_COLORS: Record<string, string> = {
  tech:         "#6366f1",
  mkt:          "#ec4899",
  hr:           "#f59e0b",
  partnerships: "#10b981",
  assistant:    "#3b82f6",
};

// ─────────────────────────────────────────────────────────────────────────────
// Branch slot definitions  (top → bottom  =  best → weakest progress)
// ─────────────────────────────────────────────────────────────────────────────
interface SlotDef {
  ox: number; oy: number;  // attachment point on trunk
  angle: number;           // branch direction in degrees (0 = right, -90 = up)
  side: "left" | "right";
  maxLen: number;          // length at 100 % progress
  baseW:  number;          // half-width of branch at root (max progress)
}
const SLOTS: SlotDef[] = [
  { ox: 450, oy: 155, angle:  -58, side: "right", maxLen: 278, baseW: 28 },
  { ox: 447, oy: 185, angle: -122, side: "left",  maxLen: 264, baseW: 26 },
  { ox: 445, oy: 248, angle:  -52, side: "right", maxLen: 248, baseW: 24 },
  { ox: 442, oy: 282, angle: -128, side: "left",  maxLen: 232, baseW: 22 },
  { ox: 442, oy: 368, angle:  -60, side: "right", maxLen: 212, baseW: 19 },
];
const MIN_LEN = 68;
const MIN_BW  = 7.0;   // minimum branch base width at 0 %
const TIP_W   = 2.8;   // branch tip width

// ─────────────────────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────────────────────
const f2 = (n: number) => n.toFixed(2);
function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function bzAt(t: number, p0x: number, p0y: number, c1x: number, c1y: number, c2x: number, c2y: number, p3x: number, p3y: number) {
  const m = 1 - t;
  return { x: m*m*m*p0x + 3*m*m*t*c1x + 3*m*t*t*c2x + t*t*t*p3x,
           y: m*m*m*p0y + 3*m*m*t*c1y + 3*m*t*t*c2y + t*t*t*p3y };
}
function bzTanDeg(t: number, p0x: number, p0y: number, c1x: number, c1y: number, c2x: number, c2y: number, p3x: number, p3y: number) {
  const m = 1 - t;
  const dx = 3*m*m*(c1x-p0x)+6*m*t*(c2x-c1x)+3*t*t*(p3x-c2x);
  const dy = 3*m*m*(c1y-p0y)+6*m*t*(c2y-c1y)+3*t*t*(p3y-c2y);
  return toDeg(Math.atan2(dy, dx));
}

// ─────────────────────────────────────────────────────────────────────────────
// Branch geometry  →  filled tapered bezier shape
// ─────────────────────────────────────────────────────────────────────────────
interface BranchGeo {
  ox: number; oy: number;
  c1x: number; c1y: number;
  c2x: number; c2y: number;
  ex: number; ey: number;
  len: number;
  filled: string;  // SVG path for the filled tapered body
  spine: string;   // centre-line path (for highlight overlay)
}

function branchGeometry(slot: SlotDef, progress: number): BranchGeo {
  const len  = MIN_LEN + Math.sqrt(progress / 100) * (slot.maxLen - MIN_LEN);
  const rad  = toRad(slot.angle);
  const sag  = len * 0.13;

  const ex  = slot.ox + Math.cos(rad) * len;
  const ey  = slot.oy + Math.sin(rad) * len;
  const c1x = slot.ox + Math.cos(rad) * len * 0.32;
  const c1y = slot.oy + Math.sin(rad) * len * 0.32 + sag * 0.35;
  const c2x = slot.ox + Math.cos(rad) * len * 0.68;
  const c2y = slot.oy + Math.sin(rad) * len * 0.68 + sag;

  const bw     = lerp(MIN_BW, slot.baseW, progress / 100);
  const perp0  = rad + Math.PI / 2;
  const perpT  = toRad(bzTanDeg(1, slot.ox, slot.oy, c1x, c1y, c2x, c2y, ex, ey)) + Math.PI / 2;

  // 4 corner control points offset from bezier spine
  const lbx = slot.ox + Math.cos(perp0)*bw*0.5;  const lby = slot.oy + Math.sin(perp0)*bw*0.5;
  const rbx = slot.ox - Math.cos(perp0)*bw*0.5;  const rby = slot.oy - Math.sin(perp0)*bw*0.5;
  const ltx = ex + Math.cos(perpT)*TIP_W*0.5;    const lty = ey + Math.sin(perpT)*TIP_W*0.5;
  const rtx = ex - Math.cos(perpT)*TIP_W*0.5;    const rty = ey - Math.sin(perpT)*TIP_W*0.5;

  const mid = (a: number, b: number) => (a + b) * 0.5;
  const lc1x = c1x + Math.cos(perp0)*lerp(bw*0.42, TIP_W*0.28, 0.35);
  const lc1y = c1y + Math.sin(perp0)*lerp(bw*0.42, TIP_W*0.28, 0.35);
  const lc2x = c2x + Math.cos(perp0)*lerp(bw*0.30, TIP_W*0.28, 0.70);
  const lc2y = c2y + Math.sin(perp0)*lerp(bw*0.30, TIP_W*0.28, 0.70);
  const rc1x = c1x - Math.cos(perp0)*lerp(bw*0.42, TIP_W*0.28, 0.35);
  const rc1y = c1y - Math.sin(perp0)*lerp(bw*0.42, TIP_W*0.28, 0.35);
  const rc2x = c2x - Math.cos(perp0)*lerp(bw*0.30, TIP_W*0.28, 0.70);
  const rc2y = c2y - Math.sin(perp0)*lerp(bw*0.30, TIP_W*0.28, 0.70);

  // Prevent "mid" from causing lint warning
  void mid;

  const filled =
    `M${f2(lbx)},${f2(lby)} ` +
    `C${f2(lc1x)},${f2(lc1y)} ${f2(lc2x)},${f2(lc2y)} ${f2(ltx)},${f2(lty)} ` +
    `L${f2(rtx)},${f2(rty)} ` +
    `C${f2(rc2x)},${f2(rc2y)} ${f2(rc1x)},${f2(rc1y)} ${f2(rbx)},${f2(rby)} Z`;

  const spine =
    `M${f2(slot.ox)},${f2(slot.oy)} C${f2(c1x)},${f2(c1y)} ${f2(c2x)},${f2(c2y)} ${f2(ex)},${f2(ey)}`;

  return { ox: slot.ox, oy: slot.oy, c1x, c1y, c2x, c2y, ex, ey, len, filled, spine };
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaf shape:  realistic pointed oval  +  midrib vein  +  side veins
// ─────────────────────────────────────────────────────────────────────────────
interface LeafPaths { outline: string; midrib: string; veinL: string; veinR: string; }

function leafPaths(cx: number, cy: number, w: number, h: number, rot: number): LeafPaths {
  const r = toRad(rot);
  const cs = Math.cos(r); const sn = Math.sin(r);
  const t = (lx: number, ly: number) => ({ x: cx + lx*cs - ly*sn, y: cy + lx*sn + ly*cs });

  // Outline: 5-point bezier leaf
  const P = [
    t(0,      0),           // base
    t(-w*0.9, -h*0.26),     // BL1
    t(-w*0.6, -h*0.72),     // BL2
    t(0,      -h),          // tip
    t( w*0.6, -h*0.72),     // BR1
    t( w*0.9, -h*0.26),     // BR2
  ];
  const outline =
    `M${f2(P[0].x)},${f2(P[0].y)} ` +
    `C${f2(P[1].x)},${f2(P[1].y)} ${f2(P[2].x)},${f2(P[2].y)} ${f2(P[3].x)},${f2(P[3].y)} ` +
    `C${f2(P[4].x)},${f2(P[4].y)} ${f2(P[5].x)},${f2(P[5].y)} ${f2(P[0].x)},${f2(P[0].y)} Z`;

  // Midrib: straight from base to tip
  const midrib = `M${f2(P[0].x)},${f2(P[0].y)} L${f2(P[3].x)},${f2(P[3].y)}`;

  // Side veins at 35 % and 65 % along midrib
  const m35 = t(0, -h*0.35); const m65 = t(0, -h*0.65);
  const veinL =
    `M${f2(m35.x)},${f2(m35.y)} Q${f2(t(-w*0.55,-h*0.50).x)},${f2(t(-w*0.55,-h*0.50).y)} ${f2(t(-w*0.72,-h*0.44).x)},${f2(t(-w*0.72,-h*0.44).y)} ` +
    `M${f2(m65.x)},${f2(m65.y)} Q${f2(t(-w*0.40,-h*0.78).x)},${f2(t(-w*0.40,-h*0.78).y)} ${f2(t(-w*0.52,-h*0.74).x)},${f2(t(-w*0.52,-h*0.74).y)}`;
  const veinR =
    `M${f2(m35.x)},${f2(m35.y)} Q${f2(t( w*0.55,-h*0.50).x)},${f2(t( w*0.55,-h*0.50).y)} ${f2(t( w*0.72,-h*0.44).x)},${f2(t( w*0.72,-h*0.44).y)} ` +
    `M${f2(m65.x)},${f2(m65.y)} Q${f2(t( w*0.40,-h*0.78).x)},${f2(t( w*0.40,-h*0.78).y)} ${f2(t( w*0.52,-h*0.74).x)},${f2(t( w*0.52,-h*0.74).y)}`;

  return { outline, midrib, veinL, veinR };
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaf cluster generation
// ─────────────────────────────────────────────────────────────────────────────
interface LeafDatum {
  x: number; y: number; w: number; h: number; rot: number;
  layer: 0 | 1 | 2;   // 0 = deep-back, 1 = mid, 2 = foreground
  shade: number;       // 0..1  → dark..light green
  yellow: boolean;
  opacity: number;
  delay: number;
  vein: boolean;       // show veins?
}

function genLeaves(teamId: string, slot: SlotDef, progress: number, overdue: number, geo: BranchGeo): LeafDatum[] {
  if (progress < 10) return [];
  const count = Math.round(((Math.min(progress, 97) - 10) / 87) * 64);
  const seed  = (teamId.charCodeAt(0)*11 + teamId.charCodeAt(teamId.length-1)*17) % 997;
  const out: LeafDatum[] = [];

  for (let i = 0; i < count; i++) {
    const ri  = ((seed*(i*31+7)*16807) % 10000) / 10000;
    const ri2 = ((seed*(i*19+3)*48271) % 10000) / 10000;
    const ri3 = ((seed*(i*13+5)*39119) % 10000) / 10000;

    // Place leaf along second half of branch, denser near tip
    const tMin = 0.42;
    const tVal = tMin + ri*(0.97 - tMin);
    const pt   = bzAt(tVal, geo.ox, geo.oy, geo.c1x, geo.c1y, geo.c2x, geo.c2y, geo.ex, geo.ey);

    // Tangent direction at this point on the branch
    const tanDeg  = bzTanDeg(tVal, geo.ox, geo.oy, geo.c1x, geo.c1y, geo.c2x, geo.c2y, geo.ex, geo.ey);
    const perpRad = toRad(tanDeg + 90);
    // Alternate sides: even = top-side, odd = bottom-side
    const side    = (i % 2 === 0) ? 1 : -1;
    // Leaf base sits close to the branch spine (2–8 px off)
    const baseOff = (2 + ri2 * 6) * side;
    const nx = pt.x + Math.cos(perpRad) * baseOff;
    const ny = pt.y + Math.sin(perpRad) * baseOff;

    // Leaf points outward from the branch at 40–75° from tangent
    const outAngle = tanDeg + side * (40 + ri3 * 35);
    const w     = 4.0 + ri2 * 4.5;
    const h     = w * (2.0 + ri3 * 0.6);
    const rot   = outAngle;
    const layer = (i % 3) as 0|1|2;

    out.push({
      x: nx, y: ny, w, h, rot, layer,
      shade:   ri3,
      yellow:  overdue > 0 && i % Math.ceil(11/Math.max(overdue,1)) === 0,
      opacity: 0.82 + ri2*0.16,
      delay:   i*0.030 + (seed%8)*0.022,
      vein:    layer === 2 && !(overdue > 0 && i%5===0),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blossom data
// ─────────────────────────────────────────────────────────────────────────────
interface BlossomDatum { x: number; y: number; scale: number; rot: number; delay: number; }

function genBlossoms(teamId: string, slot: SlotDef, progress: number, geo: BranchGeo): BlossomDatum[] {
  if (progress < 80 || progress >= 100) return [];
  const count = Math.min(7, Math.round(((progress-80)/20)*7)+1);
  const seed  = teamId.charCodeAt(0)*13;
  const perp  = toRad(slot.angle+90);
  return Array.from({ length: count }, (_, i) => {
    const t   = 0.68 + (i/Math.max(count-1,1))*0.30;
    const pt  = bzAt(t, geo.ox, geo.oy, geo.c1x, geo.c1y, geo.c2x, geo.c2y, geo.ex, geo.ey);
    const rng = ((seed*(i*23+7)*9999) % 10000)/10000;
    return {
      x:     pt.x + Math.cos(perp)*(rng*13-6.5),
      y:     pt.y + Math.sin(perp)*(rng*13-6.5) - 5,
      scale: 0.70 + rng*0.72,
      rot:   rng*360,
      delay: i*0.07,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-twigs at branch tip (thin finger-branches)
// ─────────────────────────────────────────────────────────────────────────────
interface TwigDatum { d: string; }

function genTwigs(slot: SlotDef, progress: number, geo: BranchGeo): TwigDatum[] {
  if (progress < 25) return [];
  const tipAng = bzTanDeg(1, geo.ox, geo.oy, geo.c1x, geo.c1y, geo.c2x, geo.c2y, geo.ex, geo.ey);
  const tLen   = 14 + (progress/100)*22;
  const spread = [22, -18, 35, -34];
  return spread.slice(0, progress >= 50 ? 4 : 2).map((offset) => {
    const ang = toRad(tipAng + offset);
    const sag = tLen * 0.20;
    const ex2 = geo.ex + Math.cos(ang)*tLen;
    const ey2 = geo.ey + Math.sin(ang)*tLen + sag;
    const cx1 = geo.ex + Math.cos(ang)*tLen*0.40;
    const cy1 = geo.ey + Math.sin(ang)*tLen*0.40 + sag*0.3;
    const cx2 = geo.ex + Math.cos(ang)*tLen*0.75;
    const cy2 = geo.ey + Math.sin(ang)*tLen*0.75 + sag*0.8;
    return { d: `M${f2(geo.ex)},${f2(geo.ey)} C${f2(cx1)},${f2(cy1)} ${f2(cx2)},${f2(cy2)} ${f2(ex2)},${f2(ey2)}` };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI / health helpers
// ─────────────────────────────────────────────────────────────────────────────
function kpiStatus(pct: number): "on-track"|"behind"|"critical" {
  const r = EXPECTED > 0 ? pct/EXPECTED : 1;
  return r >= 0.80 ? "on-track" : r >= 0.50 ? "behind" : "critical";
}
function healthLabel(pct: number) {
  const r = pct/EXPECTED;
  return r >= 0.80 ? { icon:"🟢", text:"Đúng tiến độ", color:"#10b981" }
    :    r >= 0.50 ? { icon:"🟡", text:"Hơi chậm",     color:"#f59e0b" }
    :                { icon:"🔴", text:"Nguy hiểm",    color:"#ef4444" };
}
function growthLabel(p: number) {
  if (p >= 100) return "🎉 Đơm quả";
  if (p >= 80)  return "🌸 Ra hoa";
  if (p >= 50)  return "🌿 Xum xuê";
  if (p >= 20)  return "🌱 Đang mọc";
  return "🪵 Khô";
}

// ─────────────────────────────────────────────────────────────────────────────
// Blossom component  –  5 gradient petals + stamens
// ─────────────────────────────────────────────────────────────────────────────
function BlossomGroup({ b, dark, uid }: { b: BlossomDatum; dark: boolean; uid: string }) {
  const gradId = `bpg-${uid}`;
  const hPetal = 9.5 * b.scale;
  const wPetal = 5.0 * b.scale;

  function petal(rotDeg: number) {
    const a = toRad(rotDeg + b.rot);
    const cs = Math.cos(a); const sn = Math.sin(a);
    const P = [
      { x: b.x,                              y: b.y },
      { x: b.x + cs*wPetal*0.55 - sn*hPetal*0.22, y: b.y + sn*wPetal*0.55 + cs*hPetal*0.22 },
      { x: b.x + cs*wPetal*0.45 - sn*hPetal*0.80, y: b.y + sn*wPetal*0.45 + cs*hPetal*0.80 },
      { x: b.x                   - sn*hPetal*1.12, y: b.y                   + cs*hPetal*1.12 },
      { x: b.x - cs*wPetal*0.45 - sn*hPetal*0.80, y: b.y - sn*wPetal*0.45 + cs*hPetal*0.80 },
      { x: b.x - cs*wPetal*0.55 - sn*hPetal*0.22, y: b.y - sn*wPetal*0.55 + cs*hPetal*0.22 },
    ];
    return (
      `M${f2(P[0].x)},${f2(P[0].y)} ` +
      `C${f2(P[1].x)},${f2(P[1].y)} ${f2(P[2].x)},${f2(P[2].y)} ${f2(P[3].x)},${f2(P[3].y)} ` +
      `C${f2(P[4].x)},${f2(P[4].y)} ${f2(P[5].x)},${f2(P[5].y)} ${f2(P[0].x)},${f2(P[0].y)} Z`
    );
  }

  return (
    <g className="blossom-pop" style={{ animationDelay:`${b.delay}s` }}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="85%" r="75%">
          <stop offset="0%"   stopColor={dark ? "#ffe4e6" : "#fff1f2"} />
          <stop offset="55%"  stopColor={dark ? "#fda4af" : "#fecdd3"} />
          <stop offset="100%" stopColor={dark ? "#f43f5e" : "#fb7185"} />
        </radialGradient>
      </defs>
      {/* petals back-layer (slightly offset for depth) */}
      {[36, 108, 180, 252, 324].map((deg) => (
        <path key={`pb${deg}`} d={petal(deg)} fill={`url(#${gradId})`} opacity="0.55" transform={`translate(0.6,1.2)`} />
      ))}
      {/* petals front */}
      {[0, 72, 144, 216, 288].map((deg) => (
        <path key={`pf${deg}`} d={petal(deg)} fill={`url(#${gradId})`}
          stroke={dark ? "rgba(244,63,94,0.30)" : "rgba(251,113,133,0.35)"} strokeWidth="0.4"
          opacity="0.92" />
      ))}
      {/* stamens */}
      {[0,45,90,135,180,225,270,315].map((deg) => (
        <circle key={deg}
          cx={b.x + Math.cos(toRad(deg+b.rot))*(3.8*b.scale)}
          cy={b.y + Math.sin(toRad(deg+b.rot))*(3.8*b.scale)}
          r={0.9*b.scale} fill={dark ? "#fde68a" : "#fbbf24"} opacity="0.95" />
      ))}
      {/* centre disc */}
      <circle cx={b.x} cy={b.y} r={2.8*b.scale} fill={dark?"#fde68a":"#fef08a"} />
      <circle cx={b.x-0.6*b.scale} cy={b.y-0.6*b.scale} r={1.0*b.scale} fill="rgba(255,255,255,0.55)" />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fruit component  –  realistic apple with gradient, highlight, dimple
// ─────────────────────────────────────────────────────────────────────────────
function FruitGroup({ geo, teamId, color, dark }: { geo: BranchGeo; teamId: string; color: string; dark: boolean }) {
  const gid  = `fg-${teamId}`;
  const hgid = `fh-${teamId}`;
  const fx = geo.ex, fy = geo.ey - 10, r = 9;
  const rnSeed = teamId.charCodeAt(0);
  const wobb   = (rnSeed % 4) - 1.5;  // slight x-offset variety

  return (
    <g>
      <defs>
        {/* Main fruit colour – radial, brighter at top-left */}
        <radialGradient id={gid} cx="35%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.50" />
          <stop offset="30%"  stopColor={color}   stopOpacity="0.95" />
          <stop offset="100%" stopColor={color}   stopOpacity="0.55" />
        </radialGradient>
        {/* Rim darkening gradient */}
        <radialGradient id={hgid} cx="50%" cy="50%" r="50%">
          <stop offset="70%"  stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
        </radialGradient>
      </defs>

      {/* Ground/branch shadow */}
      <ellipse cx={fx + wobb*0.5 + 1} cy={fy + r + 5} rx={r*0.65} ry={3.5} fill="rgba(0,0,0,0.18)" />

      {/* Fruit body */}
      <circle cx={fx + wobb*0.3} cy={fy} r={r} fill={`url(#${gid})`} />
      {/* Rim darkening */}
      <circle cx={fx + wobb*0.3} cy={fy} r={r} fill={`url(#${hgid})`} />

      {/* Top dimple */}
      <path
        d={`M${f2(fx+wobb*0.3-2.5)},${f2(fy-r+1.8)} Q${f2(fx+wobb*0.3)},${f2(fy-r-2.5)} ${f2(fx+wobb*0.3+2.5)},${f2(fy-r+1.8)}`}
        fill="none" stroke={dark?"rgba(0,0,0,0.35)":"rgba(0,0,0,0.25)"} strokeWidth="1.4" strokeLinecap="round"
      />

      {/* Primary specular highlight */}
      <ellipse
        cx={fx+wobb*0.3-3.2} cy={fy-3.4}
        rx={3.8} ry={2.3}
        fill="white" opacity="0.62"
        transform={`rotate(-30,${fx+wobb*0.3-3.2},${fy-3.4})`}
      />
      {/* Secondary small highlight */}
      <circle cx={fx+wobb*0.3+2.8} cy={fy-5.2} r={1.3} fill="white" opacity="0.38" />

      {/* Stem – curved bezier */}
      <path
        d={`M${f2(fx+wobb*0.3+0.5)},${f2(fy-r+0.5)} C${f2(fx+wobb*0.3+3)},${f2(fy-r-5)} ${f2(fx+wobb*0.3+5)},${f2(fy-r-9)} ${f2(fx+wobb*0.3+3.5)},${f2(fy-r-14)}`}
        stroke={dark?"#365314":"#3f6212"} strokeWidth="1.8" fill="none" strokeLinecap="round"
      />

      {/* Stem leaf */}
      <path
        d={leafPaths(fx+wobb*0.3+6.5, fy-r-10, 4.8, 9, -42).outline}
        fill={dark?"#4ade80":"#16a34a"} opacity="0.90"
      />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trunk  –  filled silhouette with gradient, grain lines, highlight
// ─────────────────────────────────────────────────────────────────────────────
function TrunkShape({ dark }: { dark: boolean }) {
  const L = (cx: number, hw: number, dy: number) => `${f2(cx-hw)},${f2(dy)}`;
  const R = (cx: number, hw: number, dy: number) => `${f2(cx+hw)},${f2(dy)}`;

  // Taller trunk: crown y=138, base y=610
  // Width: crown‑cap 8px half‑width, base 32px half‑width (tapers with S‑curve)
  const leftPath =
    `M${L(450,8,138)} ` +
    `C${L(448,8.5,158)} ${L(446,9.2,178)} ${L(445,10,200)} ` +
    `C${L(443,11.5,232)} ${L(441,13,268)} ${L(440,14.5,308)} ` +
    `C${L(440,16,348)} ${L(440,17.8,392)} ${L(440,19.5,436)} ` +
    `C${L(441,22,482)} ${L(444,27,546)} ${L(450,32,610)}`;
  const rightPath =
    `L${R(450,32,610)} ` +
    `C${R(444,27,546)} ${R(441,22,482)} ${R(440,19.5,436)} ` +
    `C${R(440,17.8,392)} ${R(440,16,348)} ${R(440,14.5,308)} ` +
    `C${R(441,13,268)} ${R(443,11.5,232)} ${R(445,10,200)} ` +
    `C${R(446,9.2,178)} ${R(448,8.5,158)} ${R(450,8,138)} Z`;
  const fullPath = leftPath + rightPath;

  const grainRows: [number, number, number][] = [
    [168,-2,5.5],[195,+2,6.2],[224,-1,7.0],[256,+1,7.8],
    [290,-2,8.8],[326,+2,9.8],[364, 0,11.0],[404,-1,12.2],
    [444,+2,13.5],[488, 0,15.0],[534,-2,17.0],[576,+1,19.2],
  ];

  return (
    <g>
      <path d={fullPath} fill="rgba(0,0,0,0.30)" transform="translate(7,8)" />
      <path d={fullPath} fill="url(#trunkGrad)" />
      <path
        d={`M${R(450,8,138)} C${R(448,8.5,158)} ${R(446,9.2,178)} ${R(445,10,200)} C${R(443,11.5,232)} ${R(441,13,268)} ${R(440,14.5,308)} C${R(440,16,348)} ${R(440,17.8,392)} ${R(440,19.5,436)} C${R(441,22,482)} ${R(444,27,546)} ${R(450,32,610)}`}
        fill="none" stroke={dark?"rgba(0,0,0,0.44)":"rgba(0,0,0,0.30)"} strokeWidth="14" strokeLinecap="round"
      />
      <path
        d={`M${f2(434)},142 C${f2(432)},170 ${f2(429)},200 ${f2(428)},232 C${f2(427)},275 ${f2(427)},320 ${f2(428)},365`}
        fill="none" stroke={dark?"rgba(255,200,130,0.22)":"rgba(255,228,170,0.38)"}
        strokeWidth="6" strokeLinecap="round"
      />
      {grainRows.map(([cy, offX, rx], i) => (
        <g key={i}>
          <ellipse cx={445+offX} cy={cy} rx={rx} ry={2.2}
            fill="none" stroke={dark?"rgba(0,0,0,0.26)":"rgba(0,0,0,0.13)"} strokeWidth="1.0" />
          <path
            d={`M${f2(445+offX-rx*0.6)},${f2(cy-0.6)} Q${f2(445+offX)},${f2(cy-2.5)} ${f2(445+offX+rx*0.6)},${f2(cy-0.6)}`}
            fill="none" stroke={dark?"rgba(255,190,110,0.11)":"rgba(255,225,160,0.22)"} strokeWidth="1.0"
          />
        </g>
      ))}
      <ellipse cx={450} cy={138} rx={8} ry={4}
        fill="url(#trunkGrad)" stroke={dark?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.18)"} strokeWidth="0.8" />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Roots
// ─────────────────────────────────────────────────────────────────────────────
// Tapered filled root shape: wide at trunk base, tapers to a thin tip
function rootPath(x0: number, y0: number, cpx1: number, cpy1: number, cpx2: number, cpy2: number, x1: number, y1: number, hw0: number): string {
  // perpendicular to starting direction
  const dx = cpx1 - x0; const dy = cpy1 - y0;
  const len = Math.sqrt(dx*dx+dy*dy) || 1;
  const px = -dy/len; const py = dx/len;
  // perpendicular to ending direction
  const dx2 = x1 - cpx2; const dy2 = y1 - cpy2;
  const len2 = Math.sqrt(dx2*dx2+dy2*dy2) || 1;
  const px2 = -dy2/len2; const py2 = dx2/len2;
  const hw1 = 0.8; // tip half-width
  return (
    `M${f2(x0+px*hw0)},${f2(y0+py*hw0)} ` +
    `C${f2(cpx1+px*hw0*0.7)},${f2(cpy1+py*hw0*0.7)} ${f2(cpx2+px2*hw1*0.7)},${f2(cpy2+py2*hw1*0.7)} ${f2(x1+px2*hw1)},${f2(y1+py2*hw1)} ` +
    `L${f2(x1-px2*hw1)},${f2(y1-py2*hw1)} ` +
    `C${f2(cpx2-px2*hw1*0.7)},${f2(cpy2-py2*hw1*0.7)} ${f2(cpx1-px*hw0*0.7)},${f2(cpy1-py*hw0*0.7)} ${f2(x0-px*hw0)},${f2(y0-py*hw0)} Z`
  );
}

function Roots({ dark }: { dark: boolean }) {
  const fill  = dark ? "#3d1c08" : "#4a2010";
  const hi    = dark ? "rgba(255,200,130,0.16)" : "rgba(255,220,160,0.22)";
  const shad  = "rgba(0,0,0,0.22)";
  // [x0,y0, cp1x,cp1y, cp2x,cp2y, x1,y1, hw0]  – long graceful curves
  const roots: [number,number,number,number,number,number,number,number,number][] = [
    [448,608,  418,628,  390,638,  362,634,  11],   // far left
    [449,610,  432,630,  416,648,  408,662,   8],   // mid left
    [450,610,  434,636,  418,658,  414,675,   6],   // inner left
    [451,608,  472,628,  492,638,  518,634,  10],   // far right
    [452,611,  462,634,  472,652,  476,668,   7],   // mid right
    [451,610,  460,638,  468,660,  466,676,   5],   // inner right
  ];
  return (
    <g>
      {roots.map(([x0,y0,cp1x,cp1y,cp2x,cp2y,x1,y1,hw0], i) => {
        const d = rootPath(x0,y0,cp1x,cp1y,cp2x,cp2y,x1,y1,hw0);
        return (
          <g key={i}>
            {/* drop shadow */}
            <path d={d} fill={shad} transform="translate(3,4)" opacity="0.35" />
            {/* body */}
            <path d={d} fill={fill} />
            {/* left-edge highlight */}
            <path
              d={`M${f2(x0)},${f2(y0)} C${f2(cp1x-2)},${f2(cp1y)} ${f2(cp2x-2)},${f2(cp2y)} ${f2(x1)},${f2(y1)}`}
              fill="none" stroke={hi} strokeWidth="1.4" strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function EcosystemTree() {
  const router = useRouter();
  const { teams, getTeamProgress, getTeamStats, getTeamActivity, getTeamTasks } = useApp();

  const [mounted,  setMounted]  = useState(false);
  const [hovered,  setHovered]  = useState<string|null>(null);
  const [selected, setSelected] = useState<string|null>(null);
  const [dark,     setDark]     = useState(false);

  // Only render SVG on client to avoid SSR/CSR float-precision hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Sort by progress descending → slot 0 (top) = best team
  const teamData = useMemo(() =>
    teams
      .filter(t => DEPT_COLORS[t.id] !== undefined)
      .map(t => ({
        ...t,
        progress: getTeamProgress(t.id),
        stats:    getTeamStats(t.id),
        kpi:      kpiStatus(getTeamProgress(t.id)),
        color:    DEPT_COLORS[t.id] ?? t.color,
      }))
      .sort((a, b) => b.progress - a.progress)
      .map((t, i) => ({ ...t, slotIdx: i })),
    [teams, getTeamProgress, getTeamStats]
  );

  const ecosystem = useMemo(() => {
    if (!teamData.length) return 0;
    return Math.round(teamData.reduce((s, t) => s + t.progress, 0) / teamData.length);
  }, [teamData]);

  const selectedTeam  = useMemo(() => selected ? teamData.find(t => t.id === selected) ?? null : null, [selected, teamData]);
  const selectedTasks = selected ? getTeamTasks(selected)    : [];
  const selectedLog   = selected ? getTeamActivity(selected) : [];
  const closePanel    = useCallback(() => setSelected(null), []);

  // Colour palette
  const bg       = dark ? "#080f1a" : "#F2F8FF";
  const bg2      = dark ? "#0d1d36" : "#E4F2FF";
  const panelBg  = dark ? "#0e1c34" : "#ffffff";
  const textMain = dark ? "#f1f5f9" : "#0f172a";
  const textSub  = dark ? "#94a3b8" : "#64748b";
  const panelWidth = selected ? 322 : 0;

  // Leaf colour tones
  const leafColors = {
    back:       dark ? "#14532d" : "#166534",
    mid:        dark ? "#15803d" : "#15803d",
    bright:     dark ? "#22c55e" : "#16a34a",
    highlight:  dark ? "#4ade80" : "#22c55e",
    yellowDark: dark ? "#854d0e" : "#713f12",
    yellow:     dark ? "#ca8a04" : "#d97706",
    yellowBright: dark ? "#facc15" : "#f59e0b",
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ background:`linear-gradient(170deg,${bg} 0%,${bg2} 100%)`, border:`1px solid ${dark?"#1a3660":"#c7dff5"}` }}>

      {/* ── Animations ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes gentle-sway {
          0%,100% { transform:rotate(-0.26deg) translateX(-0.4px); }
          50%      { transform:rotate( 0.26deg) translateX( 0.4px); }
        }
        @keyframes leaf-emerge {
          0%   { opacity:0; transform:scale(0.08) rotate(25deg); }
          60%  { opacity:.9; }
          100% { opacity:1; transform:scale(1)    rotate(0deg); }
        }
        @keyframes blossom-open {
          0%   { opacity:0; transform:scale(0) rotate(-20deg); }
          70%  { opacity:.95; }
          100% { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes fruit-ripen {
          0%   { opacity:0; transform:scale(0.15); }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes health-breathe {
          0%,100% { opacity:.38; }
          50%      { opacity:.72; }
        }
        @keyframes sun-pulse {
          0%,100% { opacity:.28; }
          50%      { opacity:.46; }
        }
        .tree-sway    { animation: gentle-sway  7.5s ease-in-out infinite; transform-origin:450px 610px; }
        .leaf-pop     { animation: leaf-emerge  0.55s ease-out     forwards; }
        .blossom-pop  { animation: blossom-open 0.68s ease-out     forwards; }
        .fruit-pop    { animation: fruit-ripen  0.80s ease-out     forwards; }
        .health-ring  { animation: health-breathe 3.6s ease-in-out infinite; }
        .sun-glow     { animation: sun-pulse   5.0s ease-in-out infinite; }
      `}</style>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom:`1px solid ${dark?"#1a3660":"#c7dff5"}`,
                 background: dark?"rgba(8,15,26,0.78)":"rgba(255,255,255,0.72)", backdropFilter:"blur(10px)" }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color:textMain }}>🌳 Ecosystem Growth Tree</span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
            style={{
              background: ecosystem>=70?(dark?"#052e16":"#dcfce7"):ecosystem>=40?(dark?"#1c1003":"#fef9c3"):(dark?"#1f0000":"#fee2e2"),
              color:      ecosystem>=70?"#16a34a":ecosystem>=40?"#d97706":"#dc2626",
            }}>
            Sức khỏe: {ecosystem}% · Kỳ vọng {EXPECTED}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-[10px] mr-2" style={{ color:textSub }}>
            {[["🪵","0–20%"],["🌱","20–50%"],["🌿","50–80%"],["🌸","80–99%"],["🎉","100%"]].map(([icon,lbl])=>(
              <span key={lbl} className="flex items-center gap-0.5">{icon} <span>{lbl}</span></span>
            ))}
          </div>
          <button onClick={()=>setDark(!dark)}
            className="text-[11px] px-3 py-1 rounded-lg font-medium transition-colors"
            style={{ background:dark?"#1a3660":"#f1f5f9", color:dark?"#e2e8f0":"#475569" }}>
            {dark?"☀ Sáng":"🌙 Tối"}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex" style={{ height:680 }}>
        <div className="flex-1 relative overflow-hidden">
          {!mounted && <div style={{ width:"100%", height:680 }} />}
          {mounted && <svg viewBox="90 -120 720 820" style={{ width:"100%", height:"100%", userSelect:"none" }}>
            <defs>
              {/* Sky gradient */}
              <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={dark?"#0d2d55":"#bae6fd"} stopOpacity="0.55"/>
                <stop offset="100%" stopColor={dark?"#080f1a":"#F2F8FF"} stopOpacity="0"/>
              </linearGradient>

              {/* Sun glow (upper-left light source) */}
              <radialGradient id="sunGlow" cx="18%" cy="8%" r="40%">
                <stop offset="0%"   stopColor={dark?"#c084fc":"#fef9c3"} stopOpacity={dark?0.18:0.42}/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>

              {/* Trunk 5-stop gradient */}
              <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={dark?"#0f0500":"#1a0800"}/>
                <stop offset="22%"  stopColor={dark?"#5c2708":"#4a2010"}/>
                <stop offset="50%"  stopColor={dark?"#8a5230":"#7a4e2e"}/>
                <stop offset="78%"  stopColor={dark?"#7a4220":"#6b3c1a"}/>
                <stop offset="100%" stopColor={dark?"#3d1a05":"#2e1207"}/>
              </linearGradient>

              {/* Ground shadow */}
              <radialGradient id="groundG" cx="50%" cy="100%" r="22%">
                <stop offset="0%"   stopColor="rgba(0,0,0,0.25)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>

              {/* Ground grass gradient */}
              <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={dark?"#14532d":"#d1fae5"}/>
                <stop offset="40%" stopColor={dark?"#052e16":"#a7f3d0"}/>
                <stop offset="100%"stopColor={dark?"#021d0e":"#6ee7b7"}/>
              </linearGradient>

              {/* Distant hill gradient */}
              <linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={dark?"#1e3a5f":"#bfdbfe"} stopOpacity="0.60"/>
                <stop offset="100%"stopColor={dark?"#0d2137":"#93c5fd"} stopOpacity="0.25"/>
              </linearGradient>

              {/* Plot slot marker gradient */}
              <radialGradient id="plotG" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={dark?"rgba(99,102,241,0.18)":"rgba(199,210,254,0.55)"}/>
                <stop offset="100%" stopColor={dark?"rgba(99,102,241,0.02)":"rgba(199,210,254,0.08)"}/>
              </radialGradient>

              {/* Upcoming seed glow */}
              <radialGradient id="seedGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={dark?"rgba(251,191,36,0.55)":"rgba(253,224,71,0.70)"}/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>

              {/* Cloud blur */}
              <filter id="cloudF" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4"/>
              </filter>

              {/* Bloom filter for back leaves (atmospheric blur) */}
              <filter id="leafBack" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.2"/>
              </filter>

              {/* Soft glow for highlighted elements */}
              <filter id="softGlowF" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>

              {/* Health ring glow */}
              <filter id="ringGlowF" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="14" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>

              {/* Per-team branch selection glow */}
              {teamData.map(t=>(
                <filter key={t.id} id={`tg-${t.id}`} x="-45%" y="-45%" width="190%" height="190%">
                  <feGaussianBlur stdDeviation="7" result="b"/>
                  <feFlood floodColor={t.color} floodOpacity="0.28" result="c"/>
                  <feComposite in="c" in2="b" operator="in" result="gc"/>
                  <feMerge><feMergeNode in="gc"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              ))}
            </defs>

            {/* Sky */}
            <rect x="90" y="-120" width="720" height="820" fill="url(#skyG)"/>
            {/* Sun ambient light */}
            <rect x="90" y="-120" width="720" height="820" fill="url(#sunGlow)" className="sun-glow"/>

            {/* ── Distant hills (atmospheric depth) ───────────────────── */}
            <path d="M90,580 C140,535 200,520 280,530 C340,538 380,515 450,510 C520,505 580,525 640,530 C700,535 760,520 810,530 L810,700 L90,700 Z"
              fill="url(#hillG)" opacity="0.45"/>
            <path d="M90,600 C150,565 230,555 320,560 C390,564 430,548 500,545 C560,542 620,558 680,560 C730,562 780,550 810,555 L810,700 L90,700 Z"
              fill="url(#hillG)" opacity="0.30"/>

            {/* ── Ground plane ─────────────────────────────────────────── */}
            <path d="M90,628 C180,622 280,618 370,620 C400,621 420,622 450,622 C480,622 500,621 530,620 C620,618 720,622 810,628 L810,720 L90,720 Z"
              fill="url(#grassG)" opacity="0.82"/>

            {/* ── Clouds ───────────────────────────────────────────────── */}
            {/* cloud 1 – far left */}
            <g filter="url(#cloudF)" opacity={dark?0.22:0.70}>
              <ellipse cx={165} cy={-18} rx={52} ry={18} fill={dark?"#1e3a5f":"#ffffff"}/>
              <ellipse cx={195} cy={-28} rx={36} ry={22} fill={dark?"#1e3a5f":"#ffffff"}/>
              <ellipse cx={140} cy={-22} rx={28} ry={14} fill={dark?"#1e3a5f":"#ffffff"}/>
            </g>
            {/* cloud 2 – upper right */}
            <g filter="url(#cloudF)" opacity={dark?0.18:0.60}>
              <ellipse cx={680} cy={-55} rx={62} ry={20} fill={dark?"#1e3a5f":"#ffffff"}/>
              <ellipse cx={710} cy={-68} rx={44} ry={26} fill={dark?"#1e3a5f":"#ffffff"}/>
              <ellipse cx={655} cy={-60} rx={32} ry={16} fill={dark?"#1e3a5f":"#ffffff"}/>
            </g>
            {/* cloud 3 – mid right, smaller */}
            <g filter="url(#cloudF)" opacity={dark?0.14:0.45}>
              <ellipse cx={740} cy={38} rx={40} ry={14} fill={dark?"#1e3a5f":"#ffffff"}/>
              <ellipse cx={762} cy={30} rx={28} ry={17} fill={dark?"#1e3a5f":"#ffffff"}/>
            </g>

            {/* ── Birds (tiny V shapes drifting top-right) ─────────────── */}
            {[[615,-82,8],[642,-68,6],[628,-58,7],[660,-90,5],[598,-70,4]].map(([bx,by,sz],i)=>(
              <path key={i} d={`M${bx},${by} Q${bx+sz/2},${by-sz*0.6} ${bx+sz},${by} M${bx+sz},${by} Q${bx+sz*1.5},${by-sz*0.6} ${bx+sz*2},${by}`}
                fill="none" stroke={dark?"rgba(148,163,184,0.45)":"rgba(100,140,180,0.45)"} strokeWidth="1.4" strokeLinecap="round"/>
            ))}

            {/* ── Grass tufts around base ───────────────────────────────── */}
            {[
              [318,624],[348,626],[374,627],[524,627],[558,626],[588,624],
              [280,630],[600,630],[248,635],[636,635],[220,640],[665,640],
              [158,645],[720,645],[128,648],[758,648],
            ].map(([gx,gy],i)=>{
              const h = 6+((i*7)%6); const lh = h*0.65;
              return (
                <g key={i} opacity={dark?0.55:0.80}>
                  <path d={`M${gx},${gy} Q${gx-3},${gy-h} ${gx-1},${gy-h*1.1}`}   fill="none" stroke={dark?"#14532d":"#16a34a"} strokeWidth="1.6" strokeLinecap="round"/>
                  <path d={`M${gx},${gy} Q${gx},${gy-h*1.15} ${gx+1},${gy-h*1.2}`} fill="none" stroke={dark?"#15803d":"#22c55e"} strokeWidth="1.8" strokeLinecap="round"/>
                  <path d={`M${gx},${gy} Q${gx+3},${gy-lh} ${gx+4},${gy-lh*1.05}`} fill="none" stroke={dark?"#14532d":"#16a34a"} strokeWidth="1.4" strokeLinecap="round"/>
                </g>
              );
            })}

            {/* ── Empty plot slots (available positions / empty shares) ─── */}
            {[
              { cx:168, cy:648, label:"Cổ phần trống", sub:"Chưa phân bổ" },
              { cx:736, cy:648, label:"Cổ phần trống", sub:"Chưa phân bổ" },
              { cx:130, cy:595, label:"Vị trí mới",    sub:"Đang tuyển"   },
              { cx:775, cy:595, label:"Vị trí mới",    sub:"Đang tuyển"   },
            ].map((p,i)=>(
              <g key={i}>
                {/* glow pad */}
                <ellipse cx={p.cx} cy={p.cy+2} rx={26} ry={10} fill="url(#plotG)"/>
                {/* dashed circle */}
                <circle cx={p.cx} cy={p.cy-14} r={20}
                  fill={dark?"rgba(30,58,95,0.30)":"rgba(224,242,254,0.60)"}
                  stroke={dark?"rgba(99,102,241,0.45)":"rgba(99,102,241,0.50)"}
                  strokeWidth="1.4" strokeDasharray="4 3"/>
                {/* plus icon */}
                <line x1={p.cx} y1={p.cy-22} x2={p.cx} y2={p.cy-6} stroke={dark?"rgba(99,102,241,0.70)":"rgba(99,102,241,0.80)"} strokeWidth="1.6" strokeLinecap="round"/>
                <line x1={p.cx-8} y1={p.cy-14} x2={p.cx+8} y2={p.cy-14} stroke={dark?"rgba(99,102,241,0.70)":"rgba(99,102,241,0.80)"} strokeWidth="1.6" strokeLinecap="round"/>
                {/* label */}
                <text x={p.cx} y={p.cy+6}  textAnchor="middle" fontSize="7.5" fontWeight="700" fill={dark?"rgba(148,163,184,0.75)":"rgba(71,85,105,0.85)"}>{p.label}</text>
                <text x={p.cx} y={p.cy+15} textAnchor="middle" fontSize="6.8" fill={dark?"rgba(148,163,184,0.55)":"rgba(100,116,139,0.75)"}>{p.sub}</text>
              </g>
            ))}

            {/* ── Upcoming project seeds / sprouts ─────────────────────── */}
            {[
              { cx:220, cy:605, name:"Q2 Launch",    color:"#8b5cf6", icon:"🚀" },
              { cx:688, cy:610, name:"New Market",   color:"#10b981", icon:"🌱" },
              { cx:156, cy:572, name:"AI Feature",   color:"#3b82f6", icon:"⚡" },
              { cx:752, cy:568, name:"Partnership",  color:"#f59e0b", icon:"🤝" },
            ].map((s,i)=>(
              <g key={i}>
                {/* glow halo */}
                <circle cx={s.cx} cy={s.cy-8} r={18} fill="url(#seedGlow)" opacity="0.70"/>
                {/* stem */}
                <line x1={s.cx} y1={s.cy} x2={s.cx} y2={s.cy-16} stroke={dark?"#15803d":"#16a34a"} strokeWidth="1.8" strokeLinecap="round"/>
                {/* seed bulb */}
                <ellipse cx={s.cx} cy={s.cy-20} rx={10} ry={12}
                  fill={s.color} opacity={dark?0.80:0.75}/>
                <ellipse cx={s.cx-2.5} cy={s.cy-24} rx={3.5} ry={2.5}
                  fill="rgba(255,255,255,0.38)"/>
                {/* tiny leaf */}
                <path d={`M${s.cx},${s.cy-14} Q${s.cx+10},${s.cy-22} ${s.cx+8},${s.cy-28}`}
                  fill={dark?"#4ade80":"#22c55e"} opacity="0.90"/>
                {/* name badge */}
                <rect x={s.cx-24} y={s.cy-50} width={48} height={20} rx={5}
                  fill={dark?"rgba(8,15,26,0.82)":"rgba(255,255,255,0.88)"}
                  stroke={s.color} strokeWidth="1.0"
                  style={{ filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.15))" }}/>
                <text x={s.cx} y={s.cy-37} textAnchor="middle" fontSize="7.5" fontWeight="700"
                  fill={dark?"#e2e8f0":"#1e293b"}>{s.icon} {s.name}</text>
              </g>
            ))}

            {/* Ground ellipse */}
            <ellipse cx={450} cy={660} rx={120} ry={14} fill="url(#groundG)"/>

            {/* ── Ecosystem aura ring – ground halo under roots ── */}
            <g className="health-ring" filter="url(#ringGlowF)" opacity="0.60">
              <ellipse cx={450} cy={648} rx={130} ry={30}
                fill="none"
                stroke={dark?"rgba(99,102,241,0.30)":"rgba(99,102,241,0.22)"}
                strokeWidth={2.5}/>
            </g>
            <text x={450} y={672} textAnchor="middle" fontSize="10" letterSpacing="1.5" fontWeight="600"
              fill={dark?"rgba(148,163,184,0.32)":"rgba(99,102,241,0.28)"}>ECOSYSTEM · {ecosystem}%</text>

            {/* ── Sway group ────────────────────────────────────────────── */}
            <g className="tree-sway">

              {/* PASS 1: Deep-back leaves (atmospheric blur, darkest) */}
              {teamData.map(td=>{
                const slot=SLOTS[td.slotIdx]; if(!slot) return null;
                const geo    = branchGeometry(slot,td.progress);
                const leaves = genLeaves(td.id,slot,td.progress,td.stats.overdue,geo);
                return (
                  <g key={`bk-${td.id}`} filter="url(#leafBack)">
                    {leaves.filter(lf=>lf.layer===0).map((lf,i)=>{
                      const lp  = leafPaths(lf.x,lf.y,lf.w*0.85,lf.h*0.85,lf.rot);
                      const col = lf.yellow ? leafColors.yellowDark : leafColors.back;
                      return (
                        <path key={i} d={lp.outline}
                          fill={col} opacity={clamp(lf.opacity*0.48,0,1)}/>
                      );
                    })}
                  </g>
                );
              })}

              {/* PASS 2: Mid-depth leaves + branches + blossoms + fruit */}
              {teamData.map(td=>{
                const slot=SLOTS[td.slotIdx]; if(!slot) return null;
                const geo      = branchGeometry(slot,td.progress);
                const leaves   = genLeaves(td.id,slot,td.progress,td.stats.overdue,geo);
                const blossoms = genBlossoms(td.id,slot,td.progress,geo);
                const twigs    = genTwigs(slot,td.progress,geo);
                const isHov    = hovered===td.id;
                const isSel    = selected===td.id;
                const isActive = isHov||isSel;
                const bOpacity = td.kpi==="critical"?0.50:td.kpi==="behind"?0.74:1.0;

                return (
                  <g key={td.id} opacity={bOpacity} style={{ cursor:"pointer" }}
                    onMouseEnter={()=>setHovered(td.id)}
                    onMouseLeave={()=>setHovered(null)}
                    onClick={()=>setSelected(selected===td.id?null:td.id)}>

                    {/* Invisible hit-area — wide transparent stroke along spine so the
                        entire branch length is easy to click, not just the thin visual */}
                    <path d={geo.spine} fill="none" stroke="rgba(0,0,0,0)" strokeWidth="48"
                      strokeLinecap="round" style={{ pointerEvents:"stroke" }}/>

                    {/* Active selection aura */}
                    {isActive && (
                      <path d={geo.filled} fill={td.color}
                        filter={`url(#tg-${td.id})`} opacity="0.28"
                        transform={`translate(0,2)`}/>
                    )}

                    {/* Mid leaves (layer 1) */}
                    {leaves.filter(lf=>lf.layer===1).map((lf,i)=>{
                      const lp  = leafPaths(lf.x,lf.y,lf.w,lf.h,lf.rot);
                      const col = lf.yellow
                        ? (lf.shade>0.5?leafColors.yellowBright:leafColors.yellow)
                        : (lf.shade>0.6?leafColors.bright:leafColors.mid);
                      return (
                        <g key={i} className="leaf-pop" style={{ animationDelay:`${lf.delay}s` }}>
                          <path d={lp.outline} fill={col} opacity={lf.opacity*0.88}/>
                          {lf.vein && <path d={lp.midrib} stroke="rgba(0,0,0,0.16)" strokeWidth="0.6" fill="none"/>}
                        </g>
                      );
                    })}

                    {/* Branch shadow */}
                    <path d={geo.filled} fill={dark?"rgba(0,0,0,0.50)":"rgba(0,0,0,0.25)"} transform="translate(4,5)"/>
                    {/* Branch body */}
                    <path d={geo.filled} fill={isActive?td.color:"url(#trunkGrad)"} style={{ transition:"fill 0.22s" }}/>
                    {/* Branch top highlight */}
                    <path d={geo.spine}
                      stroke={dark?"rgba(255,205,130,0.20)":"rgba(255,235,175,0.32)"}
                      strokeWidth="2.8" fill="none" strokeLinecap="round"/>

                    {/* Sub-twigs */}
                    {twigs.map((tw,i)=>(
                      <path key={i} d={tw.d}
                        stroke={dark?"#7a4e2e":"#5b3a29"}
                        strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.82"/>
                    ))}

                    {/* Front leaves (layer 2) – brightest, veined */}
                    {leaves.filter(lf=>lf.layer===2).map((lf,i)=>{
                      const lp  = leafPaths(lf.x,lf.y,lf.w,lf.h,lf.rot);
                      const col = lf.yellow
                        ? leafColors.yellowBright
                        : (lf.shade>0.65?leafColors.highlight:leafColors.bright);
                      return (
                        <g key={i} className="leaf-pop" style={{ animationDelay:`${lf.delay+0.10}s` }}>
                          <path d={lp.outline} fill={col} opacity={lf.opacity}/>
                          {lf.vein && (
                            <>
                              <path d={lp.midrib} stroke="rgba(0,0,0,0.18)" strokeWidth="0.55" fill="none"/>
                              <path d={lp.veinL}  stroke="rgba(0,0,0,0.10)" strokeWidth="0.45" fill="none"/>
                              <path d={lp.veinR}  stroke="rgba(0,0,0,0.10)" strokeWidth="0.45" fill="none"/>
                            </>
                          )}
                          {/* Tiny specular dew on ~every 7th front leaf */}
                          {i%7===0 && !lf.yellow && (
                            <ellipse cx={lf.x+lf.w*0.3} cy={lf.y-lf.h*0.35}
                              rx={lf.w*0.28} ry={lf.w*0.18}
                              fill="rgba(255,255,255,0.38)"
                              transform={`rotate(${lf.rot-15},${lf.x+lf.w*0.3},${lf.y-lf.h*0.35})`}/>
                          )}
                        </g>
                      );
                    })}

                    {/* Blossoms (80–99 %) */}
                    {blossoms.map((bl,i)=>(
                      <BlossomGroup key={i} b={bl} dark={dark} uid={`${td.id}-${i}`}/>
                    ))}

                    {/* Fruit (100 %) */}
                    {td.progress>=100 && (
                      <g className="fruit-pop" filter="url(#softGlowF)">
                        <FruitGroup geo={geo} teamId={td.id} color={td.color} dark={dark}/>
                      </g>
                    )}

                    {/* Dry tip (0–20 %) */}
                    {td.progress<20 && (
                      <circle cx={geo.ex} cy={geo.ey} r={3.5}
                        fill={dark?"#78716c":"#a16207"} opacity="0.82"/>
                    )}

                    {/* Branch label – frosted pill behind text */}
                    {(()=>{
                      const hl     = healthLabel(td.progress);
                      const labelR  = geo.len + 28;
                      const lxRaw   = slot.ox + Math.cos(toRad(slot.angle)) * labelR;
                      const lyRaw   = slot.oy + Math.sin(toRad(slot.angle)) * labelR;
                      const anchor  = slot.side === "right" ? "start" : "end";
                      const lx      = anchor === "start" ? Math.min(lxRaw, 770) : Math.max(lxRaw, 110);
                      // clamp so pill top stays inside viewBox top (-120 + 10px margin)
                      const ly      = Math.max(lyRaw, -90);
                      const off     = anchor === "start" ? 10 : -10;
                      const pillX   = anchor === "start" ? lx + off - 5 : lx + off - 110;
                      const pillY   = ly - 22;
                      return (
                        <g style={{ pointerEvents:"none" }}>
                          {/* frosted pill */}
                          <rect x={pillX} y={pillY} width={116} height={58} rx={8}
                            fill={dark?"rgba(8,15,26,0.72)":"rgba(255,255,255,0.82)"}
                            stroke={isActive ? td.color : (dark?"rgba(99,120,180,0.20)":"rgba(180,210,240,0.55)")}
                            strokeWidth={isActive ? 1.5 : 0.8}
                            style={{ backdropFilter:"blur(6px)", filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.14))" }}/>
                          <text x={lx+off} y={ly-6}    textAnchor={anchor} fontSize="12"   fontWeight="700"
                            fill={isActive ? td.color : textMain} style={{ transition:"fill 0.2s" }}>{td.name}</text>
                          <text x={lx+off} y={ly+8}    textAnchor={anchor} fontSize="10"
                            fill={isActive ? td.color : textSub}>{td.progress}% · {growthLabel(td.progress)}</text>
                          <text x={lx+off} y={ly+21}   textAnchor={anchor} fontSize="9.5"
                            fill={hl.color}>{hl.icon} {hl.text}</text>
                        </g>
                      );
                    })()}

                    {/* Hover tooltip */}
                    {isHov&&!isSel&&(()=>{
                      let tx=slot.ox+Math.cos(toRad(slot.angle))*(geo.len+24);
                      let ty=slot.oy+Math.sin(toRad(slot.angle))*(geo.len+24)-76;
                      if(slot.side==="right") tx=Math.min(tx,715); else tx=Math.max(tx-148,8);
                      ty=Math.max(8,Math.min(ty,480));
                      return (
                        <g style={{ pointerEvents:"none" }}>
                          <rect x={tx} y={ty} width={148} height={100} rx={9}
                            fill={dark?"#101f3a":"#fff"}
                            stroke={td.color} strokeWidth={1.5}
                            style={{ filter:"drop-shadow(0 6px 24px rgba(0,0,0,0.24))" }}/>
                          <text x={tx+74} y={ty+18}  textAnchor="middle" fontSize="11"  fontWeight="700" fill={textMain}>{td.name}</text>
                          <rect x={tx+14}  y={ty+24} width={120} height={1} fill={td.color} opacity="0.28"/>
                          <text x={tx+74} y={ty+40}  textAnchor="middle" fontSize="10"  fill={td.color}>Tiến độ: {td.progress}%</text>
                          <text x={tx+74} y={ty+54}  textAnchor="middle" fontSize="10"  fill={textSub}>Xong {td.stats.done}/{td.stats.total} việc</text>
                          <text x={tx+74} y={ty+68}  textAnchor="middle" fontSize="10"
                            fill={td.stats.overdue>0?"#ef4444":(dark?"#4ade80":"#16a34a")}>
                            {td.stats.overdue>0?`⚠ ${td.stats.overdue} quá hạn`:"✓ Đúng hạn"}
                          </text>
                          <text x={tx+74} y={ty+87}  textAnchor="middle" fontSize="9"   fill={dark?"#475569":"#94a3b8"}>(click xem chi tiết)</text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Trunk (rendered on top of branches) */}
              <TrunkShape dark={dark}/>
            </g>

            {/* Roots (outside sway group for stability) */}
            <Roots dark={dark}/>
          </svg>}

          {/* Hint pill */}
          {!selected&&(
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <span className="text-xs px-3.5 py-1.5 rounded-full"
                style={{ background:dark?"rgba(8,15,26,0.90)":"rgba(255,255,255,0.92)", color:textSub,
                         boxShadow:"0 1px 12px rgba(0,0,0,0.12)", border:`1px solid ${dark?"#1a3660":"#c7dff5"}` }}>
                Hover để xem · Click nhánh để mở chi tiết
              </span>
            </div>
          )}
        </div>

        {/* ── Side panel ────────────────────────────────────────────────── */}
        <div style={{ width:panelWidth, minWidth:panelWidth, transition:"width 0.30s ease,min-width 0.30s ease",
                      overflow:"hidden", borderLeft:selected?`1px solid ${dark?"#1a3660":"#c7dff5"}`:"none",
                      background:panelBg, display:"flex", flexDirection:"column" }}>
          {selectedTeam&&(
            <>
              <div className="px-4 py-3 shrink-0"
                style={{ background:selectedTeam.color+"14", borderBottom:`1px solid ${selectedTeam.color}2e` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow"
                      style={{ background:selectedTeam.color }}>
                      {selectedTeam.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color:textMain }}>{selectedTeam.name}</p>
                      <p className="text-[11px]" style={{ color:selectedTeam.color }}>
                        {growthLabel(selectedTeam.progress)} · {selectedTeam.progress}%
                      </p>
                    </div>
                  </div>
                  <button onClick={closePanel}
                    className="text-lg leading-none px-1.5 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ color:textSub }}>×</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>router.push(`/teams/${selectedTeam.id}`)}
                    className="flex-1 text-[11px] py-1.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-85"
                    style={{ background:selectedTeam.color }}>↗ Chi tiết đầy đủ</button>
                  <button onClick={closePanel}
                    className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors"
                    style={{ background:dark?"#1a3660":"#f1f5f9", color:textSub }}>← Về cây</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3" style={{ borderBottom:`1px solid ${dark?"#1a3660":"#edf4ff"}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color:textSub }}>Tiến độ Q1</span>
                    <span className="text-[11px] font-bold" style={{ color:selectedTeam.color }}>{selectedTeam.progress}%</span>
                  </div>
                  <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background:dark?"#1a3660":"#e0eeff" }}>
                    <div className="absolute top-0 bottom-0 w-px z-10" style={{ left:`${EXPECTED}%`, background:dark?"#64748b":"#94a3b8" }}/>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${selectedTeam.progress}%`, background:selectedTeam.color }}/>
                  </div>
                  <div className="flex justify-between mt-1 text-[10px]" style={{ color:textSub }}>
                    <span>{selectedTeam.stats.done}/{selectedTeam.stats.total} xong</span>
                    <span>Kỳ vọng {EXPECTED}%</span>
                  </div>
                  {selectedTeam.stats.overdue>0&&(
                    <div className="mt-2 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold"
                      style={{ background:"#fee2e2", color:"#dc2626" }}>
                      ⚠ {selectedTeam.stats.overdue} công việc quá hạn
                    </div>
                  )}
                </div>

                <div className="px-4 py-3" style={{ borderBottom:`1px solid ${dark?"#1a3660":"#edf4ff"}` }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color:textSub }}>
                    Công việc ({selectedTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedTasks.map(task=>(
                      <div key={task.id}
                        className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[11px]"
                        style={{ background:task.done?(dark?"rgba(14,28,52,0.5)":"#f6faff"):(dark?"rgba(26,54,96,0.6)":"#fff"),
                                 border:`1px solid ${dark?"#1a3660":"#ddeeff"}`, opacity:task.done?0.65:1 }}>
                        <span className="shrink-0 mt-0.5">
                          {task.done?"✅":task.status==="Doing"?"🔄":"⏳"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-tight truncate"
                            style={{ color:task.done?textSub:textMain, textDecoration:task.done?"line-through":"none" }}>
                            {task.title}
                          </p>
                          <p className="mt-0.5 text-[10px]" style={{ color:textSub }}>
                            {task.owner} · {task.deadline}
                            {!task.done&&task.deadline<new Date().toISOString().split("T")[0]&&(
                              <span style={{ color:"#ef4444", fontWeight:600 }}> quá hạn</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLog.length>0&&(
                  <div className="px-4 py-3">
                    <p className="text-[11px] font-bold mb-2" style={{ color:textSub }}>Nhật ký</p>
                    <div className="space-y-2">
                      {selectedLog.slice(0,6).map((a,i)=>(
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-[10px]" style={{ color:selectedTeam.color }}>•</span>
                          <p className="text-[11px] leading-tight" style={{ color:textSub }}>
                            {a.message}
                            <span className="ml-1 text-[10px]" style={{ color:dark?"#475569":"#cbd5e1" }}>
                              {new Date(a.timestamp).toLocaleDateString("vi-VN")}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
