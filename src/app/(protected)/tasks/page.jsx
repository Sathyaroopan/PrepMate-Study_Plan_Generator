"use client";

import { useEffect, useState, useMemo } from "react";
import DateTimePicker from "@/components/DateTimePicker";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Edit State
  const [editingTask, setEditingTask] = useState(null); // null = creating, object = editing

  // Form State
  const [courseName, setCourseName] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [priority, setPriority] = useState("medium");

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/auth/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAvailableCourses(data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
    fetchTasks();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setCourseName("");
    setTitle("");
    setDeadline("");
    setEstimatedHours("");
    setPriority("medium");
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setCourseName(task.courseId?.name || ""); // Handle populated course
    setTitle(task.title);
    setDeadline(task.deadline); // Custom picker works with ISO string
    setEstimatedHours(task.estimatedHours);
    setPriority(task.priority);
    setShowModal(true);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!courseName || !title || !deadline || !estimatedHours) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const url = editingTask ? `/api/tasks/${editingTask._id}` : "/api/tasks";
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          title,
          deadline,
          estimatedHours: Number(estimatedHours),
          priority,
        }),
      });

      if (!res.ok) throw new Error(editingTask ? "Failed to update task" : "Failed to create task");

      // Reset & Refresh
      setShowModal(false);
      setEditingTask(null);
      setCourseName("");
      setTitle("");
      setDeadline("");
      setEstimatedHours("");
      setPriority("medium");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  // Memoized Task Categorization
  const { overdueTasks, upcomingTasks } = useMemo(() => {
    const now = new Date();
    return tasks.reduce(
      (acc, task) => {
        const isOverdue = new Date(task.deadline) < now && task.status !== "completed";
        if (isOverdue) {
          acc.overdueTasks.push(task);
        } else {
          acc.upcomingTasks.push(task);
        }
        return acc;
      },
      { overdueTasks: [], upcomingTasks: [] }
    );
  }, [tasks]);

  // Helper to calculate total workload
  const totalHours = tasks.reduce((acc, task) => acc + (task.estimatedHours || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--p-btn)] border-t-transparent animate-spin" />
          <p className="text-sm opacity-50 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 font-display">My Tasks</h1>
            <div className="flex gap-4 text-sm opacity-60">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                {tasks.length} Assignments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                {totalHours} Total Hours
              </span>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="h-fit px-8 py-3.5 rounded-2xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold hover:bg-[var(--p-btn-hov)] transition-all active:scale-95 shadow-xl shadow-blue-500/10 border border-white/10"
          >
            + Add New Task
          </button>
        </header>

        {/* Task Sections */}
        {tasks.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--border)] rounded-[2rem] py-24 text-center bg-white/[0.02]">
            <p className="text-5xl mb-6">🎉</p>
            <h3 className="text-xl font-bold opacity-80">All caught up!</h3>
            <p className="text-sm opacity-50 mt-2 max-w-xs mx-auto">
              You've cleared your schedule. Enjoy your free time or add a new goal above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Overdue Section */}
            {overdueTasks.length > 0 && (
              <CollapsibleSection
                title="Overdue Tasks"
                count={overdueTasks.length}
                variant="danger"
                defaultOpen={true}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={() => openEditModal(task)}
                      onComplete={() => handleCompleteTask(task._id)}
                      onDelete={() => handleDeleteTask(task._id)}
                      isOverdue={true}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Upcoming Section */}
            <CollapsibleSection
              title="To Be Completed"
              count={upcomingTasks.length}
              variant="default"
              defaultOpen={true}
            >
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-10 opacity-30 italic text-sm border border-dashed border-[var(--border)] rounded-2xl">
                  No upcoming tasks
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={() => openEditModal(task)}
                      onComplete={() => handleCompleteTask(task._id)}
                      onDelete={() => handleDeleteTask(task._id)}
                      isOverdue={false}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>
        )}
      </div>

      {/* Modal Backdrop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
          <div className="bg-[var(--bg)] w-full max-w-md rounded-[2rem] shadow-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{editingTask ? "Edit Task" : "Create Task"}</h2>
                  <p className="text-sm opacity-50">{editingTask ? "Update your task details." : "Set your goals and estimates."}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full hover:bg-[var(--s-btn)] transition-colors opacity-50 hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase opacity-60 tracking-wider">Course</label>
                  <div className="relative">
                    <select
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl px-4 py-3.5 pr-10 appearance-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer text-sm"
                    >
                      <option value="">Select Course</option>
                      {availableCourses.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase opacity-60 tracking-wider">Task Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Midterm Exam Prep"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="relative z-20">
                      <DateTimePicker
                        value={deadline}
                        onChange={(dateStr) => setDeadline(dateStr)}
                        label="Deadline"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase opacity-60 tracking-wider">Est. Hours</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder="2.5"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">HRS</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase opacity-60 tracking-wider">Priority</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--s-btn)] rounded-[1.25rem] border border-[var(--border)]">
                    {['low', 'medium', 'high'].map((p) => {
                      const colors = {
                        low: "bg-emerald-500 text-white shadow-emerald-500/20",
                        medium: "bg-amber-500 text-white shadow-amber-500/20",
                        high: "bg-red-500 text-white shadow-red-500/20"
                      };
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${priority === p
                            ? `${colors[p]} shadow-lg`
                            : 'opacity-40 hover:opacity-100 hover:bg-white/5'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-sm hover:bg-[var(--s-btn)] transition-colors opacity-70 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold text-sm hover:shadow-xl hover:shadow-blue-500/20 transition-all active:scale-95"
                  >
                    {editingTask ? "Update Task" : "Add Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, count, children, variant = "default", defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const styles = {
    danger: {
      header: "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10",
      badge: "bg-red-500 text-white shadow-red-500/20",
      icon: "text-red-500"
    },
    default: {
      header: "bg-white/[0.02] border-[var(--border)] text-[var(--text)] hover:bg-white/[0.04]",
      badge: "bg-blue-500 text-white shadow-blue-500/20",
      icon: "opacity-40"
    }
  }[variant];

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-6 py-4 rounded-2xl border transition-all group ${styles.header}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-lg transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${styles.icon}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg ${styles.badge}`}>
            {count}
          </span>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity">
          {isOpen ? 'Collapse' : 'Expand'}
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
        <div className="overflow-hidden">
          <div className="pt-2 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onComplete, onDelete, isOverdue }) {
  return (
    <div
      className={`group relative bg-[var(--bg)] border rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-black/[0.04] ${isOverdue
        ? "border-red-500/30 bg-red-500/[0.02] hover:border-red-500"
        : "border-[var(--border)] hover:border-blue-500/50"
        }`}
    >
      {/* Edit Button */}
      <button
        onClick={onEdit}
        className="absolute top-5 right-5 p-2.5 rounded-xl bg-[var(--s-btn)] opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white shadow-sm z-10"
        title="Edit Task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      </button>

      <div className="flex justify-between items-start mb-5 pr-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isOverdue ? "text-red-500" : "text-blue-500 opacity-80"}`}>
              {task.courseId?.name || "Independent"}
            </span>
            {isOverdue && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                Overdue
              </span>
            )}
          </div>
          <h2 className={`text-xl font-bold leading-tight group-hover:translate-x-1 transition-transform duration-300 ${isOverdue ? "text-red-600" : ""}`}>
            {task.title}
          </h2>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className={`flex flex-col gap-6 mt-6 pt-5 border-t ${isOverdue ? "border-red-500/10" : "border-[var(--border)]/40"}`}>
        <div className="flex items-center gap-5">
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase font-black tracking-tight opacity-40 mb-0.5 ${isOverdue ? "text-red-500 opacity-60" : ""}`}>Deadline</span>
            <span className={`text-sm font-semibold ${isOverdue ? "text-red-600" : "opacity-80"}`}>
              {new Date(task.deadline).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className={`w-[1px] h-8 ${isOverdue ? "bg-red-500/10" : "bg-[var(--border)]"}`} />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black tracking-tight opacity-40 mb-0.5">Estimate</span>
            <span className="text-sm font-semibold opacity-80">{task.estimatedHours}h</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {task.status !== "completed" && (
            <button
              onClick={onComplete}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-[0.98] ${isOverdue
                ? "bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
                : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Mark Completed
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-3 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] group/del"
            title="Delete Task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };
  return (
    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter border ${styles[priority]}`}>
      {priority}
    </span>
  );
}
