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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 uppercase tracking-tight text-center" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.12em" }}>Phòng ban</h1>
          <p className="text-slate-500 text-sm">
            {view === "tree"
              ? "Trực quan hoá hệ sinh thái phòng ban — nhấn vào cành để xem chi tiết."
              : "Danh sách tất cả các phòng ban. Nhấn vào để xem chi tiết."}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setView("tree")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "tree"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🌳 Growth Tree
          </button>
          <button
            onClick={() => setView("cards")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "cards"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ☰ Cards
          </button>
        </div>
      </div>

      {view === "tree" ? (
        <TreeCanvas />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

