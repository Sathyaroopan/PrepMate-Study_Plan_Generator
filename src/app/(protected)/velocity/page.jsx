"use client";

import { useState, useEffect } from "react";
import SchedulerTrigger from "@/components/SchedulerTrigger";
import DateTimePicker from "@/components/DateTimePicker";
import { FiPlus, FiBookOpen, FiClock, FiCalendar, FiCheckCircle, FiAlertCircle, FiChevronRight, FiTrendingUp, FiTarget } from "react-icons/fi";

export default function PlannerPage() {
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form States
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    courseName: "",
    deadline: new Date().toISOString(),
    estimatedHours: 2,
    priority: "medium"
  });

  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel Fetching
      const [sessionsRes, tasksRes, profileRes] = await Promise.all([
        fetch("/api/studysessions"),
        fetch("/api/tasks"),
        fetch("/api/auth/profile")
      ]);

      if (sessionsRes.ok) setSessions(await sessionsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCourses(profile.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -- Handlers --

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setMessage("Saving task...");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm)
      });
      if (res.ok) {
        setMessage("Task added!");
        setTaskForm({ title: "", courseName: "", deadline: new Date().toISOString(), estimatedHours: 2, priority: "medium" });
        setShowTaskForm(false);
        fetchData(); // Refresh all
      }
    } catch (error) {
      setMessage("Failed to add task");
    }
  };



  const handleTaskComplete = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      });
      if (res.ok) {
        setMessage("Task completed!");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to complete task", error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMessage("Task deleted!");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  // -- Helpers --

  const getDates = () => {
    const dates = [];
    const today = new Date();
    // Start from 2 days ago to give some context
    const start = new Date(today);
    start.setDate(today.getDate() - 2);

    for (let i = 0; i < 16; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const hasTasksOnDate = (date) => {
    // Check if there are tasks with deadline on this date OR sessions scheduled
    const taskExists = tasks.some(t => isSameDay(new Date(t.deadline), date));
    const sessionExists = sessions.some(s => isSameDay(new Date(s.startTime), date));
    return taskExists || sessionExists;
  };

  const filteredSessions = sessions.filter(s => isSameDay(new Date(s.startTime), selectedDate));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Velocity</h1>
            <p className="text-sm opacity-60 font-medium flex items-center gap-2">
              <FiTrendingUp className="text-emerald-500" />
              Build momentum with a balanced schedule
            </p>
          </div>
          <SchedulerTrigger onPlanGenerated={fetchData} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Tasks (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiBookOpen className="text-blue-500" />
                <span>Task Queue</span>
              </h2>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-[var(--s-btn)] opacity-70">
                {tasks.length} Pending
              </span>
            </div>

            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-blue-500 hover:bg-blue-50/10 hover:text-blue-500 transition-all text-sm font-bold flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
            >
              <FiPlus size={16} /> Add New Assignment
            </button>

            {/* Task Form */}
            {showTaskForm && (
              <form onSubmit={handleTaskSubmit} className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xl animate-in fade-in slide-in-from-top-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm">New Task</h3>
                  <button type="button" onClick={() => setShowTaskForm(false)} className="text-xs opacity-50 hover:opacity-100">Cancel</button>
                </div>

                <div className="space-y-3">
                  <input
                    className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Task Title..."
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
                      value={taskForm.courseName}
                      onChange={e => setTaskForm({ ...taskForm, courseName: e.target.value })}
                      required
                    >
                      <option value="">Course</option>
                      {courses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>

                    <select
                      className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      required
                    >
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="relative z-20">
                      <DateTimePicker
                        value={taskForm.deadline}
                        onChange={(dateStr) => setTaskForm({ ...taskForm, deadline: dateStr })}
                        label="Due Date"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold opacity-70 mb-1.5">Est. Duration(hrs)</label>
                      <input
                        type="number"
                        placeholder="Hours"
                        className="w-full bg-[var(--s-btn)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none"
                        value={taskForm.estimatedHours}
                        onChange={e => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
                  Create Task
                </button>
              </form>
            )}

            {/* Task List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <FiCheckCircle className="mx-auto text-4xl mb-3" />
                  <p className="text-sm">No pending tasks. You're all clear!</p>
                </div>
              ) : (
                tasks.map(task => {
                  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                  return (
                    <div key={task._id} className={`group relative bg-[var(--bg)] border rounded-xl p-4 transition-all duration-300 ${isOverdue
                      ? "border-red-500 bg-red-500/5 hover:border-red-600 shadow-sm"
                      : "border-[var(--border)] hover:border-blue-500/50 hover:shadow-lg"
                      }`}>

                      {/* Priority Stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isOverdue ? 'bg-red-600' :
                        task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'low' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />

                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? "text-red-500" : "opacity-50"}`}>
                              {task.courseId?.name || "General"}
                            </span>
                            {isOverdue && (
                              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleTaskComplete(task._id)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                              title="Complete"
                            >
                              <FiCheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleTaskDelete(task._id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete"
                            >
                              <FiAlertCircle size={14} />
                            </button>
                          </div>
                        </div>

                        <h3 className={`font-bold text-sm mb-2 pr-8 leading-snug ${isOverdue ? "text-red-500" : ""}`}>{task.title}</h3>

                        <div className={`flex items-center gap-4 text-xs font-medium ${isOverdue ? "text-red-500 opacity-100" : "opacity-60"}`}>
                          <div className="flex items-center gap-1.5">
                            <FiClock size={12} />
                            <span>{task.estimatedHours}h</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FiCalendar size={12} />
                            <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Schedule (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-[var(--s-btn)]/30 rounded-3xl border border-[var(--border)] overflow-hidden">

            {/* Styled Date Strip to match user request */}
            <div className="bg-[var(--bg)] border-b border-[var(--border)] p-6">
              <div className="flex overflow-x-auto gap-3 scrollbar-hide pb-2">
                {getDates().map((date, i) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());
                  const hasTask = hasTasksOnDate(date);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[90px] rounded-2xl border transition-all duration-300 relative group overflow-hidden ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_20px_-5px_rgba(37,99,235,0.6)] z-10'
                        : isToday
                          ? 'bg-[var(--s-btn)] border-[var(--text)]/20 text-[var(--text)] shadow-sm'
                          : 'bg-[var(--s-btn)] border-transparent text-[var(--text)]/40 hover:bg-[var(--s-btn)]/80 hover:text-[var(--text)]'
                        }`}
                    >
                      {/* Day Name */}
                      <span className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-blue-100' : 'opacity-40'}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>

                      {/* Date Number */}
                      <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-[var(--text)]/80'}`}>
                        {date.getDate()}
                      </span>

                      {/* Task Dot Indicator */}
                      {hasTask && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-2 transition-all ${isSelected ? 'bg-white' : 'bg-gray-500 group-hover:bg-gray-400'
                          }`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Timeline View */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[var(--bg)] relative">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </h2>
                  <p className="opacity-60 font-medium mt-1">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {filteredSessions.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-wider">
                    <FiTarget size={14} />
                    {filteredSessions.length} Sessions Planned
                  </div>
                )}
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-[var(--s-btn)] rounded-2xl" />
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--border)] rounded-3xl opacity-50">
                  <FiCalendar size={48} className="mb-4 text-[var(--text)]" />
                  <p className="font-bold text-lg">No sessions planned</p>
                  <p className="text-sm">Enjoy your day or generate a new plan!</p>
                </div>
              ) : (
                <div className="relative pl-8 space-y-8 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:to-transparent before:opacity-20">
                  {filteredSessions.map((session, idx) => {
                    const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    const endTime = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    const isBreak = session.title.toLowerCase().includes('break');

                    return (
                      <div key={session._id} className="relative group">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[24px] top-6 w-3 h-3 rounded-full border-2 border-[var(--bg)] shadow-sm z-10 ${isBreak ? 'bg-amber-400' : 'bg-blue-500'
                          }`} />

                        {/* Card */}
                        <div className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${isBreak
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-[var(--bg)] border-[var(--border)] hover:border-blue-500/30'
                          }`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                            {/* Time */}
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-2 rounded-xl bg-[var(--s-btn)] text-xs font-mono font-bold tracking-tight opacity-70">
                                {startTime} — {endTime}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider opacity-40">
                                {session.actualDuration} min
                              </span>
                            </div>

                            {/* Title */}
                            <div className="flex-1">
                              <h3 className={`text-lg font-bold ${isBreak ? 'text-amber-600 dark:text-amber-500' : ''}`}>
                                {session.title}
                              </h3>
                              {session.taskId?.difficulty && (
                                <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${session.taskId.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
                                  session.taskId.difficulty === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                  {session.taskId.difficulty}
                                </span>
                              )}
                            </div>

                            {/* Action arrow */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--p-btn)]">
                              <FiChevronRight size={24} />
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

