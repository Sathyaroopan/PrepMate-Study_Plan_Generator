"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, AlertTriangle, TrendingUp, Calendar, Zap, CheckCircle, BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch("/api/analytics");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--p-btn)] border-t-transparent" />
                    <p className="opacity-60 font-medium">Analyzing your study patterns...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center opacity-60">No data available yet. Start studying!</div>;

    const { postponements, postponementTrend, peakHour, burnoutRisk, reflection, dailyLoad } = data;

    // Helper for Peak Hour
    const formatHour = (h) => {
        if (h === null) return "N/A";
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12} ${ampm}`;
    };

    return (
        <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">

            {/* Header */}
            <header className="border-b border-[var(--border)] pb-6">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Behavior Analytics</h1>
                <p className="opacity-60 font-medium max-w-2xl">
                    Self-awareness is the first step to checking procrastination.
                    Here's a reflection on your habits, strictly based on your own past performance.
                </p>
            </header>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Procrastination Meter */}
                <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-orange-500">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Clock size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">Postponements</h3>
                        </div>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-black">{postponements}</span>
                            <span className="text-sm opacity-60 mb-2 font-medium">delays this week</span>
                        </div>

                        <p className="text-xs opacity-60 leading-relaxed">
                            {postponements === 0
                                ? "Incredible discipline! You stuck to your deadlines."
                                : postponements < 3
                                    ? "Occasional delays are normal. Keep it up!"
                                    : "You're pushing tasks back frequently. Try smaller steps."}
                        </p>
                    </div>
                </div>

                {/* 2. Most Productive Hour */}
                <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-emerald-500">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <Zap size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">Peak Focus</h3>
                        </div>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-black">{formatHour(peakHour)}</span>
                            <span className="text-sm opacity-60 mb-2 font-medium">is your golden hour</span>
                        </div>

                        <p className="text-xs opacity-60 leading-relaxed">
                            Based on your completed sessions, this is when you are most likely to finish tasks. Schedule hard work here!
                        </p>
                    </div>
                </div>

                {/* 3. Burnout Risk */}
                <div className={`p-6 rounded-3xl border relative overflow-hidden group transition-colors duration-300 ${burnoutRisk === 'High' ? 'bg-red-500/10 border-red-500/20' :
                    burnoutRisk === 'Medium' ? 'bg-amber-500/5 border-amber-500/20' :
                        'bg-[var(--bg)] border-[var(--border)]'
                    }`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertTriangle className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <div className={`flex items-center gap-3 mb-4 ${burnoutRisk === 'High' ? 'text-red-500' : 'text-blue-500'
                            }`}>
                            <div className={`p-2 rounded-lg ${burnoutRisk === 'High' ? 'bg-red-500/10' : 'bg-blue-500/10'
                                }`}>
                                <Activity size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">Burnout Risk</h3>
                        </div>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-black">{burnoutRisk}</span>
                            <span className="text-sm opacity-60 mb-2 font-medium">level detected</span>
                        </div>

                        <p className="text-xs opacity-60 leading-relaxed">
                            {burnoutRisk === 'High'
                                ? "You've been studying over 6 hours daily on average. Please take a break to recharge!"
                                : "Your workload is sustainable. Great job balancing effort and rest."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Weekly Reflection Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Visual Charts Area (Daily Load) */}
                <div className="lg:col-span-2 p-8 rounded-3xl bg-[var(--s-btn)]/30 border border-[var(--border)]">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <BarChart2 className="text-purple-500" />
                        Daily Focus Last 7 Days (Minutes)
                    </h3>

                    <div className="h-48 flex items-end gap-2 md:gap-4 justify-between">
                        {Object.entries(dailyLoad || {})
                            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                            .slice(-7)
                            .map(([date, minutes], i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex-1 flex items-end">
                                        <div
                                            className="w-full bg-blue-500/80 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-400"
                                            style={{ height: `${Math.min((minutes / 300) * 100, 100)}%` }} // 300 min max scale
                                        ></div>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-wider transform -rotate-45 md:rotate-0 origin-center truncate w-full text-center">
                                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Reflection Card */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/20 flex flex-col">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <CheckCircle className="text-indigo-200" />
                        Weekly Reflection
                    </h3>

                    <div className="space-y-6 flex-1">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Total Focus</p>
                            <p className="text-3xl font-bold">{reflection.totalHours} Hours</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Sessions Completed</p>
                            <p className="text-3xl font-bold">{reflection.sessionsCompleted}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm mt-4">
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                "{reflection.message}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Postponement Trend Section */}
            {Object.keys(postponementTrend || {}).length > 0 && (
                <div className="p-8 rounded-3xl bg-[var(--bg)] border border-[var(--border)]">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <TrendingUp className="text-orange-500" />
                        Avoidance Patterns
                    </h3>
                    <p className="text-sm opacity-60 mb-4">Dates where you postponed tasks (last 30 days).</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(postponementTrend || {}).map(([date, count], i) => (
                            <div key={i} className="px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold">
                                {new Date(date).toLocaleDateString()} — {count} Delays
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
