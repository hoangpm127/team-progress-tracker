"use client";
import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
//  UTILS
// ─────────────────────────────────────────────────────────────
function mkRng(seed:number){let s=seed;return()=>{s|=0;s=s+0x6d2b79f5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}

const Q1_START=+new Date("2026-01-01"),Q1_END=+new Date("2026-03-31"),TODAY_TS=+new Date("2026-02-25");
const ELAPSED=Math.round(Math.min(1,(TODAY_TS-Q1_START)/(Q1_END-Q1_START))*100);
function healthOf(prog:number){
  const r=ELAPSED>0?prog/ELAPSED:1;
  if(r>=0.80)return{label:"Đúng tiến độ",color:"#10b981",dot:"🟢"};
  if(r>=0.50)return{label:"Hơi chậm",    color:"#f59e0b",dot:"🟡"};
  return           {label:"Nguy hiểm",   color:"#ef4444",dot:"🔴"};
}

// ─────────────────────────────────────────────────────────────
//  TREE GEOMETRY  (viewBox 1000 × 640)
// ─────────────────────────────────────────────────────────────
const VW=1000,VH=640,GY=510;

const TRUNK_PATH=`M 463,${GY} C 458,432 453,302 454,192 C 455,175 458,162 460,157 L 468,157 C 470,162 473,175 474,192 C 475,302 470,432 465,${GY} Z`;

const BARK_LINES=[
  `M 455,${GY-12} C 453,425 451,315 452,212`,
  `M 459,${GY-8}  C 458,428 457,322 458,226`,
  `M 463,${GY-6}  C 463,432 463,328 463,230`,
  `M 467,${GY-8}  C 468,428 469,322 468,226`,
  `M 471,${GY-12} C 473,425 475,315 472,212`,
];

// Branches: all rendered as stroked paths for a natural wood look
const BRANCHES=[
  // right top (assistant)
  {d:`M 469,192 C 509,182 568,154 638,122`,    w:16, zone:"assistant" as ZoneId},
  {d:`M 638,122 C 664,110 692,96  714,86`,     w: 8, zone:"assistant" as ZoneId},
  {d:`M 638,122 C 654,102 663,78  668,64`,     w: 7, zone:"assistant" as ZoneId},
  // left top (piano)
  {d:`M 459,205 C 419,193 361,162 294,130`,    w:16, zone:"piano"     as ZoneId},
  {d:`M 294,130 C 266,116 240,100 218,88`,     w: 8, zone:"piano"     as ZoneId},
  {d:`M 294,130 C 278,108 266,82  262,66`,     w: 7, zone:"piano"     as ZoneId},
  // right mid (tech)
  {d:`M 470,258 C 509,252 562,238 608,216`,    w:12, zone:"tech"      as ZoneId},
  {d:`M 608,216 C 634,202 658,185 672,168`,    w: 6, zone:"tech"      as ZoneId},
  {d:`M 608,216 C 626,196 639,174 642,156`,    w: 6, zone:"tech"      as ZoneId},
  // left mid (tech)
  {d:`M 458,272 C 418,264 366,250 320,228`,    w:12, zone:"tech"      as ZoneId},
  {d:`M 320,228 C 294,212 269,194 254,176`,    w: 6, zone:"tech"      as ZoneId},
  {d:`M 320,228 C 304,206 292,182 288,164`,    w: 6, zone:"tech"      as ZoneId},
  // right low
  {d:`M 471,334 C 507,330 548,318 582,302`,    w: 9, zone:"tech"      as ZoneId},
  {d:`M 582,302 C 604,290 622,274 634,258`,    w: 5, zone:"tech"      as ZoneId},
  // left low
  {d:`M 457,346 C 421,340 380,328 346,312`,    w: 9, zone:"tech"      as ZoneId},
  {d:`M 346,312 C 322,298 302,280 288,264`,    w: 5, zone:"tech"      as ZoneId},
  // bottom twigs
  {d:`M 471,406 C 499,408 526,400 548,386`,    w: 7, zone:"tech"      as ZoneId},
  {d:`M 457,416 C 429,418 404,410 384,396`,    w: 7, zone:"tech"      as ZoneId},
];

// Leaf clusters
const LEAF_CLUSTERS=[
  // assistant tips
  {cx:714,cy: 86,r:50,n:28,zone:"assistant"},{cx:668,cy: 64,r:44,n:24,zone:"assistant"},
  {cx:650,cy:110,r:40,n:22,zone:"assistant"},{cx:690,cy:132,r:36,n:20,zone:"assistant"},
  // piano tips
  {cx:218,cy: 88,r:50,n:28,zone:"piano"},    {cx:262,cy: 66,r:44,n:24,zone:"piano"},
  {cx:278,cy:110,r:40,n:22,zone:"piano"},    {cx:246,cy:136,r:36,n:20,zone:"piano"},
  // tech right
  {cx:672,cy:166,r:40,n:22,zone:"tech"},     {cx:642,cy:154,r:36,n:20,zone:"tech"},
  {cx:618,cy:194,r:34,n:18,zone:"tech"},
  // tech left
  {cx:254,cy:174,r:40,n:22,zone:"tech"},     {cx:288,cy:162,r:36,n:20,zone:"tech"},
  {cx:308,cy:206,r:34,n:18,zone:"tech"},
  // tech lower right
  {cx:636,cy:254,r:32,n:17,zone:"tech"},     {cx:550,cy:298,r:30,n:15,zone:"tech"},
  // tech lower left
  {cx:286,cy:260,r:32,n:17,zone:"tech"},     {cx:346,cy:308,r:30,n:15,zone:"tech"},
  // tech bottom
  {cx:550,cy:378,r:28,n:14,zone:"tech"},     {cx:382,cy:388,r:28,n:14,zone:"tech"},
  // central canopy
  {cx:462,cy:158,r:56,n:32,zone:"tech"},     {cx:438,cy:192,r:46,n:26,zone:"tech"},
  {cx:486,cy:192,r:46,n:26,zone:"tech"},     {cx:462,cy:232,r:40,n:22,zone:"tech"},
];

const LEAF_GREENS=["#266b34","#2e7d3e","#388e50","#3fa85e","#4caf65","#52c46a","#2a6e3e","#347a48","#3d9648"];
interface Leaf{x:number;y:number;rx:number;ry:number;rot:number;op:number;col:string}
function genLeaves(cx:number,cy:number,r:number,n:number,seed:number):Leaf[]{
  const rng=mkRng(seed);
  return Array.from({length:n},()=>({
    x:cx+(rng()-.5)*r*2.1,y:cy+(rng()-.5)*r*1.7,
    rx:8+rng()*8,ry:5+rng()*5,rot:rng()*180,
    op:.5+rng()*.45,col:LEAF_GREENS[Math.floor(rng()*LEAF_GREENS.length)],
  }));
}

const ROOTS=[
  {d:`M 454,${GY} C 418,${GY+16} 372,${GY+34} 318,${GY+50} C 274,${GY+62} 236,${GY+68} 208,${GY+74}`,w:13},
  {d:`M 457,${GY} C 428,${GY+12} 402,${GY+26} 374,${GY+38} C 344,${GY+50} 314,${GY+56} 294,${GY+60}`,w: 9},
  {d:`M 462,${GY} L 462,${GY+78}`,w:17},
  {d:`M 467,${GY} C 496,${GY+12} 522,${GY+26} 550,${GY+38} C 580,${GY+50} 610,${GY+56} 630,${GY+60}`,w: 9},
  {d:`M 470,${GY} C 508,${GY+16} 552,${GY+34} 606,${GY+50} C 650,${GY+62} 688,${GY+68} 716,${GY+74}`,w:13},
];

const RAIN_DROPS=Array.from({length:24},(_,i)=>{const r=mkRng(i*137);return{x:636+r()*196,y:24+r()*120,del:r()*1.6,dur:.5+r()*.45};});

const PARTNER_CATS=[
  {id:1,label:"Nhà cung cấp",icon:"📦",color:"#f59e0b",x:110},
  {id:2,label:"HR Partners", icon:"👥",color:"#a78bfa",x:308},
  {id:3,label:"Kiến thức",   icon:"🎓",color:"#34d399",x:616},
  {id:4,label:"Tài chính",   icon:"💰",color:"#60a5fa",x:854},
];

// ─────────────────────────────────────────────────────────────
//  MINI POPUP (floating card at screen coords)
// ─────────────────────────────────────────────────────────────
interface PopupState{zone:ZoneId;sx:number;sy:number}

function MiniPopup({popup,onClose,onDetail,prog,done,total,overdue,extra}:
  {popup:PopupState;onClose():void;onDetail():void;prog:number;done:number;total:number;overdue:number;extra?:string}) {
  const meta=ZONE_META[popup.zone];
  const h=healthOf(prog);
  // keep card inside window
  const left=Math.min(popup.sx+16,window.innerWidth-252);
  const top =Math.max(popup.sy-10,8);
  return (
    <div data-popup="1" className="fixed z-50 rounded-xl shadow-2xl overflow-hidden"
      style={{left,top,width:240,border:`1.5px solid ${meta.border}`,background:"rgba(8,12,26,0.97)"}}>
      {/* header */}
      <div className="flex items-center gap-2 px-3 py-2.5"
        style={{background:`${meta.color}1a`,borderBottom:`1px solid ${meta.border}33`}}>
        <span className="text-xl leading-none">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm">{meta.title}</div>
          <div className="text-xs mt-0.5 truncate" style={{color:`${meta.color}bb`}}>{meta.subtitle}</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl ml-1">×</button>
      </div>
      {/* progress */}
      {meta.teamId && (
        <div className="px-3 pt-2.5 pb-1.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Tiến độ Q1</span>
            <span className="text-sm font-bold" style={{color:meta.color}}>{prog}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-2 rounded-full transition-all"
              style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}77,${meta.color})`}}/>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400">✅ {done}/{total} tasks</span>
            {overdue>0 && <span className="text-xs text-red-400">⚠ {overdue} quá hạn</span>}
          </div>
          <div className="mt-1 text-xs" style={{color:h.color}}>{h.dot} {h.label}</div>
        </div>
      )}
      {extra && <div className="px-3 py-1.5 text-xs text-slate-300 border-t border-white/5">{extra}</div>}
      {/* CTA */}
      <div className="px-3 py-2.5 border-t border-white/5">
        <button onClick={onDetail}
          className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
          style={{background:meta.color}}>
          📋 Xem chi tiết →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FULL SIDE PANEL
// ─────────────────────────────────────────────────────────────
function FullPanel({zone,onClose}:{zone:ZoneId;onClose():void}){
  const app=useApp();
  const meta=ZONE_META[zone];
  const teamId=meta.teamId;
  const tasks=teamId?app.getTeamTasks(teamId):[];
  const stats=teamId?app.getTeamStats(teamId):{done:0,total:0,overdue:0};
  const prog=teamId?app.getTeamProgress(teamId):0;
  const acts=teamId?app.getTeamActivity(teamId).slice(0,6):[];
  const today=new Date().toISOString().split("T")[0];
  const h=healthOf(prog);
  const SC:{[k:string]:string}={Todo:"#64748b",Doing:"#3b82f6",Done:"#10b981"};
  const SL:{[k:string]:string}={Todo:"Chờ làm",Doing:"Đang làm",Done:"Hoàn thành"};

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-hidden"
           style={{borderLeft:`3px solid ${meta.color}`}}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 shrink-0"
             style={{background:`${meta.color}12`,borderBottom:`1px solid ${meta.color}28`}}>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-2xl">{meta.icon}</span>
              <span className="font-bold text-slate-800 text-lg">{meta.title}</span>
            </div>
            <p className="text-xs text-slate-500">{meta.subtitle}</p>
            {teamId && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Tiến độ Q1</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{color:h.color}}>{h.dot} {h.label}</span>
                    <span className="font-bold text-base" style={{color:meta.color}}>{prog}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all"
                    style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}88,${meta.color})`}}/>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>✅ {stats.done}/{stats.total} tasks</span>
                  {stats.overdue>0 && <span className="text-red-500">⚠ {stats.overdue} quá hạn</span>}
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-3 mt-0.5">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Tech — 30 dự án */}
          {zone==="tech" && (
            <div>
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
                  const m:{[k:string]:{dot:string;bg:string;tc:string}}={
                    live:    {dot:"🟢",bg:"#f0fdf4",tc:"#166534"},
                    building:{dot:"🔨",bg:"#fffbeb",tc:"#92400e"},
                    idea:    {dot:"💡",bg:"#f8fafc",tc:"#475569"},
                  };
                  const {dot,bg,tc}=m[p.status];
                  return (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{background:bg}}>
                      <span className="text-sm shrink-0">{dot}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{color:tc}}>{p.name}</div>
                        <div className="text-xs text-slate-400">{p.owner}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Partnerships */}
          {zone==="partnerships" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">4 Nhóm Đối Tác</h3>
              {PARTNER_CATS.map(cat=>{
                const list=app.partners.filter(p=>p.category===cat.id);
                return (
                  <div key={cat.id} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{cat.icon}</span>
                      <span className="text-sm font-semibold" style={{color:cat.color}}>{cat.label}</span>
                      <span className="ml-auto text-xs text-slate-400">
                        {list.filter(p=>p.status==="active").length}/{list.length} active
                      </span>
                    </div>
                    {list.length===0
                      ? <p className="text-xs text-slate-400 italic pl-5">Chưa có dữ liệu (cần chạy extend.sql)</p>
                      : <div className="space-y-1 pl-5">
                          {list.map(p=>(
                            <div key={p.id} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{background:p.status==="active"?"#10b981":"#94a3b8"}}/>
                              <span className="text-xs text-slate-600 flex-1">{p.name}</span>
                              <span className="text-xs text-slate-400">{p.status==="active"?"Active":"Pipeline"}</span>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                );
              })}
            </div>
          )}

          {/* Market */}
          {zone==="market" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chỉ Số Thị Trường</h3>
              <div className="rounded-xl p-4 mb-3" style={{background:"#fef3c7",border:"1px solid #fde68a"}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-amber-800">Market Index</span>
                  <span className="text-3xl font-bold text-amber-900">{app.market.marketIndex}</span>
                </div>
                <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full"
                    style={{width:`${app.market.marketIndex}%`,background:"linear-gradient(90deg,#f59e0b,#d97706)"}}/>
                </div>
              </div>
              {app.market.notes && (
                <p className="text-xs text-slate-600 bg-amber-50 rounded-lg p-3 border border-amber-100 leading-relaxed">
                  {app.market.notes}
                </p>
              )}
            </div>
          )}

          {/* Heaven */}
          {zone==="heaven" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thiên Thời</h3>
              <div className="rounded-xl p-4 mb-4" style={{background:"#f0f9ff",border:"1px solid #bae6fd"}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-sky-800">Heaven Timing Index</span>
                  <span className="text-3xl font-bold text-sky-900">{app.heavenTiming.heavenTimingIndex}</span>
                </div>
                <div className="h-3 bg-sky-100 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full"
                    style={{width:`${app.heavenTiming.heavenTimingIndex}%`,background:"linear-gradient(90deg,#38bdf8,#0ea5e9)"}}/>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-sm text-slate-700">🌧 Hiệu ứng mưa</span>
                <button
                  onClick={()=>app.setHeavenTiming({rainEnabled:!app.heavenTiming.rainEnabled})}
                  className={`relative w-11 h-6 rounded-full transition-colors ${app.heavenTiming.rainEnabled?"bg-sky-400":"bg-slate-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${app.heavenTiming.rainEnabled?"translate-x-5":"translate-x-0.5"}`}/>
                </button>
              </div>
            </div>
          )}

          {/* Tasks (all team zones) */}
          {teamId && tasks.length>0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Công Việc ({tasks.length})
              </h3>
              <div className="space-y-2">
                {tasks.map(t=>{
                  const over=!t.done&&t.deadline<today;
                  return (
                    <div key={t.id}
                      className={`flex gap-2.5 p-2.5 rounded-lg border ${t.done?"bg-green-50 border-green-100":over?"bg-red-50 border-red-100":"bg-slate-50 border-slate-100"}`}>
                      <button onClick={()=>app.toggleTask(t.id,"Tree")}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${t.done?"bg-green-500 border-green-500 text-white":"border-slate-300"}`}>
                        {t.done && <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" strokeWidth="1.8" stroke="currentColor"><path d="M1.5 5.5L4 8 8.5 2"/></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug ${t.done?"line-through text-slate-400":"text-slate-700"}`}>{t.title}</p>
                        <div className="flex flex-wrap gap-x-2 mt-0.5">
                          <span className="text-xs" style={{color:SC[t.status]}}>{SL[t.status]}</span>
                          <span className="text-xs text-slate-400">· Hạn {t.deadline}</span>
                          {over && <span className="text-xs text-red-500 font-medium">⚠ Quá hạn</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity */}
          {acts.length>0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hoạt Động Gần Đây</h3>
              <div className="space-y-2">
                {acts.map(a=>(
                  <div key={a.id} className="flex gap-2 text-xs text-slate-500">
                    <span className="text-slate-300 shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

  // Close popup on outside click
  useEffect(()=>{
    const fn=(e:MouseEvent)=>{
      if(popup&&!(e.target as Element).closest("[data-popup]")) setPopup(null);
    };
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[popup]);

  const openZone=useCallback((zone:ZoneId,e:React.MouseEvent)=>{
    e.stopPropagation();
    setPopup(p=>p?.zone===zone?null:{zone,sx:e.clientX,sy:e.clientY});
    setFullPanel(null);
  },[]);
  const openFull=useCallback((zone:ZoneId)=>{setFullPanel(zone);setPopup(null);},[]);

  // Progress
  const gp=(id:string)=>app.getTeamProgress(id);
  const gs=(id:string)=>app.getTeamStats(id);
  const techProg =gp("tech"), hrProg=gp("hr"), mktProg=gp("mkt"), partProg=gp("partnerships");
  const asstProg =gp("assistant"), pianoProg=gp("piano");
  const rainOn=app.heavenTiming.rainEnabled, mkIdx=app.market.marketIndex, hvIdx=app.heavenTiming.heavenTimingIndex;

  // Leaves
  const allLeaves=useMemo(()=>LEAF_CLUSTERS.flatMap((c,i)=>genLeaves(c.cx,c.cy,c.r,c.n,i*997)),[]);

  // Grass
  const blades=useMemo(()=>Array.from({length:Math.round(28+partProg*.6)},(_,i)=>{
    const r=mkRng(i*13);const bx=r()*VW;const h=12+r()*20;
    return{bx,h,lx:bx-3-r()*5,rx:bx+3+r()*5,col:["#2d6e24","#358029","#3d9430","#2c6520"][i%4]};
  }),[partProg]);

  // Trunk colour (green-tinted at high progress)
  const tL=`hsl(24,${40+techProg*.2}%,${28+techProg*.1}%)`;
  const tD=`hsl(20,${35+techProg*.2}%,${16+techProg*.08}%)`;
  const soilH=26+mkIdx*.06;
  const sL=`hsl(${soilH},42%,${26+mkIdx*.1}%)`;
  const sD=`hsl(${soilH},36%,14%)`;

  // Helper to render a label badge at a branch tip on hover
  const HoverLabel=({zone,x,y,above=true}:{zone:ZoneId;x:number;y:number;above?:boolean})=>{
    if(hovered!==zone) return null;
    const meta=ZONE_META[zone];
    const p=gp(zone);
    const hh=healthOf(p);
    const by=above?y-16:y+28;
    return (
      <g style={{pointerEvents:"none",animation:"badgePop .25s ease-out both"}}>
        <rect x={x-74} y={by-18} width={148} height={34} rx="6"
          fill="rgba(8,12,26,0.92)" stroke={meta.border} strokeWidth="1.2"/>
        <text x={x} y={by-2} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
          {meta.icon} {meta.title}
        </text>
        <text x={x} y={by+12} textAnchor="middle" fontSize="9.5" fontWeight="500" fill={meta.color}>
          {p}% · {hh.dot} {hh.label}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full" style={{background:"#e8f4fd"}}>
      {/* top bar */}
      <div className="absolute top-2 right-3 z-10 flex gap-2">
        <button onClick={()=>app.setHeavenTiming({rainEnabled:!rainOn})}
          className="px-2.5 py-1 rounded-lg text-xs font-medium border shadow-sm transition-colors"
          style={{background:rainOn?"#0ea5e9":"white",color:rainOn?"white":"#475569",borderColor:rainOn?"#38bdf8":"#e2e8f0"}}>
          {rainOn?"🌧 Tắt mưa":"☀️ Bật mưa"}
        </button>
        <button onClick={()=>openFull("market")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-amber-200 text-amber-700 shadow-sm hover:bg-amber-50 transition-colors">
          🌍 Market {mkIdx}
        </button>
        <button onClick={()=>openFull("heaven")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-sky-200 text-sky-700 shadow-sm hover:bg-sky-50 transition-colors">
          🌦 Heaven {hvIdx}
        </button>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
           className="w-full h-full" style={{display:"block"}}>
        <defs>
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#b8daf0"/><stop offset="55%" stopColor="#d8f2e0"/><stop offset="100%" stopColor="#aed49c"/>
          </linearGradient>
          <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#2e1404"/>
            <stop offset="28%" stopColor={tD}/>
            <stop offset="50%" stopColor={tL}/>
            <stop offset="72%" stopColor={tD}/>
            <stop offset="100%" stopColor="#2e1404"/>
          </linearGradient>
          <linearGradient id="branchG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#4a280e"/><stop offset="100%" stopColor="#8a5428"/>
          </linearGradient>
          <linearGradient id="rootG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#7a4822"/><stop offset="100%" stopColor="#1e0c02"/>
          </linearGradient>
          <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={sL}/><stop offset="100%" stopColor={sD}/>
          </linearGradient>
          <linearGradient id="underG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#180a02"/><stop offset="100%" stopColor="#0a0402"/>
          </linearGradient>
          <radialGradient id="canopyAura" cx="50%" cy="35%" r="56%">
            <stop offset="0%"  stopColor="#4caf65" stopOpacity="0.20"/>
            <stop offset="100%" stopColor="#1e6030" stopOpacity="0"/>
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#003010" floodOpacity="0.16"/>
          </filter>
          <filter id="cloudShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6"/>
          </filter>
          <style>{`
            @keyframes sway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
            @keyframes floatL{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
            @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
            @keyframes rainA{0%{opacity:0;transform:translate(0,0)}12%{opacity:.72}88%{opacity:.54}100%{opacity:0;transform:translate(-9px,56px)}}
            @keyframes windA{0%,100%{opacity:0;transform:scaleX(.08)}44%,56%{opacity:.62;transform:scaleX(1)}}
            @keyframes badgePop{0%{opacity:0;transform:scale(.82)}100%{opacity:1;transform:scale(1)}}
            @keyframes pulse{0%,100%{opacity:.22}50%{opacity:.45}}
            .leaf-sway{animation:sway ease-in-out 4.8s infinite;transform-origin:462px 510px}
            .cloud-l{animation:floatL ease-in-out 7s infinite}
            .cloud-r{animation:floatR ease-in-out 8.2s 1.4s infinite}
            .raindrop{animation:rainA linear infinite}
            .wline{animation:windA ease-in-out infinite;transform-origin:left center}
            .zone{cursor:pointer}
            .zone:hover > .zone-highlight{opacity:1}
            .zone-highlight{opacity:0;transition:opacity .2s}
            .pulsing{animation:pulse ease-in-out 2.6s infinite}
          `}</style>
        </defs>

        {/* SKY */}
        <rect x="0" y="0" width={VW} height={VH} fill="url(#skyG)"/>

        {/* ── LEFT CLOUD — Marketing ───────────────────────── */}
        <g className="cloud-l zone" onClick={e=>openZone("mkt",e)}
           onMouseEnter={()=>setHovered("mkt")} onMouseLeave={()=>setHovered(null)}>
          {/* soft glow shadow */}
          <ellipse cx="174" cy="104" rx="120" ry="66" fill="white" opacity="0.12" filter="url(#cloudShadow)"/>
          {/* cloud puffs */}
          <ellipse cx="158" cy="110" rx="85"  ry="48" fill="white" opacity="0.94"/>
          <ellipse cx="108" cy="120" rx="58"  ry="37" fill="white" opacity="0.90"/>
          <ellipse cx="208" cy="116" rx="60"  ry="34" fill="white" opacity="0.90"/>
          <ellipse cx="140" cy="82"  rx="52"  ry="35" fill="white" opacity="0.92"/>
          <ellipse cx="183" cy="76"  rx="46"  ry="30" fill="white" opacity="0.90"/>
          <ellipse cx="158" cy="63"  rx="34"  ry="23" fill="white" opacity="0.88"/>
          {/* pink tint scaled with mkt progress */}
          {mktProg>35 && <ellipse cx="165" cy="100" rx="82" ry="44" fill={`rgba(236,72,153,${(mktProg-35)/420})`}/>}
          {/* label */}
          <text x="164" y={hovered==="mkt"?100:152} textAnchor="middle"
            fill={hovered==="mkt"?"#be185d":"#be185d"} fontSize={hovered==="mkt"?13:10.5}
            fontWeight="700" opacity={hovered==="mkt"?1:.75} style={{pointerEvents:"none",transition:"all .2s"}}>
            {hovered==="mkt"?`📣 Marketing ${mktProg}%`:"📣 Marketing"}
          </text>
          {/* hover highlight ring */}
          <ellipse cx="174" cy="104" rx="122" ry="68" fill="rgba(236,72,153,0)" stroke="#f472b6"
            strokeWidth="2.5" strokeDasharray="6 4" className="zone-highlight" style={{opacity:hovered==="mkt"?.6:0}}/>
        </g>

        {/* ── RIGHT CLOUD — Thiên thời ─────────────────────── */}
        <g className="cloud-r zone" onClick={e=>openZone("heaven",e)}
           onMouseEnter={()=>setHovered("heaven")} onMouseLeave={()=>setHovered(null)}>
          <ellipse cx="792" cy="96"  rx="136" ry="74" fill="white" opacity="0.12" filter="url(#cloudShadow)"/>
          <ellipse cx="790" cy="101" rx="100" ry="52" fill="white" opacity="0.94"/>
          <ellipse cx="722" cy="112" rx="64"  ry="37" fill="white" opacity="0.90"/>
          <ellipse cx="858" cy="108" rx="66"  ry="35" fill="white" opacity="0.90"/>
          <ellipse cx="764" cy="72"  rx="54"  ry="33" fill="white" opacity="0.92"/>
          <ellipse cx="820" cy="68"  rx="48"  ry="30" fill="white" opacity="0.90"/>
          <ellipse cx="788" cy="55"  rx="35"  ry="23" fill="white" opacity="0.88"/>
          {hvIdx>45 && <ellipse cx="788" cy="93" rx="94" ry="46" fill={`rgba(14,165,233,${(hvIdx-45)/380})`}/>}
          <text x="788" y={hovered==="heaven"?97:154} textAnchor="middle"
            fill="#0369a1" fontSize={hovered==="heaven"?13:10.5}
            fontWeight="700" opacity={hovered==="heaven"?1:.75} style={{pointerEvents:"none",transition:"all .2s"}}>
            {hovered==="heaven"?`🌦 Thiên Thời ${hvIdx}`:"🌦 Thiên Thời"}
          </text>
          <ellipse cx="792" cy="96" rx="138" ry="76" fill="rgba(14,165,233,0)" stroke="#38bdf8"
            strokeWidth="2.5" strokeDasharray="6 4" style={{opacity:hovered==="heaven"?.6:0,transition:"opacity .2s"}}/>
        </g>

        {/* ── WIND LINES ───────────────────────────────────── */}
        {[{x:55,y:168,w:62,d:"0s",  dr:"2.1s"},
          {x:46,y:192,w:76,d:".4s", dr:"2.5s"},
          {x:58,y:218,w:54,d:".7s", dr:"1.9s"},
          {x:44,y:246,w:66,d:".15s",dr:"2.3s"},
        ].map((wl,i)=>(
          <line key={i} className="wline"
            x1={wl.x} y1={wl.y} x2={wl.x+wl.w} y2={wl.y}
            stroke="rgba(130,195,240,0.68)" strokeWidth="2.5" strokeLinecap="round"
            style={{animationDelay:wl.d,animationDuration:wl.dr}}/>
        ))}

        {/* ── RAIN ──────────────────────────────────────────── */}
        {rainOn && RAIN_DROPS.map((r,i)=>(
          <line key={i} className="raindrop"
            x1={r.x} y1={r.y} x2={r.x-3} y2={r.y+18}
            stroke="rgba(96,140,220,0.60)" strokeWidth="1.6" strokeLinecap="round"
            style={{animationDelay:`${r.del}s`,animationDuration:`${r.dur}s`}}/>
        ))}

        {/* ── CANOPY AURA ──────────────────────────────────── */}
        <ellipse cx="462" cy="306" rx="290" ry="248" fill="url(#canopyAura)"/>

        {/* ── LEAVES (back half) ───────────────────────────── */}
        <g className="leaf-sway" opacity="0.50">
          {allLeaves.filter((_,i)=>i%3===0).map((l,i)=>(
            <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx*.82} ry={l.ry*.78}
              fill={l.col} opacity={l.op*.55} transform={`rotate(${l.rot},${l.x},${l.y})`}/>
          ))}
        </g>

        {/* ── BRANCHES ─────────────────────────────────────── */}
        <g filter="url(#shadow)">
          {BRANCHES.map((b,i)=>(
            <path key={i} d={b.d} stroke="url(#branchG)" strokeWidth={b.w}
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
        </g>

        {/* ── TRUNK ────────────────────────────────────────── */}
        <g filter="url(#shadow)" className="zone" onClick={e=>openZone("tech",e)}
           onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}>
          <path d={TRUNK_PATH} fill="url(#trunkG)"/>
          {/* highlight sheen */}
          <path d={`M 458,${GY} C 457,432 456,302 457,192 C 458,175 460,162 461,157 L 463,157 C 463,162 464,175 464,192 C 464,302 464,432 464,${GY}`}
            fill="rgba(210,152,72,0.14)"/>
          {BARK_LINES.map((d,i)=>(
            <path key={i} d={d} stroke="rgba(10,4,0,0.22)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          ))}
          {/* hover ring */}
          <path d={TRUNK_PATH} fill="rgba(99,102,241,0)"
            stroke="#818cf8" strokeWidth="2" strokeDasharray="5 4"
            style={{opacity:hovered==="tech"?.55:0,transition:"opacity .2s"}}/>
        </g>

        {/* Trunk label */}
        <g style={{pointerEvents:"none"}}>
          <text x="462" y="340" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8.5" fontWeight="700" letterSpacing="1.6">TECH CORE</text>
          <text x="462" y="354" textAnchor="middle" fill="rgba(255,255,255,.22)" fontSize="8">
            {app.projects.filter(p=>p.status==="live").length} live / {app.projects.length}
          </text>
        </g>

        {/* ── BRANCH CLICK ZONES (invisible) ───────────────── */}
        {/* assistant — right top */}
        <ellipse cx="654" cy="114" rx="80" ry="40" fill="transparent" className="zone"
          onClick={e=>openZone("assistant",e)}
          onMouseEnter={()=>setHovered("assistant")} onMouseLeave={()=>setHovered(null)}/>
        {/* piano — left top */}
        <ellipse cx="308" cy="118" rx="80" ry="40" fill="transparent" className="zone"
          onClick={e=>openZone("piano",e)}
          onMouseEnter={()=>setHovered("piano")} onMouseLeave={()=>setHovered(null)}/>
        {/* tech right branches */}
        <ellipse cx="598" cy="200" rx="76" ry="34" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>
        {/* tech left branches */}
        <ellipse cx="320" cy="212" rx="76" ry="34" fill="transparent" className="zone"
          onClick={e=>openZone("tech",e)}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>

        {/* ── HOVER BRANCH LABELS ──────────────────────────── */}
        <HoverLabel zone="assistant" x={654} y={88}/>
        <HoverLabel zone="piano"     x={308} y={90}/>
        <HoverLabel zone="tech"      x={462} y={296}/>

        {/* ── LEAVES (front half) ──────────────────────────── */}
        <g className="leaf-sway">
          {allLeaves.filter((_,i)=>i%3!==0).map((l,i)=>(
            <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry}
              fill={l.col} opacity={l.op} transform={`rotate(${l.rot},${l.x},${l.y})`}/>
          ))}
        </g>

        {/* ── ROOTS ────────────────────────────────────────── */}
        <g className="zone" onClick={e=>openZone("hr",e)}
           onMouseEnter={()=>setHovered("hr")} onMouseLeave={()=>setHovered(null)}>
          {ROOTS.map((r,i)=>{
            const th=0.55+hrProg/100*.45;
            return(
              <g key={i}>
                <path d={r.d} stroke="url(#rootG)" strokeWidth={r.w*th} fill="none" strokeLinecap="round"/>
                <path d={r.d} stroke="rgba(175,105,45,.22)" strokeWidth={r.w*.27} fill="none" strokeLinecap="round"/>
              </g>
            );
          })}
          {/* wide invisible zone */}
          <rect x="160" y={GY} width="604" height="82" fill="transparent"/>
        </g>
        <HoverLabel zone="hr" x={462} y={GY+4} above={false}/>

        {/* ── SOIL ─────────────────────────────────────────── */}
        <rect x="0" y={GY} width={VW} height="26" fill="url(#soilG)"/>
        {[8,18,24].map(dy=>(
          <line key={dy} x1="0" y1={GY+dy} x2={VW} y2={GY+dy} stroke="rgba(0,0,0,.05)" strokeWidth="1"/>
        ))}

        {/* ── GRASS ────────────────────────────────────────── */}
        <g className="zone" onClick={e=>openZone("partnerships",e)}
           onMouseEnter={()=>setHovered("partnerships")} onMouseLeave={()=>setHovered(null)}>
          {blades.map((bl,i)=>(
            <path key={i} d={`M ${bl.lx},${GY} Q ${bl.bx},${GY-bl.h} ${bl.rx},${GY}`}
              fill={bl.col} opacity=".85"/>
          ))}
          <rect x="0" y={GY-24} width={VW} height="32" fill="transparent"/>
        </g>

        {/* Grass label */}
        <text x="462" y={GY-6} textAnchor="middle" fill="rgba(18,100,42,.68)"
          fontSize="9" fontWeight="600" style={{pointerEvents:"none"}}>
          🌿 Hợp tác · {app.partners.length} đối tác
        </text>
        <HoverLabel zone="partnerships" x={462} y={GY-28}/>

        {/* ── UNDERGROUND / MARKET ─────────────────────────── */}
        <rect x="0" y={GY+26} width={VW} height={VH-GY-26}
          fill="url(#underG)" className="zone"
          onClick={e=>openZone("market",e)}
          onMouseEnter={()=>setHovered("market")} onMouseLeave={()=>setHovered(null)}/>
        {/* soil pebbles */}
        {Array.from({length:18},(_,i)=>{const r=mkRng(i*71);return{x:r()*VW,y:GY+34+r()*52,rx:2+r()*5,ry:1.5+r()*3}}).map((s,i)=>(
          <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry}
            fill={`rgba(100,60,16,${.07+mkRng(i*51)()*0.13})`}/>
        ))}
        {/* partner labels in underground */}
        {PARTNER_CATS.map(lb=>(
          <text key={lb.id} x={lb.x} y={GY+48} textAnchor="middle"
            fill={lb.color} fontSize="10" fontWeight="600" className="zone"
            onClick={e=>openZone("partnerships",e)} style={{cursor:"pointer"}}>
            {lb.icon} {lb.label}
          </text>
        ))}
        <text x="462" y={GY+70} textAnchor="middle"
          fill="rgba(255,255,255,.30)" fontSize="8.5" letterSpacing="1.5" fontWeight="300" style={{pointerEvents:"none"}}>
          🌍 THỊ TRƯỜNG (ĐẤT) · Market Index: {mkIdx}
        </text>
        <HoverLabel zone="market" x={462} y={GY+50} above={false}/>
      </svg>

      {/* ── MINI POPUP ───────────────────────────────────── */}
      {popup&&(()=>{
        const tid=ZONE_META[popup.zone].teamId;
        const s=tid?gs(tid):{done:0,total:0,overdue:0};
        const p=tid?gp(tid):0;
        const extra=
          popup.zone==="heaven"      ?`🌦 Index: ${hvIdx} · Mưa: ${rainOn?"Bật":"Tắt"}`:
          popup.zone==="market"      ?`📈 Market Index: ${mkIdx}`:
          popup.zone==="partnerships"?`🤝 ${app.partners.length} đối tác · ${app.partners.filter(pt=>pt.status==="active").length} active`:
          undefined;
        return(
          <MiniPopup popup={popup} onClose={()=>setPopup(null)} onDetail={()=>openFull(popup.zone)}
            prog={p} done={s.done} total={s.total} overdue={s.overdue} extra={extra}/>
        );
      })()}

      {/* ── FULL PANEL ───────────────────────────────────── */}
      {fullPanel && <FullPanel zone={fullPanel} onClose={()=>setFullPanel(null)}/>}
    </div>
  );
}
