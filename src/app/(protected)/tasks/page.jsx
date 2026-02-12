"use client";

import { useEffect, useState } from "react";
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Tasks</h1>
            <div className="flex gap-4 text-sm opacity-60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {tasks.length} Assignments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {totalHours} Total Hours
              </span>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="h-fit px-6 py-3 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-semibold hover:bg-[var(--p-btn-hov)] transition-all active:scale-95 shadow-lg shadow-black/5"
          >
            + Add New Task
          </button>
        </header>

        {/* Task Grid */}
        {tasks.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--border)] rounded-3xl py-20 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <h3 className="text-lg font-medium opacity-80">All caught up!</h3>
            <p className="text-sm opacity-50 mt-1">Enjoy your free time or add a new task.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="group relative bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--p-btn)] transition-all hover:shadow-xl hover:shadow-black/[0.02]"
              >
                {/* Edit Button - Visible on Hover */}
                <button
                  onClick={() => openEditModal(task)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--s-btn)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500/10 hover:text-blue-500"
                  title="Edit Task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>

                <div className="flex justify-between items-start mb-4 pr-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                      {task.courseId?.name || "Independent"}
                    </span>
                    <h2 className="text-xl font-bold group-hover:translate-x-1 transition-transform">
                      {task.title}
                    </h2>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]/50">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase opacity-40 font-bold">Deadline</span>
                      <span className="text-sm font-medium">
                        {new Date(task.deadline).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-[var(--border)]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase opacity-40 font-bold">Estimate</span>
                      <span className="text-sm font-medium">{task.estimatedHours}h</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[var(--s-btn)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Backdrop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/20 animate-in fade-in duration-300">
          <div className="bg-[var(--bg)] w-full max-w-md rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-1">{editingTask ? "Edit Task" : "Create Task"}</h2>
              <p className="text-sm opacity-50 mb-8">{editingTask ? "Update your task details." : "Set your goals and estimates."}</p>

              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase opacity-60 tracking-wider">Course</label>
                  <div className="relative">
                    <select
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl px-4 py-3 pr-10 appearance-none outline-none focus:ring-2 focus:ring-[var(--p-btn)] transition-all cursor-pointer"
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
                    className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--p-btn)] transition-all"
                  />
                </div>

                <div className="space-y-4">
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
                        className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-[var(--p-btn)] transition-all text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">HRS</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase opacity-60 tracking-wider">Priority</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--s-btn)] rounded-xl border border-[var(--border)]">
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
                          className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${priority === p
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm hover:bg-[var(--s-btn)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold text-sm hover:shadow-lg transition-all active:scale-95"
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

function PriorityBadge({ priority }) {
  const styles = {
    high: "bg-red-500/10 text-red-600 dark:text-red-400",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-tighter ${styles[priority]}`}>
      {priority}
    </span>
  );
}
