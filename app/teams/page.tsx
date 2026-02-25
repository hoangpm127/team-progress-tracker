"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import TeamCard from "@/components/TeamCard";
import TreeCanvas from "@/components/TreeCanvas";

export default function TeamsPage() {
  const { teams, loading } = useApp();
  const [view, setView] = useState<"tree" | "cards">("tree");

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"/>
        <span className="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  if (view === "tree") {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
        {/* slim header bar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-slate-100 bg-white/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🌳</span>
            <span className="font-semibold text-slate-700 text-sm">Thiên–Địa–Nhân Ecosystem Tree</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button className="px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 shadow-sm">🌳 Tree</button>
            <button onClick={() => setView("cards")} className="px-3 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700">☰ Cards</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <TreeCanvas />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #6d28d9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Phòng ban</h1>
          <p className="text-slate-500 text-sm">Danh sách tất cả các phòng ban.</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button onClick={() => setView("tree")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700">
            🌳 Growth Tree
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-800 shadow-sm">
            ☰ Cards
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}

