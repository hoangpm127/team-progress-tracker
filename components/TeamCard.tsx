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
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: `0 2px 16px -4px ${team.color}22, 0 1px 4px rgba(0,0,0,0.04)`,
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
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors tracking-tight">
                {team.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{stats.total} công việc</p>
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
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>
              <span className="font-semibold text-slate-700">{stats.done}</span>/{stats.total} hoàn thành
            </span>
          </div>
          {stats.overdue > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              <span className="font-semibold text-red-500">{stats.overdue} quá hạn</span>
            </div>
          )}
          {stats.overdue === 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />
              <span>Không quá hạn</span>
            </div>
          )}
          <div className="ml-auto">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
