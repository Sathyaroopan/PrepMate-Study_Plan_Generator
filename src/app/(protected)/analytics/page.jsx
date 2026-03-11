"use client";

import { useState, useEffect } from "react";
import {
  FiActivity, FiAlertCircle, FiCheckCircle, FiClock,
  FiLoader, FiTrendingUp, FiBookOpen, FiZap,
  FiInfo, FiAlertTriangle, FiTarget, FiBarChart2
} from "react-icons/fi";
import { Brain, Sparkles, Lightbulb, Heart } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="animate-spin text-4xl text-purple-500" />
          <p className="text-sm opacity-60 font-medium">Analyzing your study patterns...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center opacity-50">
          <FiAlertCircle className="mx-auto text-4xl mb-3" />
          <p className="font-medium">Could not load analytics</p>
        </div>
      </div>
    );
  }

  const {
    workload, procrastinationScore, burnoutRisk, burnoutScore,
    consistencyScore, weeklyActivity, priorityDistribution,
    courseWorkload, insights,
  } = data;

  // Color helpers
  const getProcrastinationColor = (score) => {
    if (score >= 70) return { text: "text-red-500", bg: "bg-red-500", ring: "ring-red-500/20", label: "High" };
    if (score >= 40) return { text: "text-amber-500", bg: "bg-amber-500", ring: "ring-amber-500/20", label: "Moderate" };
    return { text: "text-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20", label: "Low" };
  };

  const getBurnoutColor = (risk) => {
    if (risk === "High") return { text: "text-red-500", bg: "bg-red-500/15", border: "border-red-500/30" };
    if (risk === "Moderate") return { text: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/30" };
    return { text: "text-emerald-500", bg: "bg-emerald-500/15", border: "border-emerald-500/30" };
  };

  const getConsistencyColor = (score) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const insightIcon = (type) => {
    switch (type) {
      case "warning": return <FiAlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />;
      case "success": return <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />;
      case "tip": return <Lightbulb className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />;
      default: return <FiInfo className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />;
    }
  };

  const insightBg = (type) => {
    switch (type) {
      case "warning": return "border-amber-500/20 bg-amber-500/[0.03]";
      case "success": return "border-emerald-500/20 bg-emerald-500/[0.03]";
      case "tip": return "border-purple-500/20 bg-purple-500/[0.03]";
      default: return "border-blue-500/20 bg-blue-500/[0.03]";
    }
  };

  const procColor = getProcrastinationColor(procrastinationScore);
  const burnColor = getBurnoutColor(burnoutRisk);
  const consistColor = getConsistencyColor(consistencyScore);

  const maxSessions = Math.max(...weeklyActivity.map(d => d.sessions), 1);

  const priorityTotal = priorityDistribution.high + priorityDistribution.medium + priorityDistribution.low;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="space-y-1 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Study Analytics</h1>
            <Brain size={24} className="text-purple-500" />
          </div>
          <p className="text-sm opacity-60 font-medium">
            AI-powered insights into your study patterns, workload, and behavior
          </p>
        </header>

        {/* ===== SCORE CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completion Rate */}
          <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-full">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${workload.completionRate}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-500">{workload.completionRate}%</span>
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-50">Completion Rate</p>
              <p className="text-[10px] opacity-40 mt-1">{workload.completed}/{workload.total} tasks done</p>
            </div>
          </div>

          {/* Procrastination Score */}
          <div className={`bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group hover:border-${procColor.text.replace("text-", "")}/30 transition-all`}>
            <div className="relative z-10 w-full">
              <div className={`w-16 h-16 rounded-2xl ${procColor.bg}/15 flex items-center justify-center mx-auto mb-3 ring-4 ${procColor.ring}`}>
                <span className={`text-2xl font-bold ${procColor.text}`}>{procrastinationScore}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-50">Procrastination</p>
              <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${procColor.bg}/15 ${procColor.text}`}>
                {procColor.label}
              </span>
            </div>
          </div>

          {/* Burnout Risk */}
          <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group hover:border-red-500/20 transition-all">
            <div className="relative z-10 w-full">
              <div className={`w-16 h-16 rounded-2xl ${burnColor.bg} flex items-center justify-center mx-auto mb-3 border ${burnColor.border}`}>
                <Heart className={`${burnColor.text}`} size={28} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-50">Burnout Risk</p>
              <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${burnColor.bg} ${burnColor.text} border ${burnColor.border}`}>
                {burnoutRisk}
              </span>
            </div>
          </div>

          {/* Consistency Score */}
          <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="relative z-10 w-full">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] flex items-center justify-center mx-auto mb-3 border border-[var(--border)]">
                <span className={`text-2xl font-bold ${consistColor}`}>{consistencyScore}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-50">Consistency</p>
              <div className="w-full bg-[var(--bg)] rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${consistencyScore >= 70 ? "bg-emerald-500" : consistencyScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${consistencyScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== AI INSIGHTS PANEL ===== */}
        <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <button
            onClick={() => setInsightsExpanded(!insightsExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg)]/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-500" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-sm">AI Behavior Insights</h2>
                <p className="text-[10px] opacity-40 font-medium">{insights.length} pattern{insights.length !== 1 ? "s" : ""} detected</p>
              </div>
            </div>
            <div className={`p-1 rounded-lg transition-transform duration-300 opacity-40 ${insightsExpanded ? "rotate-180" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>

          <div className={`transition-all duration-300 ease-in-out ${insightsExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
            <div className="px-6 pb-5 space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${insightBg(insight.type)}`}
                >
                  {insightIcon(insight.type)}
                  <div>
                    <p className="text-sm font-bold">{insight.title}</p>
                    <p className="text-xs opacity-60 mt-0.5 leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== CHARTS ROW ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity Heatmap */}
          <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <FiBarChart2 className="text-blue-500" size={16} /> Weekly Activity
            </h3>
            <p className="text-[10px] opacity-40 mb-5">Study sessions per day of week</p>
            <div className="space-y-3">
              {weeklyActivity.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-8 opacity-50">{d.day}</span>
                  <div className="flex-1 bg-[var(--bg)] rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((d.sessions / maxSessions) * 100, d.sessions > 0 ? 12 : 0)}%` }}
                    >
                      {d.sessions > 0 && (
                        <span className="text-[10px] font-bold text-white">{d.sessions}</span>
                      )}
                    </div>
                  </div>
                  {d.sessions === 0 && <span className="text-[10px] opacity-30 font-medium">—</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <FiTarget className="text-amber-500" size={16} /> Priority Distribution
            </h3>
            <p className="text-[10px] opacity-40 mb-5">Task breakdown by priority level</p>

            {priorityTotal > 0 ? (
              <div className="space-y-5">
                {/* Stacked Bar */}
                <div className="h-8 rounded-full overflow-hidden flex bg-[var(--bg)]">
                  {priorityDistribution.high > 0 && (
                    <div
                      className="bg-red-500 h-full flex items-center justify-center transition-all duration-700"
                      style={{ width: `${(priorityDistribution.high / priorityTotal) * 100}%` }}
                    >
                      {(priorityDistribution.high / priorityTotal) * 100 >= 15 && (
                        <span className="text-[10px] font-bold text-white">{priorityDistribution.high}</span>
                      )}
                    </div>
                  )}
                  {priorityDistribution.medium > 0 && (
                    <div
                      className="bg-amber-500 h-full flex items-center justify-center transition-all duration-700"
                      style={{ width: `${(priorityDistribution.medium / priorityTotal) * 100}%` }}
                    >
                      {(priorityDistribution.medium / priorityTotal) * 100 >= 15 && (
                        <span className="text-[10px] font-bold text-white">{priorityDistribution.medium}</span>
                      )}
                    </div>
                  )}
                  {priorityDistribution.low > 0 && (
                    <div
                      className="bg-emerald-500 h-full flex items-center justify-center transition-all duration-700"
                      style={{ width: `${(priorityDistribution.low / priorityTotal) * 100}%` }}
                    >
                      {(priorityDistribution.low / priorityTotal) * 100 >= 15 && (
                        <span className="text-[10px] font-bold text-white">{priorityDistribution.low}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6">
                  {[
                    { label: "High", count: priorityDistribution.high, color: "bg-red-500" },
                    { label: "Medium", count: priorityDistribution.medium, color: "bg-amber-500" },
                    { label: "Low", count: priorityDistribution.low, color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium opacity-60">{item.label}</span>
                      <span className="text-xs font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 opacity-30">
                <p className="text-sm">No tasks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== COURSE WORKLOAD ===== */}
        {courseWorkload.length > 0 && (
          <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <FiBookOpen className="text-indigo-500" size={16} /> Course Workload
            </h3>
            <p className="text-[10px] opacity-40 mb-5">Estimated study hours per course</p>
            <div className="space-y-3">
              {courseWorkload.map((course) => {
                const maxHours = courseWorkload[0].hours || 1;
                return (
                  <div key={course.name} className="flex items-center gap-4">
                    <span className="text-xs font-bold w-28 truncate opacity-70">{course.name}</span>
                    <div className="flex-1 bg-[var(--bg)] rounded-full h-6 relative overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 flex items-center justify-end pr-2.5"
                        style={{ width: `${Math.max((course.hours / maxHours) * 100, 12)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{course.hours}h</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium opacity-40 w-14 text-right">{course.tasks} task{course.tasks !== 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== WORKLOAD SUMMARY STATS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Tasks", value: workload.total, icon: <FiBookOpen size={16} />, color: "text-blue-500", bgColor: "bg-blue-500/10" },
            { label: "Completed", value: workload.completed, icon: <FiCheckCircle size={16} />, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
            { label: "Overdue", value: workload.overdue, icon: <FiAlertCircle size={16} />, color: "text-red-500", bgColor: "bg-red-500/10" },
            { label: "Avg Hours/Task", value: workload.avgHoursPerTask, icon: <FiClock size={16} />, color: "text-purple-500", bgColor: "bg-purple-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-4 group hover:border-[var(--text)]/20 transition-all">
              <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
