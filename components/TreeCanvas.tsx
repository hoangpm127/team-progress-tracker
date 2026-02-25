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
  if(r>=0.80)return{label:"Đúng tiến độ",color:"#10b981",dot:"🟢"};
  if(r>=0.50)return{label:"Hơi chậm",color:"#f59e0b",dot:"🟡"};
  return{label:"Nguy hiểm",color:"#ef4444",dot:"🔴"};
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
                  <span className="text-emerald-600">🟢 {app.projects.filter(p=>p.status==="live").length}</span>
                  <span className="text-amber-600">🔨 {app.projects.filter(p=>p.status==="building").length}</span>
                  <span className="text-slate-400">💡 {app.projects.filter(p=>p.status==="idea").length}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {app.projects.map(p=>{
                  const m:{[k:string]:{dot:string;bg:string;tc:string}}={live:{dot:"🟢",bg:"#f0fdf4",tc:"#166534"},building:{dot:"🔨",bg:"#fffbeb",tc:"#92400e"},idea:{dot:"💡",bg:"#f8fafc",tc:"#475569"}};
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
//  CANOPY BLOB GENERATOR  (organic cluster, size = progress)
// ─────────────────────────────────────────────────────────────
interface Blob{cx:number;cy:number;r:number;layer:0|1|2}
function genBlobs(cx:number,cy:number,prog:number,seed:number):Blob[]{
  // base radius grows with progress: 48(0%) → 108(100%)
  const base=Math.round(48+prog*0.60);
  // blob count grows: 3(0%) → 10(100%)
  const count=Math.round(3+prog/14);
  const rng=mkRng(seed);
  const out:Blob[]=[{cx,cy,r:base,layer:0}];
  for(let i=0;i<count;i++){
    const angle=rng()*Math.PI*2;
    const dist=rng()*base*0.65;
    const r=Math.round(base*(0.50+rng()*0.48));
    const layer:0|1|2=i<2?0:i<5?1:2;
    out.push({cx:Math.round(cx+Math.cos(angle)*dist),cy:Math.round(cy+Math.sin(angle)*dist),r,layer});
  }
  return out;
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
  const W=hovered?176:148, H=hovered?54:34;
  const bx=cx-W/2, by=cy+r+8;
  return(
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick} style={{cursor:"pointer"}}>
      {/* large invisible hit zone */}
      <ellipse cx={cx} cy={cy} rx={r+36} ry={r+28} fill="transparent"/>
      {/* label badge */}
      <rect x={bx} y={by} width={W} height={H} rx="9"
        fill={hovered?color:"rgba(12,16,30,0.84)"} stroke={color} strokeWidth="2"
        style={{filter:hovered?"drop-shadow(0 4px 10px rgba(0,0,0,.4))":""}}/>
      <text x={cx} y={by+15} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{icon} {title}</text>
      {teamId&&(
        <text x={cx} y={by+29} textAnchor="middle" fill={hovered?"rgba(255,255,255,.95)":color} fontSize="10" fontWeight="700">{prog}% · {h.dot} {h.label}</text>
      )}
      {hovered&&teamId&&(
        <text x={cx} y={by+45} textAnchor="middle" fill="rgba(255,255,255,.85)" fontSize="9">✅ {done}/{total} việc hoàn thành</text>
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
const TX=500;                    // trunk center X
const TRUNK_TOP_Y=252;           // where trunk meets main fork Y
const TRUNK_TW=32;               // trunk half-width at top
const TRUNK_BW=64;               // trunk half-width at base
// Main branch fork exits
const LBX=TX-16, LBY=320;
const RBX=TX+16, RBY=320;
// Canopy centers
const PIANO_CX=196, PIANO_CY=148;
const ASST_CX=804,  ASST_CY=148;
const TECH_CX=500,  TECH_CY=116;
// Secondary horizontal branch stubs
const ML_CX=310, ML_CY=348;     // mid-left
const MR_CX=690, MR_CY=348;    // mid-right

const TRUNK_PATH=`
  M ${TX-TRUNK_TW},${TRUNK_TOP_Y}
  C ${TX-TRUNK_TW-4},${TRUNK_TOP_Y+70} ${TX-TRUNK_BW-4},${GY-110} ${TX-TRUNK_BW},${GY}
  L ${TX+TRUNK_BW},${GY}
  C ${TX+TRUNK_BW+4},${GY-110} ${TX+TRUNK_TW+4},${TRUNK_TOP_Y+70} ${TX+TRUNK_TW},${TRUNK_TOP_Y}
  Z
`;

// Canopy colour palette (3 shading layers)
const DEEP=["#174d20","#1b5a25","#1f642a"];
const MID= ["#247730","#2c8838","#339942"];
const LITE=["#39aa4e","#46bc60","#55cc6e","#68d880"];

// Pre-baked seeded values for grass & rain
const RAIN_DROPS=Array.from({length:26},(_,i)=>{const r=mkRng(i*137);return{x:600+r()*240,y:28+r()*120,del:r()*1.6,dur:.46+r()*.44};});
function makeGrass(count:number){
  return Array.from({length:count},(_,i)=>{
    const r=mkRng(i*17+3);const bx=r()*VW;const h=12+r()*24;
    return{bx,h,lx:bx-3-r()*5,rx:bx+3+r()*5,col:["#236018","#2a6e1e","#328426","#246018","#389224"][i%5]};
  });
}

// ─────────────────────────────────────────────────────────────
//  LEAF CLUSTER  (individual SVG leaves at canopy perimeter)
// ─────────────────────────────────────────────────────────────
const GREEN_LEAF=["#2e8a1e","#368424","#3a9628","#2c801c","#44a032","#30961e"];
function LeafCluster({cx,cy,r,done,overdue,prog,seed}:{cx:number;cy:number;r:number;done:number;overdue:number;prog:number;seed:number}){
  const rng=mkRng(seed*7+13);
  const greenCount=Math.min(done,38);
  const yellowCount=Math.min(overdue,8);
  if(greenCount+yellowCount===0) return null;
  const leafSz=6.5+prog*0.045;
  // arc: 130° → 410° (wraps top), skipping bottom 80° where branch attaches
  const AS=130*Math.PI/180, AE=410*Math.PI/180, AT=AE-AS;
  const out:React.ReactElement[]=[];
  // green leaves
  for(let i=0;i<greenCount;i++){
    const t=rng();
    const angle=AS+t*AT;
    const dist=r*(0.82+rng()*0.30);
    const lx=cx+Math.cos(angle)*dist;
    const ly=cy+Math.sin(angle)*dist;
    const rot=angle*180/Math.PI+90;
    const sz=leafSz*(0.65+rng()*0.65);
    const col=GREEN_LEAF[i%GREEN_LEAF.length];
    out.push(<path key={`g${i}`}
      d={`M 0,0 C ${sz*.36},${-sz*.28} ${sz*.30},${-sz*.82} 0,${-sz} C ${-sz*.30},${-sz*.82} ${-sz*.36},${-sz*.28} 0,0 Z`}
      fill={col} opacity={0.72+rng()*.22}
      transform={`translate(${lx},${ly}) rotate(${rot})`}/>);
  }
  // yellow overdue leaves (drooping — rotation offset +40°)
  for(let i=0;i<yellowCount;i++){
    const t=rng();
    const angle=AS+30*Math.PI/180+t*(AT-60*Math.PI/180);
    const dist=r*(0.78+rng()*.22);
    const lx=cx+Math.cos(angle)*dist;
    const ly=cy+Math.sin(angle)*dist;
    const rot=angle*180/Math.PI+90+38+rng()*28;
    const sz=leafSz*(0.55+rng()*.50);
    out.push(<path key={`y${i}`}
      d={`M 0,0 C ${sz*.36},${-sz*.28} ${sz*.30},${-sz*.82} 0,${-sz} C ${-sz*.30},${-sz*.82} ${-sz*.36},${-sz*.28} 0,0 Z`}
      fill={i%2===0?"#fbbf24":"#f59e0b"} opacity="0.86"
      transform={`translate(${lx},${ly}) rotate(${rot})`}/>);
  }
  return <g style={{pointerEvents:"none"}}>{out}</g>;
}

// ─────────────────────────────────────────────────────────────
//  FLOWER / FRUIT (milestone: 80% → flower, 100% → fruit)
// ─────────────────────────────────────────────────────────────
function FlowerTip({cx,cy,prog}:{cx:number;cy:number;prog:number}){
  if(prog<80) return null;
  if(prog>=100){
    return(
      <g filter="url(#fruitGlow)" style={{pointerEvents:"none"}}>
        <circle cx={cx} cy={cy} r={9} fill="url(#fruitG)"/>
        <circle cx={cx-2.5} cy={cy-2.8} r={2.4} fill="rgba(255,255,255,.38)"/>
        <path d={`M ${cx},${cy-9} Q ${cx+4},${cy-15} ${cx+2},${cy-18}`}
          stroke="#3d6012" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      </g>
    );
  }
  // flower at 80–99%
  const PR=5.5;
  return(
    <g style={{pointerEvents:"none"}}>
      {Array.from({length:5},(_,i)=>{
        const a=i*72*Math.PI/180-Math.PI/2;
        const px=cx+Math.cos(a)*PR*1.85;
        const py=cy+Math.sin(a)*PR*1.85;
        return(<ellipse key={i} cx={px} cy={py} rx={PR} ry={PR*.52}
          fill="#fff8c0" stroke="#fbbf24" strokeWidth="0.8" opacity=".94"
          transform={`rotate(${i*72-90} ${px} ${py})`}/>);
      })}
      <circle cx={cx} cy={cy} r={PR*.62} fill="#fbbf24"/>
      <circle cx={cx-1} cy={cy-1} r={PR*.22} fill="rgba(255,255,255,.45)"/>
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

  // Generate blob arrays (memo-ized by progress)
  const pianoBlobs=useMemo(()=>genBlobs(PIANO_CX,PIANO_CY,pianoP,11),[pianoP]);
  const asstBlobs= useMemo(()=>genBlobs(ASST_CX, ASST_CY, asstP, 22),[asstP]);
  const techBlobs= useMemo(()=>genBlobs(TECH_CX,  TECH_CY, techP, 33),[techP]);
  const mlBlobs=   useMemo(()=>genBlobs(ML_CX,    ML_CY,   Math.round(techP*0.65),44),[techP]);
  const mrBlobs=   useMemo(()=>genBlobs(MR_CX,    MR_CY,   Math.round(techP*0.65),55),[techP]);
  const blades=    useMemo(()=>makeGrass(32+Math.round(partP*.4)),[partP]);

  const pianoR=pianoBlobs[0].r, asstR=asstBlobs[0].r, techR=techBlobs[0].r;
  const mlR=mlBlobs[0].r, mrR=mrBlobs[0].r;

  // Trunk colour (warmer when tech is doing well)
  const sat=40+techP*.12;
  const tA=`hsl(22,${sat}%,18%)`, tB=`hsl(26,${sat+10}%,30%)`, tC=`hsl(24,${sat+5}%,24%)`;

  // Helper: render a canopy cluster
  function BlobGroup({blobs,rimColor,rimW=5,rimOp=.45}:{blobs:Blob[];rimColor?:string;rimW?:number;rimOp?:number}){
    const base=blobs[0];
    return(
      <>
        {blobs.filter(b=>b.layer===0).map((b,i)=><circle key={`d${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={DEEP[i%3]}/>)}
        {blobs.filter(b=>b.layer===1).map((b,i)=><circle key={`m${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={MID[i%3]}/>)}
        {blobs.filter(b=>b.layer===2).map((b,i)=><circle key={`l${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={LITE[i%4]} opacity=".88"/>)}
        {/* specular highlight dot */}
        <circle cx={base.cx-base.r*0.26} cy={base.cy-base.r*0.30} r={Math.round(base.r*0.28)} fill={LITE[3]} opacity=".45"/>
        {/* team identity rim */}
        {rimColor&&<circle cx={base.cx} cy={base.cy} r={base.r+rimW} fill="none" stroke={rimColor} strokeWidth={rimW*1.4} opacity={rimOp}/>}
      </>
    );
  }

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
          <filter id="leafShadow" x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow dx="0" dy="10" stdDeviation="13" floodColor="#09200e" floodOpacity=".20"/>
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

        {/* ── SKY ──────────────────────────────────────────────── */}
        <rect x="0" y="0" width={VW} height={VH} fill="#b4d8f0"/>
        <defs>
          <linearGradient id="skyG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#88bede"/><stop offset="55%" stopColor="#b8dcf0"/>
            <stop offset="78%" stopColor="#c2e4b4"/><stop offset="100%" stopColor="#baded8"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={VW} height={VH} fill="url(#skyG2)"/>

        {/* sun */}
        <circle cx="86" cy="80" r="56" fill="rgba(255,240,150,.25)" filter="url(#cloudBlur)"/>
        <circle cx="86" cy="80" r="32" fill="rgba(255,225,60,.65)" filter="url(#cloudBlur)"/>
        <circle cx="86" cy="80" r="20" fill="rgba(255,215,40,.90)"/>
        {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,r1=26,r2=46;return(<line key={i} x1={86+r1*Math.cos(a)} y1={80+r1*Math.sin(a)} x2={86+r2*Math.cos(a)} y2={80+r2*Math.sin(a)} stroke="rgba(255,210,40,.50)" strokeWidth="2.5" strokeLinecap="round"/>);})}

        {/* horizon ground ambient */}
        <ellipse cx={TX} cy={GY} rx="480" ry="62" fill="rgba(140,210,80,.18)"/>

        {/* ── WIND LINES ─────────────────────────────────────── */}
        {[{x:28,y:192,w:62,d:"0s",dr:"2.2s"},{x:20,y:218,w:76,d:".5s",dr:"2.5s"},{x:36,y:244,w:54,d:".9s",dr:"1.9s"}].map((wl,i)=>(
          <line key={i} className="wl" x1={wl.x} y1={wl.y} x2={wl.x+wl.w} y2={wl.y}
            stroke="rgba(120,185,226,.52)" strokeWidth="2.5" strokeLinecap="round"
            style={{animationDelay:wl.d,animationDuration:wl.dr}}/>
        ))}

        {/* ── LEFT CLOUD — Marketing ──────────────────────────── */}
        <g className="cl" style={{cursor:"pointer"}} onClick={e=>openZone("mkt",e)}>
          <ellipse cx="160" cy="108" rx="120" ry="76" fill="white" opacity=".14" filter="url(#cloudBlur)"/>
          <circle cx="160" cy="116" r="66"  fill="white" opacity=".96"/>
          <circle cx="94"  cy="128" r="52"  fill="white" opacity=".93"/>
          <circle cx="226" cy="124" r="54"  fill="white" opacity=".93"/>
          <circle cx="126" cy="84"  r="46"  fill="white" opacity=".94"/>
          <circle cx="186" cy="78"  r="42"  fill="white" opacity=".93"/>
          <circle cx="157" cy="60"  r="35"  fill="white" opacity=".89"/>
          {mktP>25&&<ellipse cx="160" cy="106" rx="90" ry="54" fill={`rgba(236,72,153,${(mktP-25)/280})`}/>}
          {/* label */}
          <rect x="78" y="155" width="164" height={hovered==="mkt"?52:34} rx="9"
            fill={hovered==="mkt"?"#ec4899":"rgba(12,16,28,.86)"} stroke="#f472b6" strokeWidth="1.8"/>
          <text x="160" y="169" textAnchor="middle" fill="white" fontSize="12" fontWeight="800" style={{pointerEvents:"none"}}>📣 Marketing</text>
          <text x="160" y="182" textAnchor="middle" fill={hovered==="mkt"?"white":"#f472b6"} fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>{mktP}% · {healthOf(mktP).dot} {healthOf(mktP).label}</text>
          {hovered==="mkt"&&<text x="160" y="197" textAnchor="middle" fill="rgba(255,255,255,.85)" fontSize="9" style={{pointerEvents:"none"}}>✅ {mktS.done}/{mktS.total} việc</text>}
          {/* large hit zone */}
          <rect x="20" y="32" width="280" height="185" rx="14" fill="transparent"
            onMouseEnter={()=>setHovered("mkt")} onMouseLeave={()=>setHovered(null)}/>
        </g>

        {/* ── RIGHT CLOUD — Thiên thời ────────────────────────── */}
        <g className="cr" style={{cursor:"pointer"}} onClick={e=>openZone("heaven",e)}>
          <ellipse cx="840" cy="108" rx="130" ry="78" fill="white" opacity=".14" filter="url(#cloudBlur)"/>
          <circle cx="840" cy="116" r="70"  fill="white" opacity=".96"/>
          <circle cx="768" cy="130" r="56"  fill="white" opacity=".93"/>
          <circle cx="914" cy="126" r="58"  fill="white" opacity=".93"/>
          <circle cx="804" cy="82"  r="50"  fill="white" opacity=".94"/>
          <circle cx="866" cy="76"  r="46"  fill="white" opacity=".93"/>
          <circle cx="836" cy="56"  r="40"  fill="white" opacity=".89"/>
          {hvIdx>35&&<ellipse cx="840" cy="106" rx="98" ry="58" fill={`rgba(14,165,233,${(hvIdx-35)/280})`}/>}
          {rainOn&&<g opacity=".80">{Array.from({length:7},(_,i)=>(<line key={i} x1={794+i*14} y1={148} x2={790+i*14} y2={164} stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round"/>))}</g>}
          <rect x="700" y="155" width="280" height={hovered==="heaven"?52:34} rx="9"
            fill={hovered==="heaven"?"#0ea5e9":"rgba(12,16,28,.86)"} stroke="#38bdf8" strokeWidth="1.8"/>
          <text x="840" y="169" textAnchor="middle" fill="white" fontSize="12" fontWeight="800" style={{pointerEvents:"none"}}>🌦 Thiên Thời</text>
          <text x="840" y="182" textAnchor="middle" fill={hovered==="heaven"?"white":"#38bdf8"} fontSize="10" fontWeight="700" style={{pointerEvents:"none"}}>Index: {hvIdx} · {rainOn?"🌧 Đang mưa":"☀️ Quang đãng"}</text>
          {hovered==="heaven"&&<text x="840" y="197" textAnchor="middle" fill="rgba(255,255,255,.85)" fontSize="9" style={{pointerEvents:"none"}}>Bấm để xem chi tiết thiên thời</text>}
          <rect x="700" y="32" width="290" height="185" rx="14" fill="transparent"
            onMouseEnter={()=>setHovered("heaven")} onMouseLeave={()=>setHovered(null)}/>
        </g>

        {/* ── RAIN ─────────────────────────────────────────────── */}
        {rainOn&&RAIN_DROPS.map((r,i)=>(
          <line key={i} className="rd" x1={r.x} y1={r.y} x2={r.x-3} y2={r.y+18}
            stroke="rgba(90,140,220,.52)" strokeWidth="1.8" strokeLinecap="round"
            style={{animationDelay:`${r.del}s`,animationDuration:`${r.dur}s`}}/>
        ))}

        {/* ═══════════════════════════════════════════════════
               TREE (entire group sways together)
        ═══════════════════════════════════════════════════ */}
        <g className="tree-grp" filter="url(#leafShadow)">

          {/* ── BRANCHES (rendered before canopy blobs) ─────── */}
          {/* Left main branch: trunk fork → Piano cluster */}
          <path d={branchPath(LBX,LBY,PIANO_CX,PIANO_CY+pianoR*0.55,22,11)} fill={tC}/>
          {/* Right main branch: trunk fork → Assistant cluster */}
          <path d={branchPath(RBX,RBY,ASST_CX, ASST_CY+asstR*0.55, 22,11)} fill={tC}/>
          {/* Mid-left sub-branch */}
          <path d={branchPath(TX-22,392,ML_CX,ML_CY+mlR*0.55,15,8)} fill={tA}/>
          {/* Mid-right sub-branch */}
          <path d={branchPath(TX+22,392,MR_CX,MR_CY+mrR*0.55,15,8)} fill={tA}/>

          {/* ── PIANO LEFT CANOPY ────────────────────────────── */}
          <BlobGroup blobs={pianoBlobs} rimColor="#8b5cf6" rimW={5}/>
          <LeafCluster cx={PIANO_CX} cy={PIANO_CY} r={pianoR} done={pianoS.done} overdue={pianoS.overdue} prog={pianoP} seed={101}/>
          <FlowerTip cx={PIANO_CX} cy={PIANO_CY-pianoR-6} prog={pianoP}/>

          {/* ── ASSISTANT RIGHT CANOPY ───────────────────────── */}
          <BlobGroup blobs={asstBlobs} rimColor="#3b82f6" rimW={5}/>
          <LeafCluster cx={ASST_CX} cy={ASST_CY} r={asstR} done={asstS.done} overdue={asstS.overdue} prog={asstP} seed={202}/>
          <FlowerTip cx={ASST_CX} cy={ASST_CY-asstR-6} prog={asstP}/>

          {/* ── MID-LEFT sub-canopy (part of tech, no label) ─── */}
          <BlobGroup blobs={mlBlobs}/>

          {/* ── MID-RIGHT sub-canopy ─────────────────────────── */}
          <BlobGroup blobs={mrBlobs}/>

          {/* ── CENTER TECH CROWN ────────────────────────────── */}
          <BlobGroup blobs={techBlobs} rimColor="#6366f1" rimW={6}/>
          <LeafCluster cx={TECH_CX} cy={TECH_CY} r={techR} done={techS.done} overdue={techS.overdue} prog={techP} seed={303}/>
          <FlowerTip cx={TECH_CX} cy={TECH_CY-techR-6} prog={techP}/>

          {/* ── TRUNK ─────────────────────────────────────────── */}
          <path d={TRUNK_PATH} fill="url(#trunkG)" filter="url(#trunkShd)"/>
          <path d={TRUNK_PATH} fill="url(#barkPat)" opacity=".26"/>
          {/* sheen */}
          <path d={`M ${TX-6},${TRUNK_TOP_Y} C ${TX-7},${TRUNK_TOP_Y+80} ${TX-8},${GY-120} ${TX-10},${GY} L ${TX+2},${GY} C ${TX},${GY-120} ${TX+1},${TRUNK_TOP_Y+80} ${TX+2},${TRUNK_TOP_Y} Z`}
            fill="rgba(200,140,50,.10)"/>
          {/* subtle trunk label */}
          <text x={TX} y={436} textAnchor="middle" fill="rgba(255,255,255,.18)" fontSize="9" fontWeight="700" letterSpacing="2.5">TECH CORE</text>
          <text x={TX} y={450} textAnchor="middle" fill="rgba(255,255,255,.12)" fontSize="8">
            {app.projects.filter(p=>p.status==="live").length} live · {app.projects.filter(p=>p.status==="building").length} đang xây
          </text>
        </g>{/* end .tree-grp */}

        {/* ── GROUND LINE ─────────────────────────────────────── */}
        <rect x="0" y={GY} width={VW} height="22" fill="url(#soilG)"/>

        {/* ── HR ROOTS (amber — clearly different from trunk) ── */}
        <g style={{cursor:"pointer"}} onClick={e=>openZone("hr",e)}
           onMouseEnter={()=>setHovered("hr")} onMouseLeave={()=>setHovered(null)}>
          {/* large left root surfacing above ground */}
          <path d={`M ${TX-TRUNK_BW},${GY} C ${TX-110},${GY+8} ${TX-220},${GY-14} ${TX-330},${GY+2}
            C ${TX-390},${GY+12} ${TX-420},${GY+28} ${TX-450},${GY+46}
            L ${TX-438},${GY+54} C ${TX-406},${GY+36} ${TX-374},${GY+20} ${TX-314},${GY+10}
            L ${TX-310},${GY+60} L ${TX-294},${GY+62} L ${TX-298},${GY+10}
            C ${TX-200},${GY+0} ${TX-96},${GY+16} ${TX-TRUNK_BW+8},${GY+20} Z`}
            fill="url(#hrRootG)" opacity=".94"/>
          {/* large right root */}
          <path d={`M ${TX+TRUNK_BW},${GY} C ${TX+110},${GY+8} ${TX+220},${GY-14} ${TX+330},${GY+2}
            C ${TX+390},${GY+12} ${TX+420},${GY+28} ${TX+450},${GY+46}
            L ${TX+438},${GY+54} C ${TX+406},${GY+36} ${TX+374},${GY+20} ${TX+314},${GY+10}
            L ${TX+310},${GY+60} L ${TX+294},${GY+62} L ${TX+298},${GY+10}
            C ${TX+200},${GY+0} ${TX+96},${GY+16} ${TX+TRUNK_BW-8},${GY+20} Z`}
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
          <rect x={TX-90} y={GY+52} width={180} height={hovered==="hr"?54:36} rx="9"
            fill={hovered==="hr"?"#f59e0b":"rgba(12,16,28,.86)"} stroke="#fbbf24" strokeWidth="1.8"/>
          <text x={TX} y={GY+66} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">👥 Nhân Sự (Rễ)</text>
          <text x={TX} y={GY+80} textAnchor="middle" fill={hovered==="hr"?"white":"#fbbf24"} fontSize="10" fontWeight="700">{hrP}% · {healthOf(hrP).dot} {healthOf(hrP).label}</text>
          {hovered==="hr"&&<text x={TX} y={GY+97} textAnchor="middle" fill="rgba(255,255,255,.85)" fontSize="9">✅ {hrS.done}/{hrS.total} việc hoàn thành</text>}
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
          🌿 Hợp Tác · {partP}% · {partS.done}/{partS.total} việc · {healthOf(partP).dot} {healthOf(partP).label}
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
