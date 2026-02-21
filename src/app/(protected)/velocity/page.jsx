"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FiCheck, FiChevronRight, FiChevronLeft, FiClock, FiCalendar,
  FiSun, FiGrid, FiZap, FiList, FiAlertCircle, FiBookOpen,
  FiTarget, FiLoader, FiCheckCircle, FiArrowRight
} from "react-icons/fi";
import { Sparkles } from "lucide-react";

const STEPS = [
  { id: 1, title: "Select Tasks", icon: FiList },
  { id: 2, title: "Choose Dates", icon: FiCalendar },
  { id: 3, title: "Preferences", icon: FiSun },
  { id: 4, title: "Generate", icon: FiZap },
];

export default function VelocityPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [error, setError] = useState("");

  // Form state
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [morningStudy, setMorningStudy] = useState(false);
  const [morningEndTime, setMorningEndTime] = useState("09:00");
  const [useFreeSlots, setUseFreeSlots] = useState(true);

  // Fetch pending tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Format date as YYYY-MM-DD in local timezone (avoids UTC offset bugs)
  const toLocalDateStr = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Compute date constraints from selected tasks
  const dateConstraints = useMemo(() => {
    const selected = tasks.filter((t) => selectedTaskIds.includes(t._id));
    if (selected.length === 0) return { minStart: "", maxStart: "", minEnd: "", maxEnd: "" };

    const todayStr = toLocalDateStr(new Date());

    const deadlines = selected.map((t) => new Date(t.deadline)).sort((a, b) => a - b);
    const earliestDeadline = deadlines[0];
    const latestDeadline = deadlines[deadlines.length - 1];

    const earliestDeadlineStr = toLocalDateStr(earliestDeadline);
    const latestDeadlineStr = toLocalDateStr(latestDeadline);

    return {
      minStart: todayStr,
      maxStart: earliestDeadlineStr,
      minEnd: todayStr,
      maxEnd: latestDeadlineStr,
    };
  }, [selectedTaskIds, tasks]);

  // Auto-set dates when tasks are selected
  useEffect(() => {
    if (dateConstraints.minStart && !startDate) {
      setStartDate(dateConstraints.minStart);
    }
    if (dateConstraints.maxEnd && !endDate) {
      setEndDate(dateConstraints.maxEnd);
    }
  }, [dateConstraints]);

  // Handlers
  const toggleTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAll = () => setSelectedTaskIds(tasks.map((t) => t._id));
  const deselectAll = () => setSelectedTaskIds([]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedTaskIds.length > 0;
      case 2: return startDate && endDate && new Date(endDate) >= new Date(startDate);
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/studyplans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: selectedTaskIds,
          startDate,
          endDate,
          morningStudy,
          morningEndTime,
          useFreeSlots,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPlan(data);
      } else {
        setError(data.message || "Failed to generate study plan");
      }
    } catch (err) {
      setError("An error occurred while generating the plan");
    } finally {
      setGenerating(false);
    }
  };

  // Group sessions by date for plan preview
  const groupedSessions = useMemo(() => {
    if (!generatedPlan?.sessions) return {};
    const groups = {};
    generatedPlan.sessions.forEach((s) => {
      const dateStr = new Date(s.startTime).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(s);
    });
    return groups;
  }, [generatedPlan]);

  const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t._id));

  const priorityColor = (p) => {
    if (p === "high") return "bg-red-500/15 text-red-500 border-red-500/30";
    if (p === "low") return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="animate-spin text-4xl text-blue-500" />
          <p className="text-sm opacity-60 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // ====== PLAN GENERATED - SHOW PREVIEW ======
  if (generatedPlan) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-4 py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mb-2">
              <FiCheckCircle className="text-emerald-500 text-4xl" />
            </div>
            <h1 className="text-3xl font-bold">Study Plan Created!</h1>
            <p className="text-sm opacity-60 max-w-md mx-auto">
              Your personalized study plan with {generatedPlan.totalSessions} sessions
              totaling {generatedPlan.totalHours} hours is ready.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sessions", value: generatedPlan.totalSessions, icon: FiTarget, color: "text-blue-500" },
              { label: "Hours", value: generatedPlan.totalHours, icon: FiClock, color: "text-purple-500" },
              { label: "Tasks", value: generatedPlan.taskIds?.length || 0, icon: FiBookOpen, color: "text-amber-500" },
              {
                label: "Days",
                value: Object.keys(groupedSessions).length,
                icon: FiCalendar,
                color: "text-emerald-500",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-4 text-center"
              >
                <stat.icon className={`mx-auto text-xl mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs opacity-50 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FiCalendar className="text-blue-500" /> Daily Breakdown
            </h2>
            {Object.entries(groupedSessions).map(([dateStr, sessions]) => (
              <div
                key={dateStr}
                className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-[var(--border)] flex justify-between items-center">
                  <span className="font-bold text-sm">{dateStr}</span>
                  <span className="text-xs opacity-50 font-medium">
                    {sessions.length} session{sessions.length > 1 ? "s" : ""} ·{" "}
                    {Math.round(sessions.reduce((s, x) => s + x.duration, 0) / 60 * 10) / 10}h
                  </span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {sessions.map((session, idx) => (
                    <div key={idx} className="px-5 py-3 flex items-center gap-4">
                      <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg)] text-xs font-mono font-bold opacity-70 whitespace-nowrap">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                        {" — "}
                        {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </div>
                      <span className="font-medium text-sm flex-1 truncate">{session.title}</span>
                      <span className="text-xs opacity-40 font-medium">{session.duration}min</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(groupedSessions).length === 0 && (
              <div className="text-center py-12 opacity-40">
                <FiAlertCircle className="mx-auto text-4xl mb-3" />
                <p className="text-sm">No sessions were generated. Try adjusting your dates or preferences.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/study-plans"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              <FiList size={16} /> View All Study Plans
            </Link>
            <button
              onClick={() => {
                setGeneratedPlan(null);
                setCurrentStep(1);
                setSelectedTaskIds([]);
                setStartDate("");
                setEndDate("");
              }}
              className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold text-sm hover:bg-[var(--s-btn)] transition-all"
            >
              Create Another Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== WIZARD ======
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="space-y-1 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Velocity</h1>
            <Sparkles size={22} className="text-amber-500" />
          </div>
          <p className="text-sm opacity-60 font-medium">
            Create a personalized study plan powered by your tasks and schedule
          </p>
        </header>

        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          : "bg-[var(--s-btn)] border border-[var(--border)] opacity-40"
                    }`}
                  >
                    {isCompleted ? <FiCheck size={18} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      isActive ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full mb-5 transition-all duration-300 ${
                      isCompleted ? "bg-emerald-500" : "bg-[var(--border)]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* ====== STEP 1: SELECT TASKS ====== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Which tasks to include?</h2>
                  <p className="text-sm opacity-50 mt-1">
                    Select the tasks you want to schedule in your study plan
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--s-btn)] hover:bg-[var(--s-btn)] opacity-60 hover:opacity-100 transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <FiBookOpen className="mx-auto text-5xl mb-4" />
                  <p className="font-bold text-lg">No pending tasks</p>
                  <p className="text-sm mt-1">Add tasks from the Tasks page first</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {tasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task._id);
                    const isOverdue = new Date(task.deadline) < new Date();
                    return (
                      <button
                        key={task._id}
                        onClick={() => toggleTask(task._id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/5 shadow-sm"
                            : "border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--s-btn)]/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-[var(--border)]"
                            }`}
                          >
                            {isSelected && <FiCheck className="text-white" size={12} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                                {task.courseId?.name || "General"}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${priorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                              {isOverdue && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-sm truncate">{task.title}</h3>
                            <div className="flex items-center gap-4 mt-1.5 text-xs opacity-50 font-medium">
                              <span className="flex items-center gap-1">
                                <FiClock size={11} /> {task.estimatedHours}h
                              </span>
                              <span className="flex items-center gap-1">
                                <FiCalendar size={11} />
                                {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTaskIds.length > 0 && (
                <div className="text-center">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500">
                    {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected ·{" "}
                    {selectedTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)}h total
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ====== STEP 2: CHOOSE DATES ====== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold">When should the plan run?</h2>
                <p className="text-sm opacity-50 mt-1">
                  Set the start and end dates for your study plan
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                    <FiCalendar size={12} className="text-emerald-500" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={dateConstraints.minStart}
                    max={dateConstraints.maxStart}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && new Date(e.target.value) > new Date(endDate)) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <p className="text-[11px] opacity-40">
                    Available: today to earliest deadline ({dateConstraints.maxStart})
                  </p>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                    <FiCalendar size={12} className="text-red-500" /> End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || dateConstraints.minEnd}
                    max={dateConstraints.maxEnd}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <p className="text-[11px] opacity-40">
                    Available: start date to latest deadline ({dateConstraints.maxEnd})
                  </p>
                </div>
              </div>

              {/* Date Range Preview */}
              {startDate && endDate && (
                <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">From</p>
                      <p className="font-bold">
                        {new Date(startDate + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <FiArrowRight className="text-blue-500 mx-4" size={20} />
                    <div className="text-center flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">To</p>
                      <p className="font-bold">
                        {new Date(endDate + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-center flex-1 border-l border-[var(--border)] ml-4 pl-4">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Duration</p>
                      <p className="font-bold text-blue-500">
                        {Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (86400000)) + 1)} days
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====== STEP 3: PREFERENCES ====== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold">Study Preferences</h2>
                <p className="text-sm opacity-50 mt-1">
                  Customize how sessions are scheduled
                </p>
              </div>

              {/* Morning Study Toggle */}
              <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <FiSun className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Morning Study</h3>
                      <p className="text-xs opacity-50">Schedule study sessions in the morning</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMorningStudy(!morningStudy)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                      morningStudy ? "bg-amber-500" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all duration-300 ${
                        morningStudy ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Time Picker (visible only when morning study is on) */}
                {morningStudy && (
                  <div className="pl-13 flex items-center gap-3 ml-13">
                    <label className="text-xs font-bold opacity-60 whitespace-nowrap">
                      Study until:
                    </label>
                    <input
                      type="time"
                      value={morningEndTime}
                      onChange={(e) => setMorningEndTime(e.target.value)}
                      className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <span className="text-xs opacity-40">before classes begin</span>
                  </div>
                )}
              </div>

              {/* Free Slots Toggle */}
              <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FiGrid className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Use Free Timetable Slots</h3>
                      <p className="text-xs opacity-50">
                        Schedule study sessions during free periods in your timetable
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseFreeSlots(!useFreeSlots)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                      useFreeSlots ? "bg-blue-500" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all duration-300 ${
                        useFreeSlots ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {!morningStudy && !useFreeSlots && (
                <div className="flex items-center gap-2 text-amber-500 text-xs font-bold bg-amber-500/10 rounded-xl px-4 py-3">
                  <FiAlertCircle size={14} />
                  Sessions will only be scheduled in the evening (after 5 PM)
                </div>
              )}
            </div>
          )}

          {/* ====== STEP 4: REVIEW & GENERATE ====== */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold">Review & Generate</h2>
                <p className="text-sm opacity-50 mt-1">
                  Confirm your selections and generate your study plan
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[var(--s-btn)] border border-[var(--border)] rounded-2xl overflow-hidden">
                {/* Tasks */}
                <div className="p-5 border-b border-[var(--border)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3">
                    Selected Tasks ({selectedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTasks.map((task) => (
                      <div key={task._id} className="flex items-center gap-3">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === "high" ? "bg-red-500" : task.priority === "low" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="text-sm font-medium flex-1 truncate">{task.title}</span>
                        <span className="text-xs opacity-40">{task.estimatedHours}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="p-5 border-b border-[var(--border)] flex items-center gap-4">
                  <FiCalendar className="text-blue-500" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-50">Date Range</p>
                    <p className="text-sm font-medium mt-0.5">
                      {new Date(startDate + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" → "}
                      {new Date(endDate + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" "}
                      <span className="opacity-40">
                        ({Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1)} days)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FiSun className={morningStudy ? "text-amber-500" : "opacity-30"} />
                    <div>
                      <p className="text-xs font-bold">Morning Study</p>
                      <p className="text-xs opacity-50">
                        {morningStudy ? `Until ${morningEndTime}` : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiGrid className={useFreeSlots ? "text-blue-500" : "opacity-30"} />
                    <div>
                      <p className="text-xs font-bold">Free Slots</p>
                      <p className="text-xs opacity-50">
                        {useFreeSlots ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-500/10 rounded-xl px-4 py-3">
                  <FiAlertCircle size={14} />
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {generating ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    Generating your study plan...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Study Plan
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {!generating && (
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[var(--s-btn)] transition-all disabled:opacity-30"
            >
              <FiChevronLeft size={16} /> Back
            </button>

            {currentStep < 4 && (
              <button
                onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-30"
              >
                Continue <FiChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
