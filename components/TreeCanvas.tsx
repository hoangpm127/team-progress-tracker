"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useApp } from "@/lib/AppContext";

// ─────────────────────────────────────────────────────────────
//  ZONE META
// ─────────────────────────────────────────────────────────────
type ZoneId = "tech"|"hr"|"mkt"|"heaven"|"partnerships"|"market"|"assistant"|"piano";
const ZONE_META: Record<ZoneId,{icon:string;title:string;color:string;border:string;subtitle:string;teamId:string|null}> = {
  tech:         {icon:"⚙️", title:"Công nghệ",  color:"#6366f1",border:"#818cf8",subtitle:"Thân cây — Technology Core",        teamId:"tech"},
  hr:           {icon:"👥", title:"Nhân sự",    color:"#f59e0b",border:"#fbbf24",subtitle:"Rễ cây — Human Resources",          teamId:"hr"},
  mkt:          {icon:"📣", title:"Marketing",  color:"#ec4899",border:"#f472b6",subtitle:"Mây trái — Quảng bá & Thương hiệu", teamId:"mkt"},
  heaven:       {icon:"🌦", title:"Thiên thời", color:"#0ea5e9",border:"#38bdf8",subtitle:"Mây phải — Cơ hội & Thời điểm",    teamId:null},
  partnerships: {icon:"🤝", title:"Hợp tác",    color:"#10b981",border:"#34d399",subtitle:"Cỏ xanh — 4 nhóm đối tác",         teamId:"partnerships"},
  market:       {icon:"🌍", title:"Thị trường", color:"#a16207",border:"#d97706",subtitle:"Đất — Bối cảnh kinh doanh",         teamId:null},
  assistant:    {icon:"📋", title:"Hành chính", color:"#3b82f6",border:"#60a5fa",subtitle:"Nhánh phải — BOD / Admin",          teamId:"assistant"},
  piano:        {icon:"🎹", title:"Piano",      color:"#8b5cf6",border:"#a78bfa",subtitle:"Nhánh trái — Piano Division",       teamId:"piano"},
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function mkRng(seed:number){
  let s=seed;
  return()=>{s=s+0x6d2b79f5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
const Q1_START=+new Date("2026-01-01"), Q1_END=+new Date("2026-03-31"), TODAY_TS=+new Date("2026-02-25");
const ELAPSED=Math.round(Math.min(1,(TODAY_TS-Q1_START)/(Q1_END-Q1_START))*100);
function healthOf(prog:number){
  const r=ELAPSED>0?prog/ELAPSED:1;
  if(r>=0.80)return{label:"Đúng tiến độ",color:"#10b981",dot:"●"};
  if(r>=0.50)return{label:"Hơi chậm",color:"#f59e0b",dot:"●"};
  return{label:"Nguy hiểm",color:"#ef4444",dot:"●"};
}

// ─────────────────────────────────────────────────────────────
//  MINI POPUP
// ─────────────────────────────────────────────────────────────
interface PopupState{zone:ZoneId;sx:number;sy:number}
function MiniPopup({popup,onClose,onDetail,prog,done,total,overdue,extra}:
  {popup:PopupState;onClose():void;onDetail():void;prog:number;done:number;total:number;overdue:number;extra?:string}){
  const meta=ZONE_META[popup.zone];const h=healthOf(prog);
  const left=Math.min(popup.sx+18,window.innerWidth-256);
  const top=Math.max(popup.sy-16,8);
  return(
    <div data-popup="1" className="fixed z-50 w-[244px] rounded-2xl shadow-2xl overflow-hidden"
      style={{left,top,border:`2px solid ${meta.border}`,background:"rgba(8,12,26,0.97)",backdropFilter:"blur(12px)"}}>
      <div className="flex items-center gap-3 px-4 py-3" style={{background:`${meta.color}18`,borderBottom:`1px solid ${meta.border}30`}}>
        <span className="text-2xl leading-none">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm">{meta.title}</div>
          <div className="text-xs mt-0.5 truncate" style={{color:`${meta.color}cc`}}>{meta.subtitle}</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
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
        <button onClick={onDetail} className="w-full py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 hover:brightness-110"
          style={{background:`linear-gradient(135deg,${meta.color}dd,${meta.color})`}}>
          Xem chi tiết →
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
      <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col" style={{borderLeft:`4px solid ${meta.color}`}}>
        <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{background:`${meta.color}12`,borderBottom:`1px solid ${meta.color}28`}}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{meta.icon}</span>
              <span className="font-bold text-slate-800 text-lg">{meta.title}</span>
            </div>
            <p className="text-xs text-slate-500">{meta.subtitle}</p>
            {teamId&&(
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Tiến độ Q1</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{color:h.color}}>{h.dot} {h.label}</span>
                    <span className="font-bold text-lg" style={{color:meta.color}}>{prog}%</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full" style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}88,${meta.color})`}}/>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>✅ {stats.done}/{stats.total} tasks</span>
                  {stats.overdue>0&&<span className="text-red-500">⚠ {stats.overdue} quá hạn</span>}
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-3">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {zone==="tech"&&(
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">30 Dự Án Công Nghệ</h3>
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-600">● {app.projects.filter(p=>p.status==="live").length}</span>
                  <span className="text-amber-600">🔨 {app.projects.filter(p=>p.status==="building").length}</span>
                  <span className="text-slate-400">💡 {app.projects.filter(p=>p.status==="idea").length}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {app.projects.map(p=>{
                  const m:{[k:string]:{dot:string;bg:string;tc:string}}={live:{dot:"●",bg:"#f0fdf4",tc:"#166534"},building:{dot:"◐",bg:"#fffbeb",tc:"#92400e"},idea:{dot:"○",bg:"#f8fafc",tc:"#475569"}};
                  const{dot,bg,tc}=m[p.status];
                  return(<div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{background:bg}}><span className="text-sm shrink-0">{dot}</span><div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{color:tc}}>{p.name}</div><div className="text-xs text-slate-400">{p.owner}</div></div></div>);
                })}
              </div>
            </div>
          )}
          {zone==="partnerships"&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">4 Nhóm Đối Tác</h3>
              {PARTNER_CATS.map(cat=>{
                const list=app.partners.filter(p=>p.category===cat.id);
                return(
                  <div key={cat.id} className="mb-5">
                    <div className="flex items-center gap-2 mb-2"><span>{cat.icon}</span><span className="text-sm font-semibold" style={{color:cat.color}}>{cat.label}</span><span className="ml-auto text-xs text-slate-400">{list.filter(p=>p.status==="active").length}/{list.length} active</span></div>
                    {list.length===0?<p className="text-xs text-slate-400 italic pl-5">Chưa có dữ liệu</p>
                    :<div className="space-y-1 pl-5">{list.map(p=>(<div key={p.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:p.status==="active"?"#10b981":"#94a3b8"}}/><span className="text-xs text-slate-600 flex-1">{p.name}</span><span className="text-xs text-slate-400">{p.status==="active"?"Active":"Pipeline"}</span></div>))}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {zone==="market"&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chỉ Số Thị Trường</h3>
              <div className="rounded-xl p-4 mb-3" style={{background:"#fef3c7",border:"1px solid #fde68a"}}>
                <div className="flex items-center justify-between mb-2"><span className="text-sm text-amber-800">Market Index</span><span className="text-3xl font-bold text-amber-900">{app.market.marketIndex}</span></div>
                <div className="h-3 bg-amber-100 rounded-full overflow-hidden"><div className="h-3 rounded-full" style={{width:`${app.market.marketIndex}%`,background:"linear-gradient(90deg,#f59e0b,#d97706)"}}/></div>
              </div>
              {app.market.notes&&<p className="text-xs text-slate-600 bg-amber-50 rounded-lg p-3 border border-amber-100 leading-relaxed">{app.market.notes}</p>}
            </div>
          )}
          {zone==="heaven"&&(
            <div>
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
            </div>
          )}
          {teamId&&tasks.length>0&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Công Việc ({tasks.length})</h3>
              <div className="space-y-2">
                {tasks.map(t=>{
                  const over=!t.done&&t.deadline<today;
                  return(
                    <div key={t.id} className={`flex gap-2.5 p-2.5 rounded-lg border ${t.done?"bg-green-50 border-green-100":over?"bg-red-50 border-red-100":"bg-slate-50 border-slate-100"}`}>
                      <button onClick={()=>{if(app.canEdit(teamId??"")){app.toggleTask(t.id,"Tree");}}} title={app.canEdit(teamId??"") ? undefined : "Cần đăng nhập để thay đổi"} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${t.done?"bg-green-500 border-green-500 text-white":"border-slate-300"} ${!app.canEdit(teamId??"") ? "opacity-50 cursor-not-allowed" : ""}`}>
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {acts.length>0&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hoạt Động Gần Đây</h3>
              <div className="space-y-2">{acts.map(a=>(<div key={a.id} className="flex gap-2 text-xs text-slate-500"><span className="text-slate-300 shrink-0">•</span><span className="leading-relaxed">{a.message}</span></div>))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CANOPY LABEL (permanent, expands on hover)
// ─────────────────────────────────────────────────────────────
function CanopyLabel({cx,cy,r,icon,title,prog,color,teamId,onClick,hovered,onEnter,onLeave,done,total}:{
  cx:number;cy:number;r:number;icon:string;title:string;prog:number;color:string;
  teamId:string|null;onClick(e:React.MouseEvent<SVGElement>):void;
  hovered:boolean;onEnter():void;onLeave():void;done:number;total:number;
}){
  const h=healthOf(prog);
  const W=hovered?192:164, H=hovered?58:44;
  const bx=cx-W/2, by=cy+r+10;
  const iconX=bx+22, iconY=by+H/2;
  return(
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick} style={{cursor:"pointer"}}>
      {/* hit zone */}
      <ellipse cx={cx} cy={cy} rx={r+36} ry={r+28} fill="transparent"/>
      {/* soft shadow */}
      <rect x={bx+1} y={by+4} width={W} height={H} rx="14"
        fill="rgba(0,0,0,0.28)" style={{filter:"blur(5px)",pointerEvents:"none"}}/>
      {/* badge */}
      <rect x={bx} y={by} width={W} height={H} rx="14"
        fill={hovered?color:"rgba(8,12,26,0.92)"}
        stroke={hovered?"rgba(255,255,255,0.35)":color}
        strokeWidth={hovered?1.5:2.2}
        style={{filter:hovered?`drop-shadow(0 0 20px ${color}66)`:"none",pointerEvents:"none"}}/>
      {/* icon circle */}
      <circle cx={iconX} cy={iconY} r={15}
        fill={hovered?"rgba(255,255,255,0.22)":color+"22"}
        stroke={hovered?"rgba(255,255,255,0.45)":color}
        strokeWidth="2" style={{pointerEvents:"none"}}/>
      <text x={iconX} y={iconY+5} textAnchor="middle" fontSize="14" style={{pointerEvents:"none"}}>{icon}</text>
      {/* title */}
      <text x={bx+44} y={by+(hovered?18:H/2)} textAnchor="start" fill="white" fontSize="11" fontWeight="800" style={{pointerEvents:"none"}}>{title}</text>
      {teamId&&(
        <text x={bx+44} y={by+(hovered?32:H/2+13)} textAnchor="start"
          fill={hovered?"rgba(255,255,255,.92)":color}
          fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>{prog}% · {h.dot} {h.label}</text>
      )}
      {hovered&&teamId&&(
        <text x={bx+44} y={by+47} textAnchor="start" fill="rgba(255,255,255,.78)" fontSize="9" style={{pointerEvents:"none"}}>✅ {done}/{total} hoàn thành</text>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
//  BRANCH PATH BUILDER (filled tapered curve)
// ─────────────────────────────────────────────────────────────
function branchPath(x0:number,y0:number,x1:number,y1:number,w0:number,w1:number):string{
  // normal to branch direction
  const ddx=y1-y0, ddy=-(x1-x0); const len=Math.sqrt(ddx*ddx+ddy*ddy)||1;
  const nx=ddx/len, ny=ddy/len;
  // control point with S-curve bias
  const side=x1<500?-1:1;
  const cx=(x0+x1)/2+side*50, cy=(y0+y1)/2-25;
  return [
    `M ${x0-nx*w0},${y0-ny*w0}`,
    `Q ${cx-nx*((w0+w1)/2)},${cy-ny*((w0+w1)/2)} ${x1-nx*w1},${y1-ny*w1}`,
    `L ${x1+nx*w1},${y1+ny*w1}`,
    `Q ${cx+nx*((w0+w1)/2)},${cy+ny*((w0+w1)/2)} ${x0+nx*w0},${y0+ny*w0}`,
    `Z`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────
//  SVG CONSTANTS   viewBox 0 0 1000 700    GY=560
// ─────────────────────────────────────────────────────────────
const VW=1000, VH=700, GY=560;
const TX=500;
const TRUNK_TOP_Y=258;
// Organic trunk: natural S-curve taper, left & right sides differ for asymmetry
const TRUNK_PATH=`
  M 444,560
  C 440,468 474,382 487,312
  C 488,290 488,270 489,${TRUNK_TOP_Y}
  L 513,${TRUNK_TOP_Y}
  C 514,268 515,288 516,316
  C 528,384 560,470 556,560
  Z`;

// Branch fork points — ASYMMETRIC (left forks a bit lower than right)
const LBX=489, LBY=290;
const RBX=513, RBY=278;
// Canopy anchors — asymmetric by design: left reaches further, right sits lower
const PIANO_CX=215, PIANO_CY=182;
const ASST_CX=762,  ASST_CY=208;
const TECH_CX=498,  TECH_CY=112;
const ML_CX=308, ML_CY=338;
const MR_CX=674, MR_CY=352;
// Logical canopy radius from progress (used for CanopyLabel y-offset)
const cR=(prog:number)=>Math.round(52+prog*0.54);

// Pre-baked seeded values for grass & rain
const RAIN_DROPS=Array.from({length:26},(_,i)=>{const r=mkRng(i*137);return{x:600+r()*240,y:28+r()*120,del:r()*1.6,dur:.46+r()*.44};});
function makeGrass(count:number){
  return Array.from({length:count},(_,i)=>{
    const r=mkRng(i*17+3);const bx=r()*VW;const h=12+r()*24;
    return{bx,h,lx:bx-3-r()*5,rx:bx+3+r()*5,col:["#236018","#2a6e1e","#328426","#246018","#389224"][i%5]};
  });
}

// Leaf colour palettes — bright-on-dark for depth
const LEAF_BRIGHT=["#aee84e","#bef460","#c8f472","#9ee040","#d0f47a","#8cd83a"];
const LEAF_MID   =["#7cc82c","#88d636","#68be1e","#74ca28","#6ab820"];

// ─────────────────────────────────────────────────────────────
//  ORGANIC CANOPY  — secondary branches + scattered leaves, no circles
// ─────────────────────────────────────────────────────────────
function OrganicCanopy({cx,cy,prog,color,done,overdue,seed}:{
  cx:number;cy:number;prog:number;color:string;done:number;overdue:number;seed:number;
}){
  const rng=mkRng(seed*3+19);
  const bCnt=Math.max(5,Math.round(4+prog*0.08));    // 5–12 branches
  const bLen=70+prog*0.82;                            // 70→152 px reach
  const lPer=Math.max(4,Math.round(3+prog*0.06));    // 4–10 leaves/branch
  const els:React.ReactElement[]=[];
  const BASE_ANG=-Math.PI/2;
  const SPREAD=1.55+prog*0.003;
  for(let i=0;i<bCnt;i++){
    const ni=bCnt>1?i/(bCnt-1):0.5;
    const ang=BASE_ANG-SPREAD/2+ni*SPREAD+(rng()-0.5)*0.15;
    const bL=bLen*(0.72+rng()*0.42);
    const cAng=ang+(rng()-0.5)*0.30;
    const mx=cx+Math.cos(cAng)*bL*0.52;
    const my=cy+Math.sin(cAng)*bL*0.52;
    const ex=cx+Math.cos(ang+(rng()-0.5)*0.08)*bL;
    const ey=cy+Math.sin(ang+(rng()-0.5)*0.08)*bL;
    const bw=Math.max(0.5,(1.8-ni*0.6)*(0.4+rng()*0.8));
    // thin branch stroke
    els.push(<path key={`b${i}`}
      d={`M ${cx.toFixed(1)} ${cy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
      stroke={i%2===0?"#3d2006":"#4e2c0a"} strokeWidth={bw.toFixed(1)}
      fill="none" strokeLinecap="round" opacity="0.82"/>);
    // leaves concentrated in outer 50% of branch (t=0.52 to 1.0)
    for(let j=0;j<lPer;j++){
      const t=0.52+rng()*0.52;
      const t1=1-t;
      const lx=t1*t1*cx+2*t*t1*mx+t*t*ex+(rng()-0.5)*9;
      const ly=t1*t1*cy+2*t*t1*my+t*t*ey+(rng()-0.5)*9;
      const rot=ang*180/Math.PI+(rng()-0.5)*88;
      const sz=9+rng()*13;
      const col=rng()<0.42?LEAF_BRIGHT[Math.floor(rng()*LEAF_BRIGHT.length)]:LEAF_MID[Math.floor(rng()*LEAF_MID.length)];
      els.push(<path key={`l${i}_${j}`}
        d={`M 0,0 C ${(sz*.38).toFixed(1)},${(-sz*.26).toFixed(1)} ${(sz*.32).toFixed(1)},${(-sz*.80).toFixed(1)} 0,${(-sz).toFixed(1)} C ${(-sz*.32).toFixed(1)},${(-sz*.80).toFixed(1)} ${(-sz*.38).toFixed(1)},${(-sz*.26).toFixed(1)} 0,0 Z`}
        fill={col} stroke="rgba(0,38,0,.14)" strokeWidth="0.5"
        opacity={(0.72+rng()*.26).toFixed(2)}
        transform={`translate(${lx.toFixed(1)},${ly.toFixed(1)}) rotate(${rot.toFixed(1)})`}/>);
    }
    // overdue yellow leaf near tip
    if(overdue>0 && i<Math.min(overdue,4)){
      const lx=ex+(rng()-0.5)*6; const ly=ey+rng()*7;
      const sz=8+rng()*5; const rot=ang*180/Math.PI+46+rng()*20;
      els.push(<path key={`ov${i}`}
        d={`M 0,0 C ${(sz*.38).toFixed(1)},${(-sz*.26).toFixed(1)} ${(sz*.32).toFixed(1)},${(-sz*.80).toFixed(1)} 0,${(-sz).toFixed(1)} C ${(-sz*.32).toFixed(1)},${(-sz*.80).toFixed(1)} ${(-sz*.38).toFixed(1)},${(-sz*.26).toFixed(1)} 0,0 Z`}
        fill="#fcd34d" stroke="rgba(120,60,0,.18)" strokeWidth="0.5" opacity="0.88"
        transform={`translate(${lx.toFixed(1)},${ly.toFixed(1)}) rotate(${rot.toFixed(1)})`}/>);
    }
  }
  // Done-task marker: small bright dots at the very end of random completed branches
  const dotCount=Math.min(done,Math.floor(bCnt*0.6));
  for(let d=0;d<dotCount;d++){
    const bi=Math.floor(rng()*bCnt);
    const ni2=bCnt>1?bi/(bCnt-1):0.5;
    const ang2=BASE_ANG-SPREAD/2+ni2*SPREAD;
    const ex2=cx+Math.cos(ang2)*bLen*(0.72+rng()*0.42);
    const ey2=cy+Math.sin(ang2)*bLen*(0.72+rng()*0.42);
    els.push(<circle key={`dk${d}`} cx={ex2} cy={ey2} r={2.5} fill="#d0f47a" opacity="0.7"/>);
  }
  return <g style={{pointerEvents:"none"}}>{els}</g>;
}

// ─────────────────────────────────────────────────────────────
//  FLOWER / FRUIT (milestone: 80% → flower, 100% → fruit)
// ─────────────────────────────────────────────────────────────
function FlowerTip({cx,cy,prog}:{cx:number;cy:number;prog:number}){
  if(prog<80) return null;
  if(prog>=100){
    return(
      <g filter="url(#fruitGlow)" style={{pointerEvents:"none"}}>
        <circle cx={cx} cy={cy} r={13} fill="url(#fruitG)"/>
        <circle cx={cx-3.5} cy={cy-4} r={3.4} fill="rgba(255,255,255,.42)"/>
        <path d={`M ${cx},${cy-13} Q ${cx+6},${cy-21} ${cx+3},${cy-25}`}
          stroke="#3d6012" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <ellipse cx={cx+5} cy={cy-22} rx="5" ry="3"
          fill="#3d6012" opacity=".8" transform={`rotate(-25 ${cx+5} ${cy-22})`}/>
      </g>
    );
  }
  // flower at 80–99% — larger petals, visible against the sky
  const PR=9;
  return(
    <g style={{pointerEvents:"none"}} filter="url(#fruitGlow)">
      {Array.from({length:6},(_,i)=>{
        const a=i*60*Math.PI/180-Math.PI/2;
        const px=cx+Math.cos(a)*PR*2;
        const py=cy+Math.sin(a)*PR*2;
        return(<ellipse key={i} cx={px} cy={py} rx={PR} ry={PR*.48}
          fill="#fef9c3" stroke="#fbbf24" strokeWidth="1.2" opacity=".96"
          transform={`rotate(${i*60-90} ${px} ${py})`}/>);
      })}
      <circle cx={cx} cy={cy} r={PR*.72} fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      <circle cx={cx-1.5} cy={cy-1.5} r={PR*.28} fill="rgba(255,255,255,.5)"/>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function TreeCanvas(){
  const app=useApp();
  const [popup,    setPopup]    =useState<PopupState|null>(null);
  const [fullPanel,setFullPanel]=useState<ZoneId|null>(null);
  const [hovered,  setHovered]  =useState<ZoneId|null>(null);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{if(popup&&!(e.target as Element).closest("[data-popup]"))setPopup(null);};
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[popup]);

  const openZone=useCallback((zone:ZoneId,e:React.MouseEvent)=>{
    e.stopPropagation();setPopup(p=>p?.zone===zone?null:{zone,sx:e.clientX,sy:e.clientY});setFullPanel(null);
  },[]);
  const openFull=useCallback((zone:ZoneId)=>{setFullPanel(zone);setPopup(null);},[]);

  const gp=(id:string)=>app.getTeamProgress(id);
  const gs=(id:string)=>app.getTeamStats(id);

  const techP=gp("tech"), hrP=gp("hr"), mktP=gp("mkt"), partP=gp("partnerships");
  const asstP=gp("assistant"), pianoP=gp("piano");
  const techS=gs("tech"), hrS=gs("hr"), mktS=gs("mkt"), partS=gs("partnerships");
  const asstS=gs("assistant"), pianoS=gs("piano");
  const rainOn=app.heavenTiming.rainEnabled, mkIdx=app.market.marketIndex, hvIdx=app.heavenTiming.heavenTimingIndex;

  // Canopy radii for CanopyLabel y-offset (logical enclosing radius)
  const pianoR=cR(pianoP), asstR=cR(asstP), techR=cR(techP);
  const blades=    useMemo(()=>makeGrass(32+Math.round(partP*.4)),[partP]);

  // Trunk colour (warmer when tech is doing well)
  const sat=40+techP*.12;
  const tA=`hsl(22,${sat}%,18%)`, tB=`hsl(26,${sat+10}%,30%)`, tC=`hsl(24,${sat+5}%,24%)`;
  void tB; // reserved

  return(
    <div className="relative w-full h-full" style={{background:"linear-gradient(180deg,#92c8e4 0%,#b8dff2 32%,#c2e4b8 68%,#b8dca8 100%)"}}>
      {/* controls */}
      <div className="absolute top-2 right-3 z-10 flex gap-2">
        <button onClick={()=>app.setHeavenTiming({rainEnabled:!rainOn})} className="px-3 py-1.5 rounded-xl text-xs font-semibold border shadow transition-all active:scale-95" style={{background:rainOn?"#0ea5e9":"white",color:rainOn?"white":"#475569",borderColor:rainOn?"#38bdf8":"#e2e8f0"}}>{rainOn?"🌧 Tắt mưa":"☀️ Bật mưa"}</button>
        <button onClick={()=>openFull("market")} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-amber-200 text-amber-700 shadow hover:bg-amber-50 active:scale-95">🌍 Market {mkIdx}</button>
        <button onClick={()=>openFull("heaven")} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-sky-200 text-sky-700 shadow hover:bg-sky-50 active:scale-95">🌦 Heaven {hvIdx}</button>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{display:"block"}}>
        <defs>
          <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={tA}/>
            <stop offset="28%"  stopColor={tC}/>
            <stop offset="50%"  stopColor={tB}/>
            <stop offset="72%"  stopColor={tC}/>
            <stop offset="100%" stopColor={tA}/>
          </linearGradient>
          <linearGradient id="hrRootG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#b45309"/>
            <stop offset="60%"  stopColor="#92400e"/>
            <stop offset="100%" stopColor="#7c2d12"/>
          </linearGradient>
          <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={`hsl(26,${36+mkIdx*.08}%,${20+mkIdx*.05}%)`}/>
            <stop offset="100%" stopColor="hsl(20,30%,10%)"/>
          </linearGradient>
          <linearGradient id="underG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#100502"/>
            <stop offset="100%" stopColor="#050100"/>
          </linearGradient>
          <pattern id="barkPat" x="0" y="0" width="10" height="30" patternUnits="userSpaceOnUse">
            <path d="M5,0 Q3,9 5,15 Q7,21 5,30" stroke="rgba(0,0,0,.08)" strokeWidth="1" fill="none"/>
          </pattern>
          <filter id="leafShadow" x="-18%" y="-18%" width="136%" height="136%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#09200e" floodOpacity=".10"/>
          </filter>
          <filter id="trunkShd">
            <feDropShadow dx="5" dy="8" stdDeviation="9" floodColor="#030602" floodOpacity=".26"/>
          </filter>
          <filter id="cloudBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6"/>
          </filter>
          <radialGradient id="fruitG" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stopColor="#ff9a3c"/>
            <stop offset="55%"  stopColor="#e85c00"/>
            <stop offset="100%" stopColor="#aa2800"/>
          </radialGradient>
          <filter id="fruitGlow" x="-55%" y="-55%" width="210%" height="210%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ff9a3c" floodOpacity=".75"/>
          </filter>
          <style>{`
            @keyframes sway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}
            @keyframes floatL{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
            @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
            @keyframes rainFall{0%{opacity:0;transform:translate(0,0)}15%{opacity:.7}85%{opacity:.5}100%{opacity:0;transform:translate(-9px,58px)}}
            @keyframes windGust{0%,100%{opacity:0;transform:scaleX(.04)}44%,56%{opacity:.58;transform:scaleX(1)}}
            .tree-grp{animation:sway 5.5s ease-in-out infinite;transform-origin:${TX}px ${GY}px}
            .cl{animation:floatL 7.5s ease-in-out infinite}
            .cr{animation:floatR 9s 1.8s ease-in-out infinite}
            .rd{animation:rainFall linear infinite}
            .wl{animation:windGust ease-in-out infinite;transform-origin:left center}
            @keyframes leafPop{0%{opacity:0;transform:scale(.15) rotate(var(--lr,0deg))}60%{transform:scale(1.12) rotate(var(--lr,0deg))}100%{opacity:1;transform:scale(1) rotate(var(--lr,0deg))}}
            .leaf-new{animation:leafPop .45s ease-out both}
          `}</style>
        </defs>

        {/* ── SKY — muted, less saturated ──────────────────── */}
        <defs>
          <linearGradient id="skyG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#7eaec4"/>
            <stop offset="46%" stopColor="#a6ccde"/>
            <stop offset="74%" stopColor="#b6d4a8"/>
            <stop offset="100%" stopColor="#a6ca98"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={VW} height={VH} fill="url(#skyG2)"/>
        {/* sun — just a soft glow, no hard disc or visible rays */}
        <circle cx="80" cy="74" r="68" fill="rgba(255,238,180,.12)" filter="url(#cloudBlur)"/>
        <circle cx="80" cy="74" r="36" fill="rgba(255,228,110,.22)" filter="url(#cloudBlur)"/>
        {/* horizon ambient */}
        <ellipse cx={TX} cy={GY} rx="450" ry="48" fill="rgba(112,180,64,.10)"/>

        {/* ── WIND LINES ─────────────────────────────────────── */}
        {[{x:28,y:192,w:62,d:"0s",dr:"2.2s"},{x:20,y:218,w:76,d:".5s",dr:"2.5s"},{x:36,y:244,w:54,d:".9s",dr:"1.9s"}].map((wl,i)=>(
          <line key={i} className="wl" x1={wl.x} y1={wl.y} x2={wl.x+wl.w} y2={wl.y}
            stroke="rgba(120,185,226,.52)" strokeWidth="2.5" strokeLinecap="round"
            style={{animationDelay:wl.d,animationDuration:wl.dr}}/>
        ))}

        {/* ── LEFT CLOUD — Marketing — wispy, smaller ─────── */}
        <g className="cl" style={{cursor:"pointer"}} onClick={e=>openZone("mkt",e)}>
          <ellipse cx="146" cy="102" rx="82" ry="48" fill="rgba(255,255,255,.10)" filter="url(#cloudBlur)"/>
          <circle cx="134" cy="110" r="36" fill="rgba(255,255,255,.95)"/>
          <circle cx="172" cy="106" r="30" fill="rgba(255,255,255,.93)"/>
          <circle cx="106" cy="116" r="24" fill="rgba(255,255,255,.91)"/>
          <circle cx="156" cy="84"  r="22" fill="rgba(255,255,255,.89)"/>
          <circle cx="124" cy="80"  r="16" fill="rgba(255,255,255,.86)"/>
          <circle cx="192" cy="118" r="18" fill="rgba(255,255,255,.87)"/>
          <circle cx="178" cy="78"  r="12" fill="rgba(255,255,255,.82)"/>
          {mktP>20&&<ellipse cx="146" cy="102" rx="64" ry="34" fill={`rgba(236,72,153,${(mktP-20)/330})`}/>}
          <rect x="64" y="148" width="164" height={hovered==="mkt"?56:38} rx="14"
            fill={hovered==="mkt"?"#ec4899":"rgba(8,12,26,0.92)"} stroke="#f472b6" strokeWidth={hovered==="mkt"?1.5:2}
            style={{filter:hovered==="mkt"?"drop-shadow(0 0 18px #ec489966)":"drop-shadow(0 4px 8px rgba(0,0,0,.4))"}}/>
          <circle cx="88" cy={hovered==="mkt"?176:167} r="14"
            fill={hovered==="mkt"?"rgba(255,255,255,0.22)":"#ec489922"}
            stroke={hovered==="mkt"?"rgba(255,255,255,0.45)":"#f472b6"} strokeWidth="1.5" style={{pointerEvents:"none"}}/>
          <text x="88" y={hovered==="mkt"?181:172} textAnchor="middle" fontSize="14" style={{pointerEvents:"none"}}>📣</text>
          <text x="109" y="163" textAnchor="start" fill="white" fontSize="11" fontWeight="800" style={{pointerEvents:"none"}}>Marketing</text>
          <text x="109" y="177" textAnchor="start" fill={hovered==="mkt"?"white":"#f472b6"} fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>{mktP}% · {healthOf(mktP).dot} {healthOf(mktP).label}</text>
          {hovered==="mkt"&&<text x="109" y="192" textAnchor="start" fill="rgba(255,255,255,.85)" fontSize="9" style={{pointerEvents:"none"}}>✅ {mktS.done}/{mktS.total} việc</text>}
          <rect x="22" y="42" width="248" height="158" rx="12" fill="transparent"
            onMouseEnter={()=>setHovered("mkt")} onMouseLeave={()=>setHovered(null)}/>
        </g>

        {/* ── RIGHT CLOUD — Thiên Thời — wispy, smaller ────── */}
        <g className="cr" style={{cursor:"pointer"}} onClick={e=>openZone("heaven",e)}>
          <ellipse cx="852" cy="102" rx="86" ry="50" fill="rgba(255,255,255,.10)" filter="url(#cloudBlur)"/>
          <circle cx="860" cy="110" r="38" fill="rgba(255,255,255,.95)"/>
          <circle cx="820" cy="116" r="28" fill="rgba(255,255,255,.93)"/>
          <circle cx="894" cy="114" r="26" fill="rgba(255,255,255,.91)"/>
          <circle cx="840" cy="82"  r="20" fill="rgba(255,255,255,.89)"/>
          <circle cx="872" cy="78"  r="16" fill="rgba(255,255,255,.86)"/>
          <circle cx="812" cy="124" r="14" fill="rgba(255,255,255,.84)"/>
          <circle cx="900" cy="122" r="12" fill="rgba(255,255,255,.82)"/>
          {hvIdx>28&&<ellipse cx="852" cy="102" rx="68" ry="36" fill={`rgba(14,165,233,${(hvIdx-28)/350})`}/>}
          {rainOn&&<g opacity=".68">{Array.from({length:6},(_,i)=>(<line key={i} x1={826+i*11} y1={143} x2={823+i*11} y2={157} stroke="#93c5fd" strokeWidth="1.3" strokeLinecap="round"/>))}</g>}
          <rect x="746" y="148" width="212" height={hovered==="heaven"?56:38} rx="14"
            fill={hovered==="heaven"?"#0ea5e9":"rgba(8,12,26,0.92)"} stroke="#38bdf8" strokeWidth={hovered==="heaven"?1.5:2}
            style={{filter:hovered==="heaven"?"drop-shadow(0 0 18px #0ea5e966)":"drop-shadow(0 4px 8px rgba(0,0,0,.4))"}}/>
          <circle cx="770" cy={hovered==="heaven"?176:167} r="14"
            fill={hovered==="heaven"?"rgba(255,255,255,0.22)":"#0ea5e922"}
            stroke={hovered==="heaven"?"rgba(255,255,255,0.45)":"#38bdf8"} strokeWidth="1.5" style={{pointerEvents:"none"}}/>
          <text x="770" y={hovered==="heaven"?181:172} textAnchor="middle" fontSize="14" style={{pointerEvents:"none"}}>🌦</text>
          <text x="791" y="163" textAnchor="start" fill="white" fontSize="11" fontWeight="800" style={{pointerEvents:"none"}}>Thiên Thời</text>
          <text x="791" y="177" textAnchor="start" fill={hovered==="heaven"?"white":"#38bdf8"} fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>Index: {hvIdx} · {rainOn?"🌧 Mưa":"☀️ Nắng"}</text>
          {hovered==="heaven"&&<text x="791" y="192" textAnchor="start" fill="rgba(255,255,255,.85)" fontSize="9" style={{pointerEvents:"none"}}>Bấm để xem chi tiết thiên thời</text>}
          <rect x="734" y="38" width="236" height="158" rx="12" fill="transparent"
            onMouseEnter={()=>setHovered("heaven")} onMouseLeave={()=>setHovered(null)}/>
        </g>

        {/* ── RAIN — thin delicate drops ──────────────────── */}
        {rainOn&&RAIN_DROPS.map((r,i)=>(
          <line key={i} className="rd" x1={r.x} y1={r.y} x2={r.x-2} y2={r.y+13}
            stroke="rgba(90,140,220,.32)" strokeWidth="1.0" strokeLinecap="round"
            style={{animationDelay:`${r.del}s`,animationDuration:`${r.dur}s`}}/>
        ))}

        {/* ═══════════════════════════════════════════════
               TREE — organic, asymmetric
        ═══════════════════════════════════════════════ */}
        <g className="tree-grp" filter="url(#leafShadow)">

          {/* ── TRUNK (bottom layer) ──────────────────────────── */}
          <path d={TRUNK_PATH} fill="url(#trunkG)" filter="url(#trunkShd)"/>
          <path d={TRUNK_PATH} fill="url(#barkPat)" opacity=".20"/>
          {/* one-sided light sheen */}
          <path d={`M 492,${TRUNK_TOP_Y} C 491,${TRUNK_TOP_Y+88} 490,${GY-130} 492,${GY} L 498,${GY} C 496,${GY-130} 495,${TRUNK_TOP_Y+88} 496,${TRUNK_TOP_Y} Z`}
            fill="rgba(220,160,70,.12)"/>
          <text x={TX} y={442} textAnchor="middle" fill="rgba(255,255,255,.14)" fontSize="8" fontWeight="700" letterSpacing="2.5">TECH CORE</text>
          <text x={TX} y={456} textAnchor="middle" fill="rgba(255,255,255,.09)" fontSize="7.5">
            {app.projects.filter(p=>p.status==="live").length} live · {app.projects.filter(p=>p.status==="building").length} đang xây
          </text>

          {/* ── MAIN BRANCHES — asymmetric ────────────────────── */}
          {/* Left: longer, with one extra secondary branch (left has more sub-branches) */}
          <path d={branchPath(LBX,LBY,PIANO_CX,PIANO_CY+42,24,10)} fill={tC}/>
          <path d={branchPath(PIANO_CX-12,PIANO_CY+30,PIANO_CX-50,PIANO_CY-20,8,4)} fill={tA}/>
          {/* Right: slightly different angle, one terminal only */}
          <path d={branchPath(RBX,RBY,ASST_CX,ASST_CY+38,21,9)} fill={tC}/>
          {/* Center vertical from trunk top to Tech crown */}
          <path d={branchPath(499,TRUNK_TOP_Y,TECH_CX,TECH_CY+36,15,8)} fill={tC}/>
          {/* Mid-left sub — nearly horizontal then lifts */}
          <path d={branchPath(491,350,ML_CX,ML_CY+26,12,6)} fill={tA}/>
          {/* Mid-right sub — shorter */}
          <path d={branchPath(509,338,MR_CX,MR_CY+20,10,5)} fill={tA}/>

          {/* ── ORGANIC CANOPIES — branches + leaves, no circles ──── */}
          {/* Piano left */}
          <OrganicCanopy cx={PIANO_CX} cy={PIANO_CY} prog={pianoP} color="#8b5cf6" done={pianoS.done} overdue={pianoS.overdue} seed={101}/>
          <FlowerTip cx={PIANO_CX} cy={PIANO_CY-cR(pianoP)-8} prog={pianoP}/>
          {/* Assistant right */}
          <OrganicCanopy cx={ASST_CX} cy={ASST_CY} prog={asstP} color="#3b82f6" done={asstS.done} overdue={asstS.overdue} seed={202}/>
          <FlowerTip cx={ASST_CX} cy={ASST_CY-cR(asstP)-8} prog={asstP}/>
          {/* Mid-left (tech sub) */}
          <OrganicCanopy cx={ML_CX} cy={ML_CY} prog={Math.round(techP*0.65)} color="#22c55e" done={Math.round(techS.done*0.3)} overdue={0} seed={404}/>
          {/* Mid-right (tech sub) */}
          <OrganicCanopy cx={MR_CX} cy={MR_CY} prog={Math.round(techP*0.65)} color="#22c55e" done={Math.round(techS.done*0.3)} overdue={0} seed={505}/>
          {/* Tech center crown — on top */}
          <OrganicCanopy cx={TECH_CX} cy={TECH_CY} prog={techP} color="#6366f1" done={techS.done} overdue={techS.overdue} seed={303}/>
          <FlowerTip cx={TECH_CX} cy={TECH_CY-cR(techP)-8} prog={techP}/>

        </g>{/* end .tree-grp */}

        {/* ── GROUND LINE ─────────────────────────────────────── */}
        <rect x="0" y={GY} width={VW} height="22" fill="url(#soilG)"/>

        {/* ── HR ROOTS (amber — clearly different from trunk) ── */}
        <g style={{cursor:"pointer"}} onClick={e=>openZone("hr",e)}
           onMouseEnter={()=>setHovered("hr")} onMouseLeave={()=>setHovered(null)}>
          {/* large left root surfacing above ground */}
          <path d={`M ${TX-56},${GY} C ${TX-110},${GY+8} ${TX-220},${GY-14} ${TX-330},${GY+2}
            C ${TX-390},${GY+12} ${TX-420},${GY+28} ${TX-450},${GY+46}
            L ${TX-438},${GY+54} C ${TX-406},${GY+36} ${TX-374},${GY+20} ${TX-314},${GY+10}
            L ${TX-310},${GY+60} L ${TX-294},${GY+62} L ${TX-298},${GY+10}
            C ${TX-200},${GY+0} ${TX-96},${GY+16} ${TX-48},${GY+20} Z`}
            fill="url(#hrRootG)" opacity=".94"/>
          {/* large right root */}
          <path d={`M ${TX+56},${GY} C ${TX+110},${GY+8} ${TX+220},${GY-14} ${TX+330},${GY+2}
            C ${TX+390},${GY+12} ${TX+420},${GY+28} ${TX+450},${GY+46}
            L ${TX+438},${GY+54} C ${TX+406},${GY+36} ${TX+374},${GY+20} ${TX+314},${GY+10}
            L ${TX+310},${GY+60} L ${TX+294},${GY+62} L ${TX+298},${GY+10}
            C ${TX+200},${GY+0} ${TX+96},${GY+16} ${TX+48},${GY+20} Z`}
            fill="url(#hrRootG)" opacity=".94"/>
          {/* small tap root */}
          <path d={`M ${TX-16},${GY} L ${TX-12},${GY+74} L ${TX+12},${GY+74} L ${TX+16},${GY} Z`}
            fill="url(#hrRootG)" opacity=".78"/>
          {/* thin trailing roots */}
          <path d={`M ${TX-298},${GY+12} C ${TX-338},${GY+26} ${TX-376},${GY+50} ${TX-404},${GY+76} L ${TX-392},${GY+84} C ${TX-362},${GY+58} ${TX-324},${GY+34} ${TX-284},${GY+20} Z`}
            fill="url(#hrRootG)" opacity=".68"/>
          <path d={`M ${TX+298},${GY+12} C ${TX+338},${GY+26} ${TX+376},${GY+50} ${TX+404},${GY+76} L ${TX+392},${GY+84} C ${TX+362},${GY+58} ${TX+324},${GY+34} ${TX+284},${GY+20} Z`}
            fill="url(#hrRootG)" opacity=".68"/>
          {/* HR label  */}
          <rect x={TX-94} y={GY+50} width={188} height={hovered==="hr"?56:38} rx="14"
            fill={hovered==="hr"?"#f59e0b":"rgba(8,12,26,0.92)"} stroke="#fbbf24" strokeWidth={hovered==="hr"?1.5:2}
            style={{filter:hovered==="hr"?"drop-shadow(0 0 18px #f59e0b66)":"drop-shadow(0 4px 8px rgba(0,0,0,.4))"}}/>
          <circle cx={TX-70} cy={GY+50+(hovered==="hr"?28:19)} r="14"
            fill={hovered==="hr"?"rgba(255,255,255,0.22)":"#f59e0b22"}
            stroke={hovered==="hr"?"rgba(255,255,255,0.45)":"#fbbf24"} strokeWidth="1.5"/>
          <text x={TX-70} y={GY+50+(hovered==="hr"?33:24)} textAnchor="middle" fontSize="14">👥</text>
          <text x={TX-49} y={GY+65} textAnchor="start" fill="white" fontSize="11" fontWeight="800">Nhân Sự (Rễ)</text>
          <text x={TX-49} y={GY+79} textAnchor="start" fill={hovered==="hr"?"white":"#fbbf24"} fontSize="10" fontWeight="700">{hrP}% · {healthOf(hrP).dot} {healthOf(hrP).label}</text>
          {hovered==="hr"&&<text x={TX-49} y={GY+96} textAnchor="start" fill="rgba(255,255,255,.85)" fontSize="9">✅ {hrS.done}/{hrS.total} hoàn thành</text>}
          {/* transparent hit band */}
          <rect x="0" y={GY} width={VW} height="94" fill="transparent"/>
        </g>

        {/* ── UNDERGROUND / MARKET ────────────────────────────── */}
        <g style={{cursor:"pointer"}} onClick={e=>openZone("market",e)}
           onMouseEnter={()=>setHovered("market")} onMouseLeave={()=>setHovered(null)}>
          <rect x="0" y={GY+96} width={VW} height={VH-GY-96} fill="url(#underG)"/>
          {/* pebbles */}
          {Array.from({length:18},(_,i)=>{const r=mkRng(i*73);return{x:r()*VW,y:GY+98+r()*56,rx:2+r()*7,ry:1.5+r()*3};}).map((s,i)=>(
            <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={`rgba(100,56,10,${.06+mkRng(i*53)()*0.11})`}/>
          ))}
          <text x={VW/2} y={GY+128} textAnchor="middle" fill={hovered==="market"?"rgba(255,200,50,.55)":"rgba(255,255,255,.20)"} fontSize="10" letterSpacing="2.5">🌍 THỊ TRƯỜNG (ĐẤT) — Market Index: {mkIdx}</text>
          {/* partner category labels */}
          {[{x:108,icon:"📦",label:"Nhà cung cấp",c:"#f59e0b"},{x:316,icon:"👥",label:"HR Partners",c:"#a78bfa"},{x:660,icon:"🎓",label:"Kiến thức",c:"#34d399"},{x:892,icon:"💰",label:"Tài chính",c:"#60a5fa"}].map((lb,i)=>(
            <text key={i} x={lb.x} y={GY+150} textAnchor="middle" fill={lb.c} fontSize="10" fontWeight="700">{lb.icon} {lb.label}</text>
          ))}
        </g>

        {/* ── GRASS (partnerships) ────────────────────────────── */}
        <g style={{cursor:"pointer"}} onClick={e=>openZone("partnerships",e)}
           onMouseEnter={()=>setHovered("partnerships")} onMouseLeave={()=>setHovered(null)}>
          {blades.map((bl,i)=>(<path key={i} d={`M ${bl.lx},${GY} Q ${bl.bx},${GY-bl.h} ${bl.rx},${GY}`} fill={bl.col} opacity=".90"/>))}
          <rect x="0" y={GY-28} width={VW} height="34" fill="transparent"/>
        </g>
        {/* grass label */}
        <text x={VW/2} y={GY-7} textAnchor="middle" fill="rgba(18,80,18,.75)" fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>
          Hợp Tác · {partP}% · {partS.done}/{partS.total} việc · {healthOf(partP).dot} {healthOf(partP).label}
        </text>

        {/* ── CANOPY LABELS (on top of everything) ────────────── */}
        <CanopyLabel cx={PIANO_CX} cy={PIANO_CY} r={pianoR} icon="🎹" title="Piano"
          prog={pianoP} color="#8b5cf6" teamId="piano"
          hovered={hovered==="piano"} done={pianoS.done} total={pianoS.total}
          onClick={e=>openZone("piano",e)} onEnter={()=>setHovered("piano")} onLeave={()=>setHovered(null)}/>

        <CanopyLabel cx={ASST_CX} cy={ASST_CY} r={asstR} icon="📋" title="Hành Chính"
          prog={asstP} color="#3b82f6" teamId="assistant"
          hovered={hovered==="assistant"} done={asstS.done} total={asstS.total}
          onClick={e=>openZone("assistant",e)} onEnter={()=>setHovered("assistant")} onLeave={()=>setHovered(null)}/>

        <CanopyLabel cx={TECH_CX} cy={TECH_CY} r={techR} icon="⚙️" title="Công Nghệ"
          prog={techP} color="#6366f1" teamId="tech"
          hovered={hovered==="tech"} done={techS.done} total={techS.total}
          onClick={e=>openZone("tech",e)} onEnter={()=>setHovered("tech")} onLeave={()=>setHovered(null)}/>

        {/* trunk click zone */}
        <rect x={TX-72} y={TRUNK_TOP_Y} width={144} height={GY-TRUNK_TOP_Y} rx="12" fill="transparent" style={{cursor:"pointer"}}
          onClick={e=>openZone("tech",e)} onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}/>

      </svg>

      {/* ── MINI POPUP ─────────────────────────────────────── */}
      {popup&&(()=>{
        const tid=ZONE_META[popup.zone].teamId;
        const s=tid?gs(tid):{done:0,total:0,overdue:0};
        const p=tid?gp(tid):0;
        const extra=
          popup.zone==="heaven"?`🌦 Index: ${hvIdx}  ·  Mưa: ${rainOn?"Đang bật":"Đang tắt"}`:
          popup.zone==="market"?`📈 Market Index: ${mkIdx}`:
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
