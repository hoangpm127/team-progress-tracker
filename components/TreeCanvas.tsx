"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useApp } from "@/lib/AppContext";

// ─────────────────────────────────────────────────────────────
//  ZONE METADATA
// ─────────────────────────────────────────────────────────────
type ZoneId = "tech"|"hr"|"mkt"|"heaven"|"partnerships"|"market"|"assistant"|"piano";

const ZONE_META: Record<ZoneId,{icon:string;title:string;color:string;border:string;subtitle:string;teamId:string|null}> = {
  tech:         {icon:"⚙️", title:"Công nghệ",   color:"#6366f1",border:"#818cf8",subtitle:"Thân cây — Technology Core",        teamId:"tech"},
  hr:           {icon:"👥", title:"Nhân sự",     color:"#f59e0b",border:"#fbbf24",subtitle:"Rễ cây — Human Resources",          teamId:"hr"},
  mkt:          {icon:"📣", title:"Marketing",   color:"#ec4899",border:"#f472b6",subtitle:"Mây trái — Quảng bá & Thương hiệu", teamId:"mkt"},
  heaven:       {icon:"🌦", title:"Thiên thời",  color:"#0ea5e9",border:"#38bdf8",subtitle:"Mây phải — Cơ hội & Thời điểm",    teamId:null},
  partnerships: {icon:"🤝", title:"Hợp tác",     color:"#10b981",border:"#34d399",subtitle:"Cỏ xanh — 4 nhóm đối tác",         teamId:"partnerships"},
  market:       {icon:"🌍", title:"Thị trường",  color:"#a16207",border:"#d97706",subtitle:"Đất — Bối cảnh kinh doanh",         teamId:null},
  assistant:    {icon:"📋", title:"Hành chính",  color:"#3b82f6",border:"#60a5fa",subtitle:"Nhánh phải — BOD / Admin",          teamId:"assistant"},
  piano:        {icon:"🎹", title:"Piano",       color:"#8b5cf6",border:"#a78bfa",subtitle:"Nhánh trái — Piano Division",       teamId:"piano"},
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function mkRng(seed:number){let s=seed;return()=>{s|=0;s=s+0x6d2b79f5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const Q1_START=+new Date("2026-01-01"), Q1_END=+new Date("2026-03-31"), TODAY_TS=+new Date("2026-02-25");
const ELAPSED=Math.round(Math.min(1,(TODAY_TS-Q1_START)/(Q1_END-Q1_START))*100);
function healthOf(prog:number){const r=ELAPSED>0?prog/ELAPSED:1;if(r>=0.80)return{label:"Đúng tiến độ",color:"#10b981",dot:"🟢"};if(r>=0.50)return{label:"Hơi chậm",color:"#f59e0b",dot:"🟡"};return{label:"Nguy hiểm",color:"#ef4444",dot:"🔴"};}

// ─────────────────────────────────────────────────────────────
//  MINI POPUP
// ─────────────────────────────────────────────────────────────
interface PopupState{zone:ZoneId;sx:number;sy:number}
function MiniPopup({popup,onClose,onDetail,prog,done,total,overdue,extra}:
  {popup:PopupState;onClose():void;onDetail():void;prog:number;done:number;total:number;overdue:number;extra?:string}){
  const meta=ZONE_META[popup.zone];
  const h=healthOf(prog);
  const left=Math.min(popup.sx+18,window.innerWidth-256);
  const top=Math.max(popup.sy-16,8);
  return(
    <div data-popup="1" className="fixed z-50 w-[244px] rounded-2xl shadow-2xl overflow-hidden"
      style={{left,top,border:`2px solid ${meta.border}`,background:"rgba(8,12,26,0.97)",backdropFilter:"blur(12px)"}}>
      <div className="flex items-center gap-3 px-4 py-3" style={{background:`${meta.color}18`,borderBottom:`1px solid ${meta.border}30`}}>
        <span className="text-2xl leading-none">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight">{meta.title}</div>
          <div className="text-xs mt-0.5 truncate" style={{color:`${meta.color}cc`}}>{meta.subtitle}</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none shrink-0 pb-0.5">×</button>
      </div>
      {meta.teamId&&(
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Tiến độ Q1</span>
            <span className="text-base font-bold" style={{color:meta.color}}>{prog}%</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div className="h-2.5 rounded-full" style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}66,${meta.color})`}}/>
          </div>
          <div className="flex gap-3 text-xs text-slate-400 mb-1">
            <span>✅ {done}/{total} tasks</span>
            {overdue>0&&<span className="text-red-400">⚠ {overdue} quá hạn</span>}
          </div>
          <div className="text-xs font-medium" style={{color:h.color}}>{h.dot} {h.label}</div>
        </div>
      )}
      {extra&&<div className="px-4 py-2 text-xs text-slate-300 border-t border-white/5">{extra}</div>}
      <div className="px-4 py-3 border-t border-white/5">
        <button onClick={onDetail}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 hover:brightness-110"
          style={{background:`linear-gradient(135deg,${meta.color}dd,${meta.color})`}}>
          📋 Xem chi tiết →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FULL SIDE PANEL
// ─────────────────────────────────────────────────────────────
const PARTNER_CATS=[
  {id:1,label:"Nhà cung cấp",icon:"📦",color:"#f59e0b"},
  {id:2,label:"HR Partners", icon:"👥",color:"#a78bfa"},
  {id:3,label:"Kiến thức",   icon:"🎓",color:"#34d399"},
  {id:4,label:"Tài chính",   icon:"💰",color:"#60a5fa"},
];
function FullPanel({zone,onClose}:{zone:ZoneId;onClose():void}){
  const app=useApp();const meta=ZONE_META[zone];const teamId=meta.teamId;
  const tasks=teamId?app.getTeamTasks(teamId):[];
  const stats=teamId?app.getTeamStats(teamId):{done:0,total:0,overdue:0};
  const prog=teamId?app.getTeamProgress(teamId):0;
  const acts=teamId?app.getTeamActivity(teamId).slice(0,6):[];
  const today=new Date().toISOString().split("T")[0];
  const h=healthOf(prog);
  const SC:{[k:string]:string}={Todo:"#64748b",Doing:"#3b82f6",Done:"#10b981"};
  const SL:{[k:string]:string}={Todo:"Chờ làm",Doing:"Đang làm",Done:"Hoàn thành"};
  return(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-hidden" style={{borderLeft:`4px solid ${meta.color}`}}>
        <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{background:`${meta.color}12`,borderBottom:`1px solid ${meta.color}28`}}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1"><span className="text-2xl">{meta.icon}</span><span className="font-bold text-slate-800 text-lg">{meta.title}</span></div>
            <p className="text-xs text-slate-500">{meta.subtitle}</p>
            {teamId&&(<div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Tiến độ Q1</span>
                <div className="flex items-center gap-2"><span className="text-xs font-medium" style={{color:h.color}}>{h.dot} {h.label}</span><span className="font-bold text-lg" style={{color:meta.color}}>{prog}%</span></div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-3 rounded-full" style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}88,${meta.color})`}}/>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span>✅ {stats.done}/{stats.total} tasks</span>
                {stats.overdue>0&&<span className="text-red-500">⚠ {stats.overdue} quá hạn</span>}
              </div>
            </div>)}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-3">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {zone==="tech"&&(<div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">30 Dự Án Công Nghệ</h3>
              <div className="flex gap-2 text-xs">
                <span className="text-emerald-600">🟢 {app.projects.filter(p=>p.status==="live").length}</span>
                <span className="text-amber-600">🔨 {app.projects.filter(p=>p.status==="building").length}</span>
                <span className="text-slate-400">💡 {app.projects.filter(p=>p.status==="idea").length}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {app.projects.map(p=>{
                const m:{[k:string]:{dot:string;bg:string;tc:string}}={live:{dot:"🟢",bg:"#f0fdf4",tc:"#166534"},building:{dot:"🔨",bg:"#fffbeb",tc:"#92400e"},idea:{dot:"💡",bg:"#f8fafc",tc:"#475569"}};
                const {dot,bg,tc}=m[p.status];
                return(<div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{background:bg}}><span className="text-sm shrink-0">{dot}</span><div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{color:tc}}>{p.name}</div><div className="text-xs text-slate-400">{p.owner}</div></div></div>);
              })}
            </div>
          </div>)}
          {zone==="partnerships"&&(<div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">4 Nhóm Đối Tác</h3>
            {PARTNER_CATS.map(cat=>{
              const list=app.partners.filter(p=>p.category===cat.id);
              return(<div key={cat.id} className="mb-5"><div className="flex items-center gap-2 mb-2"><span>{cat.icon}</span><span className="text-sm font-semibold" style={{color:cat.color}}>{cat.label}</span><span className="ml-auto text-xs text-slate-400">{list.filter(p=>p.status==="active").length}/{list.length} active</span></div>
                {list.length===0?<p className="text-xs text-slate-400 italic pl-5">Chưa có dữ liệu (cần chạy extend.sql)</p>
                :<div className="space-y-1 pl-5">{list.map(p=>(<div key={p.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:p.status==="active"?"#10b981":"#94a3b8"}}/><span className="text-xs text-slate-600 flex-1">{p.name}</span><span className="text-xs text-slate-400">{p.status==="active"?"Active":"Pipeline"}</span></div>))}</div>}
              </div>);
            })}
          </div>)}
          {zone==="market"&&(<div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chỉ Số Thị Trường</h3>
            <div className="rounded-xl p-4 mb-3" style={{background:"#fef3c7",border:"1px solid #fde68a"}}>
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-amber-800">Market Index</span><span className="text-3xl font-bold text-amber-900">{app.market.marketIndex}</span></div>
              <div className="h-3 bg-amber-100 rounded-full overflow-hidden"><div className="h-3 rounded-full" style={{width:`${app.market.marketIndex}%`,background:"linear-gradient(90deg,#f59e0b,#d97706)"}}/></div>
            </div>
            {app.market.notes&&<p className="text-xs text-slate-600 bg-amber-50 rounded-lg p-3 border border-amber-100 leading-relaxed">{app.market.notes}</p>}
          </div>)}
          {zone==="heaven"&&(<div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thiên Thời</h3>
            <div className="rounded-xl p-4 mb-4" style={{background:"#f0f9ff",border:"1px solid #bae6fd"}}>
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-sky-800">Heaven Timing Index</span><span className="text-3xl font-bold text-sky-900">{app.heavenTiming.heavenTimingIndex}</span></div>
              <div className="h-3 bg-sky-100 rounded-full overflow-hidden"><div className="h-3 rounded-full" style={{width:`${app.heavenTiming.heavenTimingIndex}%`,background:"linear-gradient(90deg,#38bdf8,#0ea5e9)"}}/></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-sm text-slate-700">🌧 Hiệu ứng mưa</span>
              <button onClick={()=>app.setHeavenTiming({rainEnabled:!app.heavenTiming.rainEnabled})} className={`relative w-11 h-6 rounded-full transition-colors ${app.heavenTiming.rainEnabled?"bg-sky-400":"bg-slate-200"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${app.heavenTiming.rainEnabled?"translate-x-5":"translate-x-0.5"}`}/>
              </button>
            </div>
          </div>)}
          {teamId&&tasks.length>0&&(<div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Công Việc ({tasks.length})</h3>
            <div className="space-y-2">
              {tasks.map(t=>{
                const over=!t.done&&t.deadline<today;
                return(<div key={t.id} className={`flex gap-2.5 p-2.5 rounded-lg border ${t.done?"bg-green-50 border-green-100":over?"bg-red-50 border-red-100":"bg-slate-50 border-slate-100"}`}>
                  <button onClick={()=>app.toggleTask(t.id,"Tree")} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${t.done?"bg-green-500 border-green-500 text-white":"border-slate-300"}`}>
                    {t.done&&<svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" strokeWidth="1.8" stroke="currentColor"><path d="M1.5 5.5L4 8 8.5 2"/></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug ${t.done?"line-through text-slate-400":"text-slate-700"}`}>{t.title}</p>
                    <div className="flex flex-wrap gap-x-2 mt-0.5">
                      <span className="text-xs" style={{color:SC[t.status]}}>{SL[t.status]}</span>
                      <span className="text-xs text-slate-400">· Hạn {t.deadline}</span>
                      {over&&<span className="text-xs text-red-500 font-medium">⚠ Quá hạn</span>}
                    </div>
                  </div>
                </div>);
              })}
            </div>
          </div>)}
          {acts.length>0&&(<div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hoạt Động Gần Đây</h3>
            <div className="space-y-2">{acts.map(a=>(<div key={a.id} className="flex gap-2 text-xs text-slate-500"><span className="text-slate-300 shrink-0">•</span><span className="leading-relaxed">{a.message}</span></div>))}</div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  RAIN DROPS
// ─────────────────────────────────────────────────────────────
const RAIN_DROPS = Array.from({length:26},(_,i)=>{const r=mkRng(i*137);return{x:600+r()*240,y:20+r()*130,del:r()*1.6,dur:.48+r()*.46};});

// ─────────────────────────────────────────────────────────────
//  GRASS BLADES (pre-seeded)
// ─────────────────────────────────────────────────────────────
function makeGrass(count:number){
  return Array.from({length:count},(_,i)=>{
    const r=mkRng(i*17);const bx=r()*1000;const h=14+r()*24;
    const lx=bx-4-r()*6,rx=bx+4+r()*6;
    const cols=["#2a6620","#307828","#3a8c30","#268020","#3c9e34","#226018"];
    return{bx,h,lx,rx,col:cols[i%cols.length]};
  });
}

// ─────────────────────────────────────────────────────────────
//  CARTOON TREE SVG (the actual visual)
// ─────────────────────────────────────────────────────────────
// viewBox 1000 × 620
// Ground Y = 490
// Trunk center X = 500

const VW=1000, VH=620, GY=490;

// Trunk — wide organic filled shape
// Base ~110px wide, tapers to ~30px at top fork y≈205
const TRUNK_PATH=`
  M 445,${GY}
  C 442,${GY-10} 440,${GY-30} 441,${GY-60}
  C 443,${GY-100} 447,${GY-150} 451,${GY-200}
  C 454,${GY-240} 456,${GY-265} 458,${GY-285}
  L 462,${GY-293}
  L 542,${GY-293}
  C 544,${GY-265} 546,${GY-240} 549,${GY-200}
  C 553,${GY-150} 557,${GY-100} 559,${GY-60}
  C 560,${GY-30} 558,${GY-10} 555,${GY}
  Z
`;
// That gives: base 445-555 (110px), top 462-542 (80px) at y=197 — still too wide at top
// Let me just hardcode the numbers clearly:

const TRUNK = `
  M 444,490
  C 441,478 439,455 440,425
  C 442,390 447,355 451,320
  C 455,285 457,258 459,232
  C 460,220 461,210 462,202
  L 467,196
  L 533,196
  C 539,210 540,220 541,232
  C 543,258 545,285 549,320
  C 553,355 558,390 560,425
  C 561,455 559,478 556,490
  Z
`;

// Root shapes — thick flares merging into ground
const ROOTS = [
  // left root
  `M 450,490 C 440,492 420,496 395,502 C 368,508 345,515 320,522 C 305,526 292,530 280,534 L 276,538 C 290,536 308,530 330,524 C 356,516 382,508 408,500 C 428,494 442,491 450,490 Z`,
  // far left root
  `M 446,490 C 432,494 410,500 384,510 C 355,521 330,532 306,542 L 300,548 C 318,540 344,528 370,518 C 398,506 426,496 445,491 Z`,
  // center root (straight down into soil)
  `M 458,490 L 454,490 L 454,518 L 470,522 L 470,490 Z`,
  // right root
  `M 550,490 C 558,492 578,496 604,502 C 630,508 655,515 680,522 C 696,526 708,530 721,534 L 724,538 C 710,536 692,530 670,524 C 644,516 618,508 592,500 C 572,494 558,491 550,490 Z`,
  // far right root
  `M 554,490 C 568,494 590,500 618,510 C 646,521 670,532 695,542 L 702,548 C 682,540 656,528 630,518 C 602,506 574,496 555,491 Z`,
];

// Main branch forks — filled tapered shapes
// Left branch: trunk (464,196) → tip (215,88)
const L_BRANCH = `
  M 476,196  C 468,180 444,158 416,136 C 390,116 356,100 322,88 C 298,80 272,76 248,78 L 238,88 C 262,84 290,86 316,94 C 352,106 388,122 416,144 C 442,164 462,184 470,200 Z
`;
// Left sub-branch going to piano-tip cluster at (215,68)
const L_BRANCH2 = `
  M 264,80  C 252,70 236,58 218,52 C 206,48 196,47 188,50 L 186,62 C 194,58 206,58 220,62 C 234,66 248,76 260,88 Z
`;
// Right branch: trunk → (784,88)
const R_BRANCH = `
  M 524,196  C 532,180 556,158 584,136 C 610,116 644,100 678,88 C 702,80 728,76 752,78 L 762,88 C 738,84 710,86 684,94 C 648,106 612,122 584,144 C 558,164 538,184 530,200 Z
`;
const R_BRANCH2 = `
  M 736,80  C 748,70 764,58 782,52 C 794,48 804,47 812,50 L 814,62 C 806,58 794,58 780,62 C 766,66 752,76 740,88 Z
`;
// Mid branches (for tech zone) — horizontal
const MID_L_BRANCH = `M 462,280 C 450,274 426,264 398,256 C 374,250 346,246 318,250 L 310,262 C 340,256 370,258 396,264 C 424,272 448,282 462,292 Z`;
const MID_R_BRANCH = `M 538,280 C 550,274 574,264 602,256 C 626,250 654,246 682,250 L 690,262 C 660,256 630,258 604,264 C 576,272 552,282 538,292 Z`;
const LOW_L_BRANCH = `M 460,360 C 448,356 428,352 406,352 C 384,352 362,356 342,364 L 338,376 C 360,366 384,360 408,360 C 430,360 450,364 462,372 Z`;
const LOW_R_BRANCH = `M 540,360 C 552,356 572,352 594,352 C 616,352 638,356 658,364 L 662,376 C 640,366 616,360 592,360 C 570,360 550,364 538,372 Z`;

// Canopy blob clusters — overlapping circles for organic cartoon look
// Each "blob" = group of circles in 3 depths (shadow / mid / highlight)
// Zone: piano (left), assistant (right), tech (center + mid branches)

interface BlobCircle {cx:number;cy:number;r:number;shade:0|1|2}  // 0=shadow 1=mid 2=highlight

// Colors per shade
const CANOPY_COLORS = [
  "#1a5e28",  // shade 0 — deep shadow
  "#267333",  // shade 1 — mid
  "#2d8a3e",  // shade 1b
  "#369948",  // shade 2 — main
  "#3daa52",  // shade 2b  
  "#48bc60",  // shade 3 — highlight
  "#55cc6e",  // shade 3b — bright tip
];

// Piano (left) canopy blobs
const PIANO_BLOBS: BlobCircle[] = [
  // shadow
  {cx:240,cy:100,r:96, shade:0},{cx:174,cy:118,r:72, shade:0},{cx:305,cy:122,r:68, shade:0},
  {cx:188,cy:68, r:58, shade:0},{cx:272,cy:62, r:54, shade:0},
  // mid
  {cx:238,cy:90, r:100,shade:1},{cx:170,cy:106,r:76, shade:1},{cx:302,cy:110,r:72, shade:1},
  {cx:186,cy:56, r:62, shade:1},{cx:270,cy:50, r:58, shade:1},{cx:228,cy:56, r:64, shade:1},
  // highlight
  {cx:234,cy:76, r:88, shade:2},{cx:198,cy:68, r:70, shade:2},{cx:272,cy:72, r:66, shade:2},
  {cx:220,cy:46, r:54, shade:2},{cx:258,cy:40, r:50, shade:2},
];

// Assistant (right) canopy blobs
const ASST_BLOBS: BlobCircle[] = [
  {cx:762,cy:100,r:96, shade:0},{cx:828,cy:118,r:72, shade:0},{cx:698,cy:122,r:68, shade:0},
  {cx:814,cy:68, r:58, shade:0},{cx:730,cy:62, r:54, shade:0},
  {cx:764,cy:90, r:100,shade:1},{cx:832,cy:106,r:76, shade:1},{cx:700,cy:110,r:72, shade:1},
  {cx:816,cy:56, r:62, shade:1},{cx:732,cy:50, r:58, shade:1},{cx:774,cy:56, r:64, shade:1},
  {cx:768,cy:76, r:88, shade:2},{cx:804,cy:68, r:70, shade:2},{cx:730,cy:72, r:66, shade:2},
  {cx:782,cy:46, r:54, shade:2},{cx:744,cy:40, r:50, shade:2},
];

// Tech center canopy (main crown of the tree)
const TECH_BLOBS: BlobCircle[] = [
  // shadow
  {cx:500,cy:168,r:110,shade:0},{cx:420,cy:188,r:88, shade:0},{cx:582,cy:184,r:88, shade:0},
  {cx:460,cy:130,r:80, shade:0},{cx:542,cy:126,r:80, shade:0},{cx:500,cy:108,r:72, shade:0},
  // mid
  {cx:500,cy:154,r:114,shade:1},{cx:416,cy:174,r:92, shade:1},{cx:586,cy:170,r:92, shade:1},
  {cx:456,cy:118,r:84, shade:1},{cx:546,cy:114,r:84, shade:1},{cx:500,cy:95, r:76, shade:1},
  {cx:378,cy:196,r:74, shade:1},{cx:623,cy:192,r:74, shade:1},
  // highlight  
  {cx:500,cy:138,r:106,shade:2},{cx:450,cy:118,r:88, shade:2},{cx:554,cy:112,r:86, shade:2},
  {cx:498,cy:88, r:70, shade:2},{cx:422,cy:150,r:76, shade:2},{cx:580,cy:146,r:76, shade:2},
  {cx:500,cy:68, r:56, shade:2},
];

// Mid-branch canopy blobs (tech mid and low)
const MID_BLOBS: BlobCircle[] = [
  {cx:324,cy:248,r:72,shade:0},{cx:688,cy:244,r:72,shade:0},
  {cx:318,cy:234,r:76,shade:1},{cx:684,cy:230,r:76,shade:1},
  {cx:326,cy:218,r:68,shade:2},{cx:686,cy:214,r:68,shade:2},
  {cx:348,cy:248,r:58,shade:2},{cx:662,cy:244,r:58,shade:2},
];
const LOW_BLOBS: BlobCircle[] = [
  {cx:344,cy:352,r:60,shade:0},{cx:658,cy:348,r:60,shade:0},
  {cx:340,cy:340,r:64,shade:1},{cx:654,cy:336,r:64,shade:1},
  {cx:346,cy:325,r:56,shade:2},{cx:655,cy:320,r:56,shade:2},
];

function shadeColor(shade:0|1|2, i:number):string {
  if(shade===0) return CANOPY_COLORS[0];
  if(shade===1) return CANOPY_COLORS[1 + (i%2)];
  return CANOPY_COLORS[3 + (i%2)];
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function TreeCanvas(){
  const app=useApp();
  const svgRef=useRef<SVGSVGElement>(null);
  const [popup,    setPopup]    = useState<PopupState|null>(null);
  const [fullPanel,setFullPanel]= useState<ZoneId|null>(null);
  const [hovered,  setHovered]  = useState<ZoneId|null>(null);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{if(popup&&!(e.target as Element).closest("[data-popup]"))setPopup(null);};
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[popup]);

  const openZone=useCallback((zone:ZoneId,e:React.MouseEvent)=>{
    e.stopPropagation();
    setPopup(p=>p?.zone===zone?null:{zone,sx:e.clientX,sy:e.clientY});
    setFullPanel(null);
  },[]);
  const openFull=useCallback((zone:ZoneId)=>{setFullPanel(zone);setPopup(null);},[]);

  const gp=(id:string)=>app.getTeamProgress(id);
  const gs=(id:string)=>app.getTeamStats(id);
  const techProg=gp("tech"),hrProg=gp("hr"),mktProg=gp("mkt"),partProg=gp("partnerships");
  const asstProg=gp("assistant"),pianoProg=gp("piano");
  const rainOn=app.heavenTiming.rainEnabled, mkIdx=app.market.marketIndex, hvIdx=app.heavenTiming.heavenTimingIndex;

  // Grass density
  const blades=useMemo(()=>makeGrass(Math.round(32+partProg*.5)),[partProg]);

  // Trunk color shifts warmer with tech progress
  const trunkSat=38+techProg*.15;
  const trunkA=`hsl(22,${trunkSat}%,22%)`, trunkB=`hsl(26,${trunkSat+8}%,32%)`, trunkC=`hsl(25,${trunkSat+4}%,27%)`;

  // HoverLabel inside SVG
  const HoverLabel=({zone,x,y,above=true}:{zone:ZoneId;x:number;y:number;above?:boolean})=>{
    if(hovered!==zone)return null;
    const meta=ZONE_META[zone];const p=gp(zone);const hh=healthOf(p);
    const W=162, H=38, bx=x-W/2, by=above?y-H-8:y+8;
    return(
      <g style={{pointerEvents:"none"}}>
        <rect x={bx-2} y={by-2} width={W+4} height={H+4} rx="10" fill={`${meta.color}44`}/>
        <rect x={bx} y={by} width={W} height={H} rx="9" fill="rgba(8,12,26,0.94)" stroke={meta.border} strokeWidth="1.5"/>
        <text x={x} y={by+15} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">{meta.icon} {meta.title}</text>
        <text x={x} y={by+30} textAnchor="middle" fontSize="10" fontWeight="600" fill={meta.color}>{p}% · {hh.dot} {hh.label}</text>
      </g>
    );
  };

  return(
    <div className="relative w-full h-full" style={{background:"#c8e9f8"}}>
      {/* top controls */}
      <div className="absolute top-2 right-3 z-10 flex gap-2">
        <button onClick={()=>app.setHeavenTiming({rainEnabled:!rainOn})}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-md transition-all active:scale-95"
          style={{background:rainOn?"#0ea5e9":"white",color:rainOn?"white":"#475569",borderColor:rainOn?"#38bdf8":"#e2e8f0"}}>
          {rainOn?"🌧 Tắt mưa":"☀️ Bật mưa"}
        </button>
        <button onClick={()=>openFull("market")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-amber-200 text-amber-700 shadow-md hover:bg-amber-50 active:scale-95 transition-all">
          🌍 Market {mkIdx}
        </button>
        <button onClick={()=>openFull("heaven")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-sky-200 text-sky-700 shadow-md hover:bg-sky-50 active:scale-95 transition-all">
          🌦 Heaven {hvIdx}
        </button>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
           className="w-full h-full" style={{display:"block"}}>
        <defs>
          {/* Sky */}
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#a8d8f0"/>
            <stop offset="50%" stopColor="#c8eef4"/>
            <stop offset="100%" stopColor="#b8e0a8"/>
          </linearGradient>
          {/* Trunk */}
          <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={trunkA}/>
            <stop offset="30%"  stopColor={trunkC}/>
            <stop offset="52%"  stopColor={trunkB}/>
            <stop offset="72%"  stopColor={trunkC}/>
            <stop offset="100%" stopColor={trunkA}/>
          </linearGradient>
          {/* Bark texture overlay */}
          <pattern id="barkPat" x="0" y="0" width="10" height="30" patternUnits="userSpaceOnUse">
            <path d="M5,0 Q3,8 5,15 Q7,22 5,30" stroke="rgba(0,0,0,0.12)" strokeWidth="1" fill="none"/>
          </pattern>
          {/* Root gradient */}
          <linearGradient id="rootG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={trunkC}/>
            <stop offset="100%" stopColor={trunkA}/>
          </linearGradient>
          {/* Soil */}
          <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={`hsl(28,${40+mkIdx*.15}%,${28+mkIdx*.08}%)`}/>
            <stop offset="100%" stopColor={`hsl(23,35%,14%)`}/>
          </linearGradient>
          <linearGradient id="underG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#160a02"/><stop offset="100%" stopColor="#0a0402"/>
          </linearGradient>
          <radialGradient id="trunkGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,200,100,0.14)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>
          {/* Canopy depth shadow */}
          <filter id="canopyShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0a2e10" floodOpacity="0.25"/>
          </filter>
          <filter id="trunkShadow" x="-20%" y="-5%" width="140%" height="115%">
            <feDropShadow dx="4" dy="8" stdDeviation="10" floodColor="#050a02" floodOpacity="0.30"/>
          </filter>
          <filter id="cloudGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7"/>
          </filter>
          <filter id="grassShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0a2a06" floodOpacity="0.2"/>
          </filter>
          <style>{`
            @keyframes swayTree{0%,100%{transform:rotate(-0.8deg)}50%{transform:rotate(0.8deg)}}
            @keyframes floatL{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
            @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
            @keyframes rainFall{0%{opacity:0;transform:translate(0,0)}15%{opacity:.75}85%{opacity:.55}100%{opacity:0;transform:translate(-10px,62px)}}
            @keyframes windBlow{0%,100%{opacity:0;transform:scaleX(.06)}42%,58%{opacity:.65;transform:scaleX(1)}}
            @keyframes grassSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
            @keyframes labelPop{0%{opacity:0;transform:scale(.75) translateY(4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
            .tree-body{animation:swayTree ease-in-out 5.5s infinite;transform-origin:500px 490px}
            .cloud-l{animation:floatL ease-in-out 7.5s infinite}
            .cloud-r{animation:floatR ease-in-out 9s 1.8s infinite}
            .rdrop{animation:rainFall linear infinite}
            .wline{animation:windBlow ease-in-out infinite;transform-origin:left center}
            .grass-group{animation:grassSway ease-in-out 3.8s infinite;transform-origin:500px 490px}
            .zone{cursor:pointer}
            .zone-hover-ring{opacity:0;transition:opacity .18s}
            .label-badge{animation:labelPop .2s ease-out both}
          `}</style>
        </defs>

        {/* ── SKY ─────────────────────────────────────────────── */}
        <rect x="0" y="0" width={VW} height={VH} fill="url(#skyG)"/>

        {/* Ambient ground glow */}
        <ellipse cx="500" cy={GY} rx="420" ry="55" fill="rgba(160,220,100,0.24)"/>

        {/* ── LEFT CLOUD — Marketing ─────────────────────────── */}
        {/* HUGE zone — entire left quarter */}
        <g className="cloud-l zone" onClick={e=>openZone("mkt",e)}
           onMouseEnter={()=>setHovered("mkt")} onMouseLeave={()=>setHovered(null)}>
          {/* glow halo */}
          <ellipse cx="180" cy="108" rx="148" ry="88" fill="white" opacity="0.16" filter="url(#cloudGlow)"/>
          {/* puffs — 7 overlapping circles */}
          <circle cx="172" cy="116" r="74" fill="white" opacity=".95"/>
          <circle cx="108" cy="128" r="56" fill="white" opacity=".92"/>
          <circle cx="236" cy="124" r="58" fill="white" opacity=".92"/>
          <circle cx="144" cy="88"  r="52" fill="white" opacity=".94"/>
          <circle cx="200" cy="82"  r="48" fill="white" opacity=".93"/>
          <circle cx="165" cy="64"  r="40" fill="white" opacity=".90"/>
          <circle cx="215" cy="70"  r="36" fill="white" opacity=".88"/>
          {/* pink tint at high mkt progress */}
          {mktProg>30&&<ellipse cx="178" cy="106" rx="100" ry="58" fill={`rgba(236,72,153,${(mktProg-30)/350})`}/>}
          {/* zone hover ring */}
          <ellipse cx="178" cy="106" rx="152" ry="92" fill="none" stroke="#f472b6"
            strokeWidth="3" strokeDasharray="8 5" className="zone-hover-ring" style={{opacity:hovered==="mkt"?.7:0}}/>
          {/* label */}
          <g className="label-badge" style={{display:hovered==="mkt"?"block":"none",pointerEvents:"none"}}>
            <rect x="96" y="156" width="164" height="32" rx="8" fill="rgba(236,72,153,0.92)"/>
            <text x="178" y="177" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">📣 Marketing {mktProg}%</text>
          </g>
          <text x="178" y="178" fill="#9d174d" fontSize="11" fontWeight="700" textAnchor="middle" opacity={hovered==="mkt"?0:.7}>📣 Marketing</text>
          {/* transparent hit area for entire cloud region */}
          <rect x="20" y="28" width="320" height="180" rx="16" fill="transparent"/>
        </g>

        {/* ── RIGHT CLOUD — Thiên thời ──────────────────────── */}
        <g className="cloud-r zone" onClick={e=>openZone("heaven",e)}
           onMouseEnter={()=>setHovered("heaven")} onMouseLeave={()=>setHovered(null)}>
          <ellipse cx="820" cy="104" rx="160" ry="90" fill="white" opacity="0.16" filter="url(#cloudGlow)"/>
          <circle cx="820" cy="112" r="80"  fill="white" opacity=".95"/>
          <circle cx="748" cy="126" r="60"  fill="white" opacity=".92"/>
          <circle cx="892" cy="122" r="62"  fill="white" opacity=".92"/>
          <circle cx="776" cy="84"  r="54"  fill="white" opacity=".94"/>
          <circle cx="844" cy="78"  r="52"  fill="white" opacity=".93"/>
          <circle cx="810" cy="60"  r="44"  fill="white" opacity=".90"/>
          <circle cx="858" cy="66"  r="38"  fill="white" opacity=".88"/>
          {hvIdx>40&&<ellipse cx="820" cy="100" rx="110" ry="64" fill={`rgba(14,165,233,${(hvIdx-40)/360})`}/>}
          <ellipse cx="820" cy="104" rx="164" ry="94" fill="none" stroke="#38bdf8"
            strokeWidth="3" strokeDasharray="8 5" className="zone-hover-ring" style={{opacity:hovered==="heaven"?.7:0}}/>
          <g className="label-badge" style={{display:hovered==="heaven"?"block":"none",pointerEvents:"none"}}>
            <rect x="718" y="156" width="204" height="32" rx="8" fill="rgba(14,165,233,0.92)"/>
            <text x="820" y="177" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">🌦 Thiên Thời {hvIdx}</text>
          </g>
          <text x="820" y="178" fill="#0369a1" fontSize="11" fontWeight="700" textAnchor="middle" opacity={hovered==="heaven"?0:.7}>🌦 Thiên Thời</text>
          <rect x="660" y="24" width="320" height="180" rx="16" fill="transparent"/>
        </g>

        {/* ── WIND LINES (left side) ─────────────────────────── */}
        {[{x:32,y:180,w:66,d:"0s",dr:"2.2s"},{x:22,y:208,w:80,d:".5s",dr:"2.6s"},
          {x:38,y:236,w:56,d:".8s",dr:"1.9s"},{x:18,y:264,w:70,d:".2s",dr:"2.4s"}
        ].map((wl,i)=>(
          <line key={i} className="wline" x1={wl.x} y1={wl.y} x2={wl.x+wl.w} y2={wl.y}
            stroke="rgba(138,200,240,0.65)" strokeWidth="2.8" strokeLinecap="round"
            style={{animationDelay:wl.d,animationDuration:wl.dr}}/>
        ))}

        {/* ── RAIN (right side, below right cloud) ──────────── */}
        {rainOn&&RAIN_DROPS.map((r,i)=>(
          <line key={i} className="rdrop" x1={r.x} y1={r.y} x2={r.x-3} y2={r.y+20}
            stroke="rgba(90,140,220,0.58)" strokeWidth="1.8" strokeLinecap="round"
            style={{animationDelay:`${r.del}s`,animationDuration:`${r.dur}s`}}/>
        ))}

        {/* ═══════════════════════════════════════════════════
            TREE BODY (all animated together with sway)
        ═══════════════════════════════════════════════════ */}
        <g className="tree-body" filter="url(#canopyShadow)">

          {/* ── CANOPY BLOBS: SHADOW LAYER ─────────────────── */}
          {/* Piano left */}
          {PIANO_BLOBS.filter(b=>b.shade===0).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={CANOPY_COLORS[0]}/>
          ))}
          {/* Assistant right */}
          {ASST_BLOBS.filter(b=>b.shade===0).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={CANOPY_COLORS[0]}/>
          ))}
          {/* Tech center */}
          {TECH_BLOBS.filter(b=>b.shade===0).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={CANOPY_COLORS[0]}/>
          ))}
          {/* Mid blobs */}
          {MID_BLOBS.filter(b=>b.shade===0).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={CANOPY_COLORS[0]}/>
          ))}
          {LOW_BLOBS.filter(b=>b.shade===0).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={CANOPY_COLORS[0]}/>
          ))}

          {/* ── BRANCHES (behind mid canopy) ────────────────── */}
          <path d={L_BRANCH}      fill={trunkC}/>
          <path d={L_BRANCH2}     fill={trunkA}/>
          <path d={R_BRANCH}      fill={trunkC}/>
          <path d={R_BRANCH2}     fill={trunkA}/>
          <path d={MID_L_BRANCH}  fill={trunkC}/>
          <path d={MID_R_BRANCH}  fill={trunkC}/>
          <path d={LOW_L_BRANCH}  fill={trunkC} opacity=".9"/>
          <path d={LOW_R_BRANCH}  fill={trunkC} opacity=".9"/>

          {/* ── TRUNK ───────────────────────────────────────── */}
          <path d={TRUNK} fill="url(#trunkG)" filter="url(#trunkShadow)"/>
          <path d={TRUNK} fill="url(#barkPat)" opacity=".3"/>
          {/* trunk highlight sheen */}
          <path d={`M 464,490 C 463,425 463,355 464,290 C 465,255 466,230 467,210 L 472,205 L 474,205 C 475,230 476,255 476,290 C 477,355 477,425 476,490 Z`}
            fill="rgba(220,165,82,0.16)"/>
          {/* glow behind trunk */}
          <ellipse cx="500" cy="350" rx="62" ry="160" fill="url(#trunkGlow)"/>

          {/* ── CANOPY BLOBS: MID LAYER ─────────────────────── */}
          {PIANO_BLOBS.filter(b=>b.shade===1).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(1,i)}/>
          ))}
          {ASST_BLOBS.filter(b=>b.shade===1).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(1,i)}/>
          ))}
          {TECH_BLOBS.filter(b=>b.shade===1).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(1,i)}/>
          ))}
          {MID_BLOBS.filter(b=>b.shade===1).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(1,i)}/>
          ))}
          {LOW_BLOBS.filter(b=>b.shade===1).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(1,i)}/>
          ))}

          {/* ── CANOPY BLOBS: HIGHLIGHT LAYER ───────────────── */}
          {PIANO_BLOBS.filter(b=>b.shade===2).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(2,i)}/>
          ))}
          {ASST_BLOBS.filter(b=>b.shade===2).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(2,i)}/>
          ))}
          {TECH_BLOBS.filter(b=>b.shade===2).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(2,i)}/>
          ))}
          {MID_BLOBS.filter(b=>b.shade===2).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(2,i)}/>
          ))}
          {LOW_BLOBS.filter(b=>b.shade===2).map((b,i)=>(
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={shadeColor(2,i)}/>
          ))}

          {/* ── CANOPY SPECULAR DOTS (highlights) ───────────── */}
          {[[240,58,28],[500,62,32],[762,58,28],[450,96,22],[554,90,22],[240,88,18],[762,88,18]].map(([cx,cy,r],i)=>(
            <circle key={i} cx={cx} cy={cy} r={r} fill={CANOPY_COLORS[6]} opacity=".55"/>
          ))}

          {/* ── ROOTS ───────────────────────────────────────── */}
          {ROOTS.map((d,i)=>(
            <path key={i} d={d} fill="url(#rootG)" opacity={.85+hrProg/100*.15}/>
          ))}
          {/* root highlight */}
          {ROOTS.map((d,i)=>(
            <path key={`h${i}`} d={d} fill="rgba(200,130,60,0.16)"/>
          ))}

        </g>{/* end tree-body */}

        {/* ── GROUND / SOIL LINE ────────────────────────────── */}
        <rect x="0" y={GY} width={VW} height="28" fill="url(#soilG)"/>
        {[9,18,26].map(dy=><line key={dy} x1="0" y1={GY+dy} x2={VW} y2={GY+dy} stroke="rgba(0,0,0,.05)" strokeWidth="1"/>)}

        {/* ── GRASS ─────────────────────────────────────────── */}
        <g className="grass-group zone" filter="url(#grassShadow)"
           onClick={e=>openZone("partnerships",e)}
           onMouseEnter={()=>setHovered("partnerships")} onMouseLeave={()=>setHovered(null)}>
          {blades.map((bl,i)=>(
            <path key={i} d={`M ${bl.lx},${GY} Q ${bl.bx},${GY-bl.h} ${bl.rx},${GY}`}
              fill={bl.col} opacity=".88"/>
          ))}
          {/* wide transparent click zone */}
          <rect x="0" y={GY-28} width={VW} height="36" fill="transparent"/>
        </g>
        <text x="500" y={GY-8} textAnchor="middle" fill="rgba(20,90,30,.62)"
          fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>
          🌿 Hợp tác · {app.partners.length} đối tác
        </text>

        {/* ── UNDERGROUND / MARKET ──────────────────────────── */}
        <rect x="0" y={GY+28} width={VW} height={VH-GY-28}
          fill="url(#underG)" className="zone"
          onClick={e=>openZone("market",e)}
          onMouseEnter={()=>setHovered("market")} onMouseLeave={()=>setHovered(null)}/>
        {/* pebbles */}
        {Array.from({length:20},(_,i)=>{const r=mkRng(i*71);return{x:r()*VW,y:GY+34+r()*55,rx:2+r()*6,ry:1.5+r()*3}}).map((s,i)=>(
          <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={`rgba(100,60,14,${.08+mkRng(i*53)()*0.14})`}/>
        ))}
        {/* partner labels */}
        {[{x:112,icon:"📦",label:"Nhà cung cấp",c:"#f59e0b"},{x:316,icon:"👥",label:"HR Partners",c:"#a78bfa"},
          {x:618,icon:"🎓",label:"Kiến thức",c:"#34d399"},{x:858,icon:"💰",label:"Tài chính",c:"#60a5fa"}
        ].map((lb,i)=>(
          <text key={i} x={lb.x} y={GY+52} textAnchor="middle" fill={lb.c}
            fontSize="11" fontWeight="700" className="zone" style={{cursor:"pointer"}}
            onClick={e=>openZone("partnerships",e)}>{lb.icon} {lb.label}</text>
        ))}
        <text x="500" y={GY+82} textAnchor="middle" fill="rgba(255,255,255,.25)"
          fontSize="9" letterSpacing="2" style={{pointerEvents:"none"}}>
          🌍 THỊ TRƯỜNG (ĐẤT) · Market Index: {mkIdx}
        </text>

        {/* ══════════════════════════════════════════════════
            CLICK ZONES — large invisible overlays on canopy
        ══════════════════════════════════════════════════ */}

        {/* PIANO — left canopy, large ellipse */}
        <ellipse cx="238" cy="92" rx="176" ry="135" fill="transparent" className="zone"
          onClick={e=>openZone("piano",e)}
          onMouseEnter={()=>setHovered("piano")} onMouseLeave={()=>setHovered(null)}/>

        {/* ASSISTANT — right canopy */}
        <ellipse cx="762" cy="92" rx="176" ry="135" fill="transparent" className="zone"
          onClick={e=>openZone("assistant",e)}
          onMouseEnter={()=>setHovered("assistant")} onMouseLeave={()=>setHovered(null)}/>

        {/* TECH — central canopy */}
        <ellipse cx="500" cy="135" rx="180" ry="148" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>

        {/* TECH — mid branch blobs */}
        <ellipse cx="325" cy="240" rx="110" ry="72" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>
        <ellipse cx="682" cy="236" rx="110" ry="72" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>

        {/* TECH — low branch blobs */}
        <ellipse cx="344" cy="338" rx="90" ry="62" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>
        <ellipse cx="656" cy="334" rx="90" ry="62" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>

        {/* TRUNK click zone — wide rect */}
        <rect x="390" y="188" width="220" height="302" rx="16" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>

        {/* ROOTS / HR — full width band below trunk */}
        <rect x="100" y={GY} width="800" height="82" fill="transparent" className="zone"
          onClick={e=>openZone("hr",e)}
          onMouseEnter={()=>setHovered("hr")} onMouseLeave={()=>setHovered(null)}/>

        {/* ── HOVER LABELS (above click zones) ──────────────── */}
        <HoverLabel zone="piano"        x={238} y={26}/>
        <HoverLabel zone="assistant"    x={762} y={26}/>
        <HoverLabel zone="tech"         x={500} y={50}/>
        <HoverLabel zone="partnerships" x={500} y={GY-34}/>
        <HoverLabel zone="hr"           x={500} y={GY+4} above={false}/>
        <HoverLabel zone="market"       x={500} y={GY+38} above={false}/>

        {/* Trunk label */}
        <g style={{pointerEvents:"none"}}>
          <text x="500" y="330" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="9" fontWeight="700" letterSpacing="1.8">TECH CORE</text>
          <text x="500" y="345" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8">
            {app.projects.filter(p=>p.status==="live").length} live / {app.projects.length}
          </text>
        </g>
      </svg>

      {/* ── MINI POPUP ─────────────────────────────────────── */}
      {popup&&(()=>{
        const tid=ZONE_META[popup.zone].teamId;
        const s=tid?gs(tid):{done:0,total:0,overdue:0};
        const p=tid?gp(tid):0;
        const extra=
          popup.zone==="heaven"      ?`🌦 Index: ${hvIdx}  ·  Mưa: ${rainOn?"Bật 🔵":"Tắt ⚪"}`:
          popup.zone==="market"      ?`📈 Market Index: ${mkIdx}`:
          popup.zone==="partnerships"?`🤝 ${app.partners.length} đối tác · ${app.partners.filter(pt=>pt.status==="active").length} active`:
          undefined;
        return(
          <MiniPopup popup={popup} onClose={()=>setPopup(null)} onDetail={()=>openFull(popup.zone)}
            prog={p} done={s.done} total={s.total} overdue={s.overdue} extra={extra}/>
        );
      })()}

      {/* ── FULL PANEL ─────────────────────────────────────── */}
      {fullPanel&&<FullPanel zone={fullPanel} onClose={()=>setFullPanel(null)}/>}
    </div>
  );
}
