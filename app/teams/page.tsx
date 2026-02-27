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
      <div className="flex flex-col items-center gap-3 text-white/40">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"/>
        <span className="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  if (view === "tree") {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
        {/* slim header bar */}
        <div className="flex items-center justify-between px-5 py-2 shrink-0 backdrop-blur"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(17,17,17,0.90)" }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🌳</span>
            <span className="font-semibold text-sm" style={{ color: "#cccccc" }}>Thiên–Địa–Nhân Ecosystem Tree</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(42,42,42,0.8)" }}>
            <button className="px-3 py-1 rounded-lg text-xs font-medium shadow-sm" style={{ background: "#3a3a3a", color: "#fff" }}>🌳 Tree</button>
            <button onClick={() => setView("cards")} className="px-3 py-1 rounded-lg text-xs font-medium transition" style={{ color: "#aaaaaa" }}>☰ Cards</button>
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
            style={{ color: "#ffffff" }}>Phòng ban</h1>
          <p className="text-sm" style={{ color: "#aaaaaa" }}>Danh sách tất cả các phòng ban.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(42,42,42,0.8)" }}>
          <button onClick={() => setView("tree")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition" style={{ color: "#aaaaaa" }}>
            🌳 Growth Tree
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm" style={{ background: "#3a3a3a", color: "#fff" }}>
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

