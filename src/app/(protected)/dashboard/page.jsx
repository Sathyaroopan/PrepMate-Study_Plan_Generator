"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Clock, CheckCircle, BookOpen, AlertTriangle, Rocket, Zap, Target } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    highPriority: 0,
    studyHours: 0,
    nextDeadline: null,
    completedToday: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Profile for Name
        const profileRes = await fetch("/api/auth/profile", { credentials: "include" });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUser(profile);
        }

        // Fetch Tasks for Stats (Fetch all to calculate completed weekly goals)
        const tasksRes = await fetch("/api/tasks?status=all", { credentials: "include" });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData); // Note: This now includes completed tasks, need to filter for display if needed
          calculateStats(tasksData);
        }
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = (taskList) => {
    // Current Pending Stats
    const pendingList = taskList.filter((t) => t.status === "pending");
    const highPriority = pendingList.filter((t) => t.priority === "high");
    const totalHours = pendingList.reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);

    // Weekly Goal: Completed High Priority tasks this week
    const now = new Date();
    // Get start of current week (Monday)
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const completedHighWeekly = taskList.filter(t => {
      if (t.status !== "completed" || t.priority !== "high") return false;
      const completedDate = new Date(t.updatedAt);
      return completedDate >= startOfWeek;
    });

    // Completed Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedTodayCount = taskList.filter(t => {
      if (t.status !== "completed") return false;
      const completedDate = new Date(t.updatedAt);
      return completedDate >= todayStart;
    }).length;

    // Find nearest deadline from strictly pending tasks
    const sortedByDate = [...pendingList].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const nextTask = sortedByDate.length > 0 ? sortedByDate[0] : null;

    setStats({
      pending: pendingList.length,
      highPriority: highPriority.length,
      studyHours: totalHours,
      nextDeadline: nextTask,
      completed: completedHighWeekly.length, // Weekly Goal Count
      completedToday: completedTodayCount,
    });
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--p-btn)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[var(--border)] pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {greeting}, <span className="text-blue-600 dark:text-blue-400">{user?.name || "Student"}</span>!
          </h1>
          <p className="text-sm opacity-60 max-w-lg leading-relaxed">
            &quot;Success is the sum of small efforts, repeated day in and day out.&quot;
            You have <strong className="text-[var(--text)]">{stats.pending} tasks</strong> on your plate.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Today is</p>
          <p className="text-xl font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-500" />}
          label="Pending Tasks"
          value={stats.pending}
          subtext="Assignments waiting"
          color="bg-blue-500/10"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-amber-500" />}
          label="High Priority"
          value={stats.highPriority}
          subtext="Needs attention"
          color="bg-amber-500/10"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-purple-500" />}
          label="Study Debt"
          value={`${stats.studyHours}h`}
          subtext="Estimated effort"
          color="bg-purple-500/10"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
          label="Completed"
          value={stats.completedToday}
          subtext="Tasks done today"
          color="bg-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Up Next */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Rocket className="w-5 h-5 text-blue-500" /> Up Next</h2>
            <Link href="/tasks" className="text-xs font-bold opacity-50 hover:opacity-100 hover:underline">
              View All Tasks →
            </Link>
          </div>

          {stats.nextDeadline ? (
            <div className="flex-1 p-6 rounded-3xl bg-[var(--bg)] border-2 border-dashed border-[var(--border)] hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="w-24 h-24 text-[var(--text)]" />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-center">
                <div className="flex gap-2 mb-4">
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    Due Soon
                  </span>
                  <span className="bg-[var(--s-btn)] text-[var(--text)] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {stats.nextDeadline.courseId?.name || "General"}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-500 transition-colors">
                  {stats.nextDeadline.title}
                </h3>

                <div className="flex gap-6 text-sm opacity-60">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Due on {new Date(stats.nextDeadline.deadline).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    {stats.nextDeadline.estimatedHours} Hours est.
                  </span>
                </div>

                <div className="mt-6">
                  <Link href="/tasks">
                    <button className="px-6 py-2.5 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                      Start Working
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[180px] p-6 rounded-3xl bg-[var(--s-btn)]/30 border border-[var(--border)] text-center flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>

                <h3 className="font-bold text-lg mb-1">You&apos;re all caught up!</h3>
                <p className="text-sm opacity-60 mb-6 max-w-[250px] leading-relaxed">
                  No urgent deadlines on the horizon.
                </p>

                <Link href="/tasks">
                  <button className="px-5 py-2.5 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Create New Task
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Weekly Goal */}
        <div className="flex flex-col">
          {/* Invisible header to align with Left Col header */}
          <div className="h-7 mb-6" aria-hidden="true" />

          <div className="flex-1 p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-center">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Target className="w-5 h-5" /> Weekly Goal</h3>
            <p className="text-sm opacity-90 mb-6 flex-1">
              Complete 5 high-priority tasks this week to stay ahead of simpler subjects.
            </p>
            <div className="w-full bg-black/20 rounded-full h-2 mb-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats.completed / 5) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs font-bold opacity-80 text-right">{stats.completed}/5 Completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section (Moved to new row) */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "New Task", href: "/tasks", color: "bg-blue-500" },
            { label: "Timetable", href: "/timetable", color: "bg-emerald-500" },
            { label: "Profile", href: "/profile", color: "bg-purple-500" },
            { label: "Settings", href: "/settings", color: "bg-gray-500" },
          ].map((action, i) => (
            <Link key={i} href={action.href}>
              <div className="h-24 rounded-2xl bg-[var(--s-btn)] border border-[var(--border)] hover:border-[var(--text)] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer hover:shadow-lg">
                <div className={`w-8 h-8 rounded-full ${action.color} opacity-20 group-hover:opacity-100 transition-all`} />
                <span className="text-xs font-bold">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--text)] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        {/* Trend Indicator could go here */}
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <p className="text-xs font-bold uppercase tracking-wider opacity-40">{label}</p>
        <p className="text-[10px] opacity-40 pt-1">{subtext}</p>
      </div>
    </div>
  );
}
