"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useApp } from "@/lib/AppContext";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  LAYER JSON â€” static import (public/pic_layers/ for images)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW = require("@/scripts/pic_layers_report.json") as {
  original_size: { width: number; height: number };
  layers: LayerEntry[];
};
interface LayerEntry {
  id: string; source: string;
  x: number; y: number; width: number; height: number;
  rotation?: number; flipX?: boolean;
  zIndex: number; opacity: number;
  isSliced?: boolean; sliceType?: string; origH?: number; origY?: number;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  ZONE META
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ZoneId = "tech"|"hr"|"mkt"|"heaven"|"partnerships"|"market"|"assistant"|"piano";
const ZONE_META: Record<ZoneId,{icon:string;title:string;color:string;border:string;subtitle:string;teamId:string|null}> = {
  tech:         {icon:"âš™ï¸", title:"CÃ´ng nghá»‡",  color:"#888888",border:"#aaaaaa",subtitle:"ThÃ¢n cÃ¢y â€” Technology Core",        teamId:"tech"},
  hr:           {icon:"ðŸ‘¥", title:"NhÃ¢n sá»±",    color:"#cccccc",border:"#dddddd",subtitle:"Rá»… cÃ¢y â€” Human Resources",          teamId:"hr"},
  mkt:          {icon:"ðŸ“£", title:"Marketing",  color:"#999999",border:"#aaaaaa",subtitle:"MÃ¢y trÃ¡i â€” Quáº£ng bÃ¡ & ThÆ°Æ¡ng hiá»‡u", teamId:"mkt"},
  heaven:       {icon:"ðŸŒ¦", title:"ThiÃªn thá»i", color:"#888888",border:"#aaaaaa",subtitle:"MÃ¢y pháº£i â€” CÆ¡ há»™i & Thá»i Ä‘iá»ƒm",    teamId:null},
  partnerships: {icon:"ðŸ¤", title:"Há»£p tÃ¡c",    color:"#aaaaaa",border:"#bbbbbb",subtitle:"Cá» xanh â€” 4 nhÃ³m Ä‘á»‘i tÃ¡c",         teamId:"partnerships"},
  market:       {icon:"ðŸŒ", title:"Thá»‹ trÆ°á»ng", color:"#888888",border:"#aaaaaa",subtitle:"Äáº¥t â€” Bá»‘i cáº£nh kinh doanh",         teamId:null},
  assistant:    {icon:"ðŸ“‹", title:"HÃ nh chÃ­nh", color:"#aaaaaa",border:"#bbbbbb",subtitle:"NhÃ¡nh pháº£i â€” BOD / Admin",          teamId:"assistant"},
  piano:        {icon:"ðŸŽ¹", title:"Piano",      color:"#999999",border:"#aaaaaa",subtitle:"NhÃ¡nh pháº£i â€” Piano Division",       teamId:"piano"},
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function mkRng(seed:number){
  let s=seed;
  return()=>{s=s+0x6d2b79f5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
const Q1_START=+new Date("2026-01-01"), Q1_END=+new Date("2026-03-31"), TODAY_TS=+new Date("2026-02-25");
const ELAPSED=Math.round(Math.min(1,(TODAY_TS-Q1_START)/(Q1_END-Q1_START))*100);
function healthOf(prog:number){
  const r=ELAPSED>0?prog/ELAPSED:1;
  if(r>=0.80)return{label:"ÄÃºng tiáº¿n Ä‘á»™",color:"#cccccc",dot:"â—"};
  if(r>=0.50)return{label:"HÆ¡i cháº­m",color:"#aaaaaa",dot:"â—"};
  return{label:"Nguy hiá»ƒm",color:"#777777",dot:"â—"};
}
// Rule XI: weighted health score
function calcHealthScore(techP:number,hrP:number,pianoP:number,asstP:number,mktP:number,partP:number){
  return Math.round(techP*0.30+hrP*0.20+pianoP*0.15+asstP*0.15+mktP*0.10+partP*0.10);
}
// Branch level threshold (Rule V â†’ applied to image levels)
function levelFor(prog:number):number{
  if(prog>=75)return 4;
  if(prog>=50)return 3;
  if(prog>=25)return 2;
  return 1;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  IMAGE LAYER HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function imgSrc(source:string){ return `/pic_layers/layer_${source}`; }
function layerTransform(l:LayerEntry, renderY:number, renderH:number){
  const cx=l.x+l.width/2, cy=renderY+renderH/2;
  const parts:string[]=[];
  if(l.rotation) parts.push(`rotate(${l.rotation},${cx},${cy})`);
  if(l.flipX)    parts.push(`translate(${cx},0) scale(-1,1) translate(${-cx},0)`);
  return parts.join(" ");
}
// Classify a layer: bg | env | branch(group,level)
function classifyLayer(l:LayerEntry):{type:"bg"|"env"|"branch";group?:string;level?:number}{
  if(l.source==="15.png") return{type:"bg"};
  const m=l.id.match(/^branch_([A-E])_lv(\d)_/);
  if(m) return{type:"branch",group:m[1],level:parseInt(m[2])};
  const BRANCH_A:{[k:string]:number}={"7.png":1,"8.png":2,"9.png":3,"10.png":4};
  if(BRANCH_A[l.source]) return{type:"branch",group:"A",level:BRANCH_A[l.source]};
  return{type:"env"};
}
// Group A â†’ piano, Group B â†’ assistant, C/D/E â†’ decorative (health score)
const GROUP_ZONE:{[g:string]:ZoneId|null}={A:"piano",B:"assistant",C:null,D:null,E:null};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  NEW TREE LAYOUT CONSTANTS  (viewBox 5120 Ã— 3365)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const VW=5120, VH=3365;
// Animated layer group anchors
const TRUNK_BASE_CX=2571, TRUNK_BASE_CY=2730; // layer_5 bottom center
// Branch badge anchor positions (above Lv1 bounding boxes)
const PIANO_CX=2921, PIANO_CY=460;  // Group A Lv1 cx=2921, above it
const ASST_CX=2100,  ASST_CY=130;   // Group B Lv1, adjusted for rot=40
const TECH_CX=2570,  TECH_CY=120;   // top of layer_6 canopy
// FlowerTip anchor (top of highest branch level)
const PIANO_FLOWER_CX=3072, PIANO_FLOWER_BASE_Y=310; // Group A Lv4 top
const ASST_FLOWER_CX=2240,  ASST_FLOWER_BASE_Y=20;   // Group B Lv4 top
// Rain drops (near layer_4 / heaven zone)  [Rule X]
const RAIN_DROPS=Array.from({length:26},(_,i)=>{const r=mkRng(i*137);return{x:3400+r()*800,y:250+r()*300,del:r()*1.6,dur:.46+r()*.44};});
// Wind lines (near layer_2 / mkt zone)  [Rule VIII]
const WIND_LINES=[{x:100,y:1000,w:320,d:"0s",dr:"2.2s"},{x:80,y:1110,w:390,d:".5s",dr:"2.5s"},{x:180,y:1240,w:280,d:".9s",dr:"1.9s"}];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  MINI POPUP  (Rule: MiniPopup unchanged)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">Ã—</button>
      </div>
      {meta.teamId&&(
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Tiáº¿n Ä‘á»™ Q1</span>
            <span className="text-base font-bold" style={{color:meta.color}}>{prog}%</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div className="h-2.5 rounded-full" style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}66,${meta.color})`}}/>
          </div>
          <div className="flex gap-3 text-xs text-slate-400 mb-1">
            <span>âœ… {done}/{total} tasks</span>
            {overdue>0&&<span className="text-white/40">âš  {overdue} quÃ¡ háº¡n</span>}
          </div>
          <div className="text-xs font-medium" style={{color:h.color}}>{h.dot} {h.label}</div>
        </div>
      )}
      {extra&&<div className="px-4 py-2 text-xs text-slate-300 border-t border-white/5">{extra}</div>}
      <div className="px-4 py-3 border-t border-white/5">
        <button onClick={onDetail} className="w-full py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 hover:brightness-110"
          style={{background:`linear-gradient(135deg,${meta.color}dd,${meta.color})`}}>
          Xem chi tiáº¿t â†’
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  FULL SIDE PANEL  (Rule: FullPanel unchanged)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PARTNER_CATS=[
  {id:1,label:"NhÃ  cung cáº¥p",icon:"ðŸ“¦",color:"#cccccc"},
  {id:2,label:"HR Partners", icon:"ðŸ‘¥",color:"#aaaaaa"},
  {id:3,label:"Kiáº¿n thá»©c",   icon:"ðŸŽ“",color:"#bbbbbb"},
  {id:4,label:"TÃ i chÃ­nh",   icon:"ðŸ’°",color:"#aaaaaa"},
];
function FullPanel({zone,onClose}:{zone:ZoneId;onClose():void}){
  const app=useApp();const meta=ZONE_META[zone];const teamId=meta.teamId;
  const tasks=teamId?app.getTeamTasks(teamId):[];
  const stats=teamId?app.getTeamStats(teamId):{done:0,total:0,overdue:0};
  const prog=teamId?app.getTeamProgress(teamId):0;
  const acts=teamId?app.getTeamActivity(teamId).slice(0,6):[];
  const today=new Date().toISOString().split("T")[0];
  const h=healthOf(prog);
  const SC:{[k:string]:string}={Todo:"#555555",Doing:"#888888",Done:"#cccccc"};
  const SL:{[k:string]:string}={Todo:"Chá» lÃ m",Doing:"Äang lÃ m",Done:"HoÃ n thÃ nh"};
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
                  <span className="text-xs text-slate-500">Tiáº¿n Ä‘á»™ Q1</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{color:h.color}}>{h.dot} {h.label}</span>
                    <span className="font-bold text-lg" style={{color:meta.color}}>{prog}%</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full" style={{width:`${prog}%`,background:`linear-gradient(90deg,${meta.color}88,${meta.color})`}}/>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>âœ… {stats.done}/{stats.total} tasks</span>
                  {stats.overdue>0&&<span className="text-white/40">âš  {stats.overdue} quÃ¡ háº¡n</span>}
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-3">Ã—</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {zone==="tech"&&(
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">30 Dá»± Ãn CÃ´ng Nghá»‡</h3>
                <div className="flex gap-2 text-xs">
                  <span className="text-white/70">â— {app.projects.filter(p=>p.status==="live").length}</span>
                  <span className="text-white/50">ðŸ”¨ {app.projects.filter(p=>p.status==="building").length}</span>
                  <span className="text-slate-400">ðŸ’¡ {app.projects.filter(p=>p.status==="idea").length}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {app.projects.map(p=>{
                  const m:{[k:string]:{dot:string;bg:string;tc:string}}={live:{dot:"â—",bg:"#f0fdf4",tc:"#166534"},building:{dot:"â—",bg:"#fffbeb",tc:"#92400e"},idea:{dot:"â—‹",bg:"#f8fafc",tc:"#475569"}};
                  const{dot,bg,tc}=m[p.status];
                  return(<div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{background:bg}}><span className="text-sm shrink-0">{dot}</span><div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{color:tc}}>{p.name}</div><div className="text-xs text-slate-400">{p.owner}</div></div></div>);
                })}
              </div>
            </div>
          )}
          {zone==="partnerships"&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">4 NhÃ³m Äá»‘i TÃ¡c</h3>
              {PARTNER_CATS.map(cat=>{
                const list=app.partners.filter(p=>p.category===cat.id);
                return(
                  <div key={cat.id} className="mb-5">
                    <div className="flex items-center gap-2 mb-2"><span>{cat.icon}</span><span className="text-sm font-semibold" style={{color:cat.color}}>{cat.label}</span><span className="ml-auto text-xs text-slate-400">{list.filter(p=>p.status==="active").length}/{list.length} active</span></div>
                    {list.length===0?<p className="text-xs text-slate-400 italic pl-5">ChÆ°a cÃ³ dá»¯ liá»‡u</p>
                    :<div className="space-y-1 pl-5">{list.map(p=>(<div key={p.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:p.status==="active"?"#cccccc":"#555555"}}/><span className="text-xs text-slate-600 flex-1">{p.name}</span><span className="text-xs text-slate-400">{p.status==="active"?"Active":"Pipeline"}</span></div>))}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {zone==="market"&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chá»‰ Sá»‘ Thá»‹ TrÆ°á»ng</h3>
              <div className="rounded-xl p-4 mb-3" style={{background:"#fef3c7",border:"1px solid #fde68a"}}>
                <div className="flex items-center justify-between mb-2"><span className="text-sm text-white/60">Market Index</span><span className="text-3xl font-bold text-white/80">{app.market.marketIndex}</span></div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-3 rounded-full" style={{width:`${app.market.marketIndex}%`,background:"linear-gradient(90deg,#555555,#aaaaaa)"}}/></div>
              </div>
              {app.market.notes&&<p className="text-xs text-white/50 bg-white/5 rounded-lg p-3 border border-white/10 leading-relaxed">{app.market.notes}</p>}
            </div>
          )}
          {zone==="heaven"&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">ThiÃªn Thá»i</h3>
              <div className="rounded-xl p-4 mb-4" style={{background:"#f0f9ff",border:"1px solid #bae6fd"}}>
                <div className="flex items-center justify-between mb-2"><span className="text-sm text-sky-800">Heaven Timing Index</span><span className="text-3xl font-bold text-sky-900">{app.heavenTiming.heavenTimingIndex}</span></div>
                <div className="h-3 bg-sky-100 rounded-full overflow-hidden"><div className="h-3 rounded-full" style={{width:`${app.heavenTiming.heavenTimingIndex}%`,background:"linear-gradient(90deg,#38bdf8,#0ea5e9)"}}/></div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-sm text-slate-700">ðŸŒ§ Hiá»‡u á»©ng mÆ°a</span>
                <button onClick={()=>app.setHeavenTiming({rainEnabled:!app.heavenTiming.rainEnabled})} className={`relative w-11 h-6 rounded-full transition-colors ${app.heavenTiming.rainEnabled?"bg-sky-400":"bg-slate-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${app.heavenTiming.rainEnabled?"translate-x-5":"translate-x-0.5"}`}/>
                </button>
              </div>
            </div>
          )}
          {teamId&&tasks.length>0&&(
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">CÃ´ng Viá»‡c ({tasks.length})</h3>
              <div className="space-y-2">
                {tasks.map(t=>{
                  const over=!t.done&&t.deadline<today;
                  return(
                    <div key={t.id} className={`flex gap-2.5 p-2.5 rounded-lg border ${t.done?"bg-white/8 border-white/10":over?"bg-white/5 border-white/8":"bg-slate-50 border-slate-100"}`}>
                      <button onClick={()=>{if(app.canEdit(teamId??"")){app.toggleTask(t.id,"Tree");}}} title={app.canEdit(teamId??"") ? undefined : "Cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ thay Ä‘á»•i"} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${t.done?"bg-green-500 border-green-500 text-white":"border-slate-300"} ${!app.canEdit(teamId??"") ? "opacity-50 cursor-not-allowed" : ""}`}>
                        {t.done&&<svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" strokeWidth="1.8" stroke="currentColor"><path d="M1.5 5.5L4 8 8.5 2"/></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug ${t.done?"line-through text-slate-400":"text-slate-700"}`}>{t.title}</p>
                        <div className="flex flex-wrap gap-x-2 mt-0.5">
                          <span className="text-xs" style={{color:{Todo:"#555555",Doing:"#888888",Done:"#cccccc"}[t.status]}}>{({Todo:"Chá» lÃ m",Doing:"Äang lÃ m",Done:"HoÃ n thÃ nh"})[t.status]}</span>
                          <span className="text-xs text-slate-400">Â· Háº¡n {t.deadline}</span>
                          {over&&<span className="text-xs text-white/40 font-medium">âš  QuÃ¡ háº¡n</span>}
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
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hoáº¡t Äá»™ng Gáº§n ÄÃ¢y</h3>
              <div className="space-y-2">{acts.map(a=>(<div key={a.id} className="flex gap-2 text-xs text-slate-500"><span className="text-slate-300 shrink-0">â€¢</span><span className="leading-relaxed">{a.message}</span></div>))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CANOPY BADGE  (replaces CanopyLabel, scaled for 5120Ã—3365)
//  Rule V / Rule XIV â€” permanent label, expands on hover
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const S=5; // scale: 5120/1000 â‰ˆ 5
function CanopyBadge({cx,cy,icon,title,prog,color,teamId,onClick,hovered,onEnter,onLeave,done,total}:{
  cx:number;cy:number;icon:string;title:string;prog:number;color:string;
  teamId:string|null;onClick(e:React.MouseEvent<SVGElement>):void;
  hovered:boolean;onEnter():void;onLeave():void;done:number;total:number;
}){
  const h=healthOf(prog);
  const W=(hovered?192:164)*S, H=(hovered?58:44)*S;
  const bx=cx-W/2, by=cy+32;
  const iconX=bx+22*S, iconY=by+H/2;
  return(
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick} style={{cursor:"pointer"}}>
      <ellipse cx={cx} cy={cy} rx={36*S} ry={28*S} fill="transparent"/>
      <rect x={bx+S} y={by+4*S} width={W} height={H} rx={14*S}
        fill="rgba(0,0,0,0.28)" style={{filter:`blur(${5*S}px)`,pointerEvents:"none"}}/>
      <rect x={bx} y={by} width={W} height={H} rx={14*S}
        fill={hovered?color:"rgba(8,12,26,0.92)"}
        stroke={hovered?"rgba(255,255,255,0.35)":color}
        strokeWidth={hovered?1.5*S:2.2*S}
        style={{filter:hovered?`drop-shadow(0 0 ${20*S}px ${color}66)`:"none",pointerEvents:"none"}}/>
      <circle cx={iconX} cy={iconY} r={15*S}
        fill={hovered?"rgba(255,255,255,0.22)":color+"22"}
        stroke={hovered?"rgba(255,255,255,0.45)":color}
        strokeWidth={2*S} style={{pointerEvents:"none"}}/>
      <text x={iconX} y={iconY+5*S} textAnchor="middle" fontSize={14*S} style={{pointerEvents:"none"}}>{icon}</text>
      <text x={bx+44*S} y={by+(hovered?18:H/2)*S/S}
        textAnchor="start" fill="white" fontSize={11*S} fontWeight="800" style={{pointerEvents:"none"}}>{title}</text>
      {teamId&&(
        <text x={bx+44*S} y={by+(hovered?32:H/2+13)*S/S}
          textAnchor="start" fill={hovered?"rgba(255,255,255,.92)":color}
          fontSize={10*S} fontWeight="700" style={{pointerEvents:"none"}}>{prog}% Â· {h.dot} {h.label}</text>
      )}
      {hovered&&teamId&&(
        <text x={bx+44*S} y={by+47*S} textAnchor="start"
          fill="rgba(255,255,255,.78)" fontSize={9*S} style={{pointerEvents:"none"}}>âœ… {done}/{total} hoÃ n thÃ nh</text>
      )}
    </g>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  FLOWER / FRUIT MILESTONE  (Rule VII â€” unchanged logic, coords adapted)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FlowerTip({cx,cy,prog}:{cx:number;cy:number;prog:number}){
  if(prog<80) return null;
  const r=18*S;
  if(prog>=100){
    return(
      <g filter="url(#fruitGlow)" style={{pointerEvents:"none"}}>
        <circle cx={cx} cy={cy} r={r} fill="url(#fruitG)"/>
        <circle cx={cx-3.5*S} cy={cy-4*S} r={3.4*S} fill="rgba(255,255,255,.42)"/>
        <path d={`M ${cx},${cy-r} Q ${cx+6*S},${cy-21*S} ${cx+3*S},${cy-25*S}`}
          stroke="#3d6012" strokeWidth={2.2*S} fill="none" strokeLinecap="round"/>
        <ellipse cx={cx+5*S} cy={cy-22*S} rx={5*S} ry={3*S}
          fill="#3d6012" opacity=".8" transform={`rotate(-25,${cx+5*S},${cy-22*S})`}/>
      </g>
    );
  }
  return(
    <g style={{pointerEvents:"none"}} filter="url(#fruitGlow)">
      {Array.from({length:6},(_,i)=>{
        const a=i*60*Math.PI/180-Math.PI/2;
        const px=cx+Math.cos(a)*r*2, py=cy+Math.sin(a)*r*2;
        return(<ellipse key={i} cx={px} cy={py} rx={r} ry={r*.48}
          fill="#f5f5f5" stroke="#cccccc" strokeWidth={1.2*S} opacity=".96"
          transform={`rotate(${i*60-90},${px},${py})`}/>);
      })}
      <circle cx={cx} cy={cy} r={r*.72} fill="#cccccc" stroke="#aaaaaa" strokeWidth={S}/>
      <circle cx={cx-1.5*S} cy={cy-1.5*S} r={r*.28} fill="rgba(255,255,255,.5)"/>
    </g>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SINGLE IMAGE LAYER RENDERER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LayerImg({l,extraStyle,clipId}:{l:LayerEntry;extraStyle?:React.CSSProperties;clipId?:string}){
  const isSliced=l.isSliced===true;
  const renderY=isSliced&&l.sliceType==="bottom"?(l.origY??l.y):l.y;
  const renderH=isSliced?(l.origH??l.height):l.height;
  const tr=layerTransform(l,renderY,renderH);
  return(
    <g transform={tr||undefined} clipPath={clipId?`url(#${clipId})`:undefined}>
      <image href={imgSrc(l.source)} x={l.x} y={renderY}
        width={l.width} height={renderH}
        preserveAspectRatio="none" opacity={l.opacity}
        style={extraStyle}/>
    </g>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  MAIN COMPONENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const rainOn=app.heavenTiming.rainEnabled;
  const mkIdx=app.market.marketIndex;
  const hvIdx=app.heavenTiming.heavenTimingIndex;

  // Rule XI â€” health score for desaturation + decorative branch levels
  const hScore=calcHealthScore(techP,hrP,pianoP,asstP,mktP,partP);
  const lowHealth=hScore<40;

  // Branch levels (Rule V applied to image levels)
  const pianoLvl=levelFor(pianoP);
  const asstLvl=levelFor(asstP);
  const decoLvl=levelFor(hScore); // Groups C,D,E follow overall health

  // Classify all layers
  const allLayers=RAW.layers;
  const bgLayer=allLayers.find(l=>l.source==="15.png");
  const envLayers=useMemo(()=>allLayers.filter(l=>classifyLayer(l).type==="env").sort((a,b)=>a.zIndex-b.zIndex),[allLayers]);
  const branchLayers=useMemo(()=>allLayers.filter(l=>classifyLayer(l).type==="branch"),[allLayers]);



  // Hover filter helper
  const zF=(zone:ZoneId)=>hovered===zone
    ?`brightness(1.4) drop-shadow(0 0 ${30*S}px ${ZONE_META[zone].color}88)`
    :"none";

  // Which env layers belong to which zone
  function envZone(src:string):ZoneId|null{
    if(src==="2.png")  return "mkt";
    if(src==="3.png")  return "hr";
    if(src==="4.png")  return "heaven";
    if(["5.png"].includes(src)) return "tech";
    if(src==="6.png")  return "tech";
    if(src==="11.png"||src==="12.png") return "partnerships";
    if(src==="13.png"||src==="14.png") return "market";
    return null;
  }

  return(
    <div className="relative w-full h-full">
      {/* Rule XII: sway/float/rain CSS keyframes */}
      <style>{`
        @keyframes imgSway{0%,100%{transform:rotate(-0.6deg)}50%{transform:rotate(0.6deg)}}
        @keyframes floatL{0%,100%{transform:translateY(0)}50%{transform:translateY(${-40*S}px)}}
        @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(${-30*S}px)}}
        @keyframes rainFall{0%{opacity:0;transform:translate(0,0)}15%{opacity:.7}85%{opacity:.5}100%{opacity:0;transform:translate(${-9*S}px,${58*S}px)}}
        @keyframes windGust{0%,100%{opacity:0;transform:scaleX(.04)}44%,56%{opacity:.58;transform:scaleX(1)}}
        .branch-sway{animation:imgSway 5.5s ease-in-out infinite;transform-origin:${TRUNK_BASE_CX}px ${TRUNK_BASE_CY}px}
        .canopy-sway{animation:imgSway 6.2s 0.4s ease-in-out infinite;transform-origin:${TRUNK_BASE_CX}px ${TRUNK_BASE_CY}px}
        .cloud-l{animation:floatL 7.5s ease-in-out infinite}
        .cloud-r{animation:floatR 9s 1.8s ease-in-out infinite}
        .rain-drop{animation:rainFall linear infinite}
        .wind-line{animation:windGust ease-in-out infinite;transform-origin:left center}
      `}</style>

      {/* â”€â”€ CONTROLS  (Rule X toggle rain, market/heaven shortcuts) â”€â”€ */}
      <div className="absolute top-2 right-3 z-10 flex gap-2">
        <button onClick={()=>app.setHeavenTiming({rainEnabled:!rainOn})}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border shadow transition-all active:scale-95"
          style={{background:rainOn?"#555555":"white",color:rainOn?"white":"#475569",borderColor:rainOn?"#888888":"#e2e8f0"}}>
          {rainOn?"ðŸŒ§ Táº¯t mÆ°a":"â˜€ï¸ Báº­t mÆ°a"}
        </button>
        <button onClick={()=>openFull("market")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-white/20 text-slate-600 shadow hover:bg-white/80 active:scale-95">
          ðŸŒ Market {mkIdx}
        </button>
        <button onClick={()=>openFull("heaven")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-white/20 text-slate-600 shadow hover:bg-white/80 active:scale-95">
          ðŸŒ¦ Heaven {hvIdx}
        </button>
      </div>

      {/* â”€â”€ SVG CANVAS â”€â”€ */}
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
        className="w-full h-full" style={{display:"block"}}>

        <defs>
          {/* Rule VII: fruit gradient + glow */}
          <radialGradient id="fruitG" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stopColor="#ff9a3c"/>
            <stop offset="55%"  stopColor="#e85c00"/>
            <stop offset="100%" stopColor="#aa2800"/>
          </radialGradient>
          <filter id="fruitGlow" x="-55%" y="-55%" width="210%" height="210%">
            <feDropShadow dx="0" dy="0" stdDeviation={5*S} floodColor="#ff9a3c" floodOpacity=".75"/>
          </filter>
          {/* Rule XI: desaturation filter when health < 40% */}
          <filter id="healthFilter">
            <feColorMatrix type="saturate" values={lowHealth?"0.25":"1"}/>
            {lowHealth&&<feComponentTransfer>
              <feFuncR type="linear" slope="0.75"/>
              <feFuncG type="linear" slope="0.75"/>
              <feFuncB type="linear" slope="0.75"/>
            </feComponentTransfer>}
          </filter>
          {/* Sliced layer clip paths */}
          {envLayers.filter(l=>l.isSliced).map(l=>{
            const sid=l.id.replace(/[^a-zA-Z0-9_\-]/g,"");
            return(
              <clipPath key={sid} id={`clip-${sid}`}>
                <rect x={l.x} y={l.y} width={l.width} height={l.height}/>
              </clipPath>
            );
          })}
        </defs>

        {/* â”€â”€ 1. BACKGROUND (layer_15) â€” no interaction â”€â”€ */}
        {bgLayer&&<image href={imgSrc(bgLayer.source)} x="0" y="0" width={VW} height={VH} preserveAspectRatio="none"/>}

        {/* â”€â”€ 2. WIND LINES near mkt cloud (Rule VIII) â”€â”€ */}
        {WIND_LINES.map((wl,i)=>(
          <line key={i} className="wind-line"
            x1={wl.x} y1={wl.y} x2={wl.x+wl.w} y2={wl.y}
            stroke="rgba(120,185,226,.52)" strokeWidth={2.5*S} strokeLinecap="round"
            style={{animationDelay:wl.d,animationDuration:wl.dr}}/>
        ))}

        {/* â”€â”€ 3. ENV LAYERS with zone-hover filter (Rule XIV) â”€â”€ */}
        <g filter={lowHealth?"url(#healthFilter)":undefined}>
          {envLayers.map(l=>{
            const zone=envZone(l.source);
            const isSliced=l.isSliced===true;
            const sid=l.id.replace(/[^a-zA-Z0-9_\-]/g,"");
            // cloud animation class
            let extraClass="";
            if(l.source==="2.png") extraClass="cloud-l";
            if(l.source==="4.png") extraClass="cloud-r";
            if(l.source==="6.png") extraClass="canopy-sway";
            const filter=zone?zF(zone):"none";
            const isSlicedClip=isSliced?`clip-${sid}`:undefined;
            return(
              <g key={l.id} className={extraClass}>
                <LayerImg l={l} extraStyle={{filter,transition:"filter 0.25s"}} clipId={isSlicedClip}/>
              </g>
            );
          })}
        </g>

        {/* â”€â”€ 4. BRANCH LAYERS â€” level-gated by KPI (Rule V) â”€â”€ */}
        <g className="branch-sway" filter={lowHealth?"url(#healthFilter)":undefined}>
          {branchLayers.map(l=>{
            const cl=classifyLayer(l);
            const grp=cl.group??"";
            const lv=cl.level??0;
            // Determine max visible level for this group
            let maxLv=1;
            if(grp==="A") maxLv=pianoLvl;
            else if(grp==="B") maxLv=asstLvl;
            else maxLv=decoLvl; // C, D, E
            if(lv>maxLv) return null; // hidden (not yet grown)
            const zone=GROUP_ZONE[grp];
            const filter=zone?zF(zone):"none";
            return(
              <LayerImg key={l.id} l={l} extraStyle={{filter,transition:"filter 0.25s"}}/>
            );
          })}
        </g>

        {/* â”€â”€ 5. FLOWER / FRUIT milestones (Rule VII) â”€â”€ */}
        {pianoLvl>=4&&<FlowerTip cx={PIANO_FLOWER_CX} cy={PIANO_FLOWER_BASE_Y-30*S} prog={pianoP}/>}
        {pianoLvl<4&&pianoP>=80&&<FlowerTip cx={PIANO_FLOWER_CX} cy={PIANO_FLOWER_BASE_Y} prog={pianoP}/>}
        {asstLvl>=4&&<FlowerTip cx={ASST_FLOWER_CX} cy={ASST_FLOWER_BASE_Y-30*S} prog={asstP}/>}
        {asstLvl<4&&asstP>=80&&<FlowerTip cx={ASST_FLOWER_CX} cy={ASST_FLOWER_BASE_Y} prog={asstP}/>}

        {/* â”€â”€ 6. RAIN (Rule X) â€” near heaven zone (layer_4 area) â”€â”€ */}
        {rainOn&&RAIN_DROPS.map((rd,i)=>(
          <line key={i} className="rain-drop"
            x1={rd.x} y1={rd.y} x2={rd.x-2*S} y2={rd.y+13*S}
            stroke="rgba(90,140,220,.32)" strokeWidth={S} strokeLinecap="round"
            style={{animationDelay:`${rd.del}s`,animationDuration:`${rd.dur}s`}}/>
        ))}

        {/* â”€â”€ 7. TRANSPARENT INTERACTIVE ZONES (click targets) â”€â”€ */}
        {/* mkt: upper-left area over layer_2 */}
        <rect x={0} y={0} width={900} height={850} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("mkt")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("mkt",e)}/>
        {/* heaven: right area over layer_4 */}
        <rect x={3300} y={120} width={1100} height={600} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("heaven")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("heaven",e)}/>
        {/* tech: trunk column (layer_5) */}
        <rect x={1880} y={600} width={1350} height={2100} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("tech")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("tech",e)}/>
        {/* hr: lower-left layer_3 area */}
        <rect x={0} y={350} width={1200} height={600} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("hr")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("hr",e)}/>
        {/* partnerships: ground strips layer_11+12 */}
        <rect x={7} y={2430} width={5110} height={580} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("partnerships")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("partnerships",e)}/>
        {/* market: underground layer_13+14 */}
        <rect x={0} y={2940} width={5130} height={425} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("market")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("market",e)}/>
        {/* piano: Group A branch zone */}
        <rect x={2450} y={280} width={900} height={760} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("piano")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("piano",e)}/>
        {/* assistant: Group B branch zone */}
        <rect x={1650} y={0} width={930} height={750} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHovered("assistant")} onMouseLeave={()=>setHovered(null)}
          onClick={e=>openZone("assistant",e)}/>

        {/* â”€â”€ 8. CANOPY BADGES (Rule V â€” permanent label, expands on hover) â”€â”€ */}
        <CanopyBadge cx={PIANO_CX} cy={PIANO_CY} icon="ðŸŽ¹" title="Piano"
          prog={pianoP} color="#999999" teamId="piano"
          hovered={hovered==="piano"} done={pianoS.done} total={pianoS.total}
          onClick={e=>openZone("piano",e)} onEnter={()=>setHovered("piano")} onLeave={()=>setHovered(null)}/>
        <CanopyBadge cx={ASST_CX} cy={ASST_CY} icon="ðŸ“‹" title="HÃ nh ChÃ­nh"
          prog={asstP} color="#aaaaaa" teamId="assistant"
          hovered={hovered==="assistant"} done={asstS.done} total={asstS.total}
          onClick={e=>openZone("assistant",e)} onEnter={()=>setHovered("assistant")} onLeave={()=>setHovered(null)}/>
        <CanopyBadge cx={TECH_CX} cy={TECH_CY} icon="âš™ï¸" title="CÃ´ng Nghá»‡"
          prog={techP} color="#888888" teamId="tech"
          hovered={hovered==="tech"} done={techS.done} total={techS.total}
          onClick={e=>openZone("tech",e)} onEnter={()=>setHovered("tech")} onLeave={()=>setHovered(null)}/>

        {/* Rule XI: health score badge (top-center) */}
        <g style={{pointerEvents:"none"}}>
          <rect x={VW/2-160} y={20} width={320} height={54} rx={12}
            fill={lowHealth?"rgba(80,20,20,0.88)":"rgba(8,12,26,0.80)"}
            stroke={lowHealth?"#994444":"#444466"} strokeWidth={2}/>
          <text x={VW/2} y={44} textAnchor="middle" fill={lowHealth?"#ff8888":"#aaaaee"} fontSize={11.5} fontWeight="700">
            {"Health Score: "+hScore+"% "+( lowHealth?"[!] He sinh thai yeu":"He sinh thai on dinh")}
          </text>
          <text x={VW/2} y={62} textAnchor="middle" fill="#888899" fontSize={9}>
            {"Partnerships "+partP+"% · MKT "+mktP+"% · "+(partS.done+mktS.done)+" tasks hoan thanh"}
          </text>
        </g>

        {/* floating zone label strip on hover â€” Rule XIII */}
        {hovered&&(()=>{
          const meta=ZONE_META[hovered];
          return(
            <g style={{pointerEvents:"none"}}>
              <rect x={10} y={VH-120} width={1200} height={110} rx={20}
                fill="rgba(8,12,26,0.92)" stroke={meta.color} strokeWidth={3}
                style={{filter:`drop-shadow(0 2px ${12*S}px ${meta.color}55)`}}/>
              <text x={42} y={VH-80} fontSize={38} fontWeight="800" fill={meta.color}>{meta.icon} {meta.title}</text>
              <text x={42} y={VH-38} fontSize={28} fill="#94a3b8">{meta.subtitle}</text>
            </g>
          );
        })()}

      </svg>

      {/* â”€â”€ MINI POPUP â”€â”€ */}
      {popup&&(()=>{
        const tid=ZONE_META[popup.zone].teamId;
        const s=tid?gs(tid):{done:0,total:0,overdue:0};
        const p=tid?gp(tid):0;
        const extra=
          popup.zone==="heaven"?`Index: ${hvIdx}  ·  Mua: ${rainOn?"Dang bat":"Dang tat"}`:
          popup.zone==="market"?`Market Index: ${mkIdx}`:
          popup.zone==="partnerships"?`${app.partners.length} doi tac · ${app.partners.filter(pt=>pt.status==="active").length} active`:
          undefined;
        return(
          <MiniPopup popup={popup} onClose={()=>setPopup(null)} onDetail={()=>openFull(popup.zone)}
            prog={p} done={s.done} total={s.total} overdue={s.overdue} extra={extra}/>
        );
      })()}

      {/* â”€â”€ FULL PANEL â”€â”€ */}
      {fullPanel&&<FullPanel zone={fullPanel} onClose={()=>setFullPanel(null)}/>}
    </div>
  );
}

