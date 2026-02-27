"use client";
import Link from "next/link";
import { Team } from "@/lib/types";
import { useApp } from "@/lib/AppContext";
import ProgressBar from "./ProgressBar";

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  const { getTeamProgress, getTeamStats } = useApp();
  const progress = getTeamProgress(team.id);
  const stats = getTeamStats(team.id);

  return (
    <Link href={`/teams/${team.id}`}>
      <div className="rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
        style={{
          background: "rgba(26,26,26,0.95)",
          backdropFilter: "blur(16px)",
          border: `1px solid rgba(255,255,255,0.10)`,
          boxShadow: `0 4px 24px -4px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04)`,
          borderRadius: "16px",
        }}>
        {/* Accent top bar */}
        <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${team.color}cc, transparent)` }} />
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${team.color}cc, ${team.color})`, boxShadow: `0 4px 10px -2px ${team.color}55` }}
            >
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-white/80 text-sm group-hover:text-white transition-colors tracking-tight">
                {team.name}
              </h3>
              <p className="text-xs text-white/40 mt-0.5">{stats.total} công việc</p>
            </div>
          </div>
          <span
            className="text-3xl font-black tracking-tight tabular-nums"
            style={{ color: team.color }}
          >
            {progress}%
          </span>
        </div>

        {/* Big progress bar */}
        <div className="mb-4">
          <ProgressBar value={progress} color={team.color} size="lg" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "#cccccc" }}>
            <span className="w-2 h-2 rounded-full bg-white/50 inline-block" />
            <span>
              <span className="font-semibold" style={{ color: "#ffffff" }}>{stats.done}</span>
              <span style={{ color: "#aaaaaa" }}>/{stats.total} hoàn thành</span>
            </span>
          </div>
          {stats.overdue > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />
              <span className="font-semibold text-white/40">{stats.overdue} quá hạn</span>
            </div>
          )}
          {stats.overdue === 0 && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#777777" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span>Không quá hạn</span>
            </div>
          )}
          <div className="ml-auto">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 transition-colors"
              style={{ color: "rgba(255,255,255,0.20)" }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
