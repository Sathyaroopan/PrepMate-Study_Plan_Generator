"use client";

import { useState, useEffect } from "react";
import SchedulerTrigger from "@/components/SchedulerTrigger";
import { FiPlus, FiBookOpen, FiClock, FiCalendar, FiCheckCircle, FiAlertCircle, FiChevronRight } from "react-icons/fi";

export default function PlannerPage() {
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form States
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    courseName: "",
    deadline: "",
    estimatedHours: 2,
    priority: "medium"
  });

  const [examForm, setExamForm] = useState({
    courseName: "",
    examDate: "",
    syllabusWeight: 50
  });

  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel Fetching
      const [sessionsRes, tasksRes, examsRes, profileRes] = await Promise.all([
        fetch("/api/studysessions"),
        fetch("/api/tasks"),
        fetch("/api/exams"),
        fetch("/api/auth/profile")
      ]);

      if (sessionsRes.ok) setSessions(await sessionsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (examsRes.ok) setExams(await examsRes.json());
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
        setTaskForm({ title: "", courseName: "", deadline: "", estimatedHours: 2, priority: "medium" });
        setShowTaskForm(false);
        fetchData(); // Refresh all
      }
    } catch (error) {
      setMessage("Failed to add task");
    }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    setMessage("Saving exam...");
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examForm)
      });
      if (res.ok) {
        setMessage("Exam added!");
        setExamForm({ courseName: "", examDate: "", syllabusWeight: 50 });
        setShowExamForm(false);
        fetchData(); // Refresh all
      }
    } catch (error) {
      setMessage("Failed to add exam");
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
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const filteredSessions = sessions.filter(s => isSameDay(new Date(s.startTime), selectedDate));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Smart Planner</h1>
          <p className="text-gray-600 dark:text-gray-400">Balance your academic life</p>
        </div>
        <SchedulerTrigger onPlanGenerated={fetchData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Workload (Tasks & Exams) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Workload Header & Add Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
              <FiBookOpen className="text-indigo-500" /> Pending Workload
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
              >
                <FiPlus /> Add Task
              </button>
              <button
                onClick={() => setShowExamForm(!showExamForm)}
                className="flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 transition text-sm font-medium"
              >
                <FiPlus /> Add Exam
              </button>
            </div>

            {/* FORMS (Conditional) */}
            {showTaskForm && (
              <form onSubmit={handleTaskSubmit} className="space-y-3 mb-4 p-4 border rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">New Assignment</h3>
                <input className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" placeholder="Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                <select className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={taskForm.courseName} onChange={e => setTaskForm({ ...taskForm, courseName: e.target.value })} required>
                  <option value="">Select Course</option>
                  {courses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <input type="datetime-local" className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} required />
                <input type="number" placeholder="Est. Hours" className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={taskForm.estimatedHours} onChange={e => setTaskForm({ ...taskForm, estimatedHours: e.target.value })} required />
                <select className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} required>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Save Task</button>
              </form>
            )}

            {showExamForm && (
              <form onSubmit={handleExamSubmit} className="space-y-3 mb-4 p-4 border rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">New Exam</h3>
                <select className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={examForm.courseName} onChange={e => setExamForm({ ...examForm, courseName: e.target.value })} required>
                  <option value="">Select Course</option>
                  {courses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <input type="datetime-local" className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={examForm.examDate} onChange={e => setExamForm({ ...examForm, examDate: e.target.value })} required />
                <input type="number" placeholder="Weight %" className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800" value={examForm.syllabusWeight} onChange={e => setExamForm({ ...examForm, syllabusWeight: e.target.value })} required />
                <button type="submit" className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">Save Exam</button>
              </form>
            )}

            {/* LISTS */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Upcoming Exams</h3>
                {exams.length === 0 ? <p className="text-sm text-gray-400 italic px-1">No upcoming exams.</p> : (
                  <div className="space-y-3">
                    {exams.map(exam => (
                      <div key={exam._id} className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm flex justify-between items-center group hover:border-red-200 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{exam.courseId?.name || "Exam"}</p>
                            <p className="text-xs text-gray-500">{new Date(exam.examDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">{exam.syllabusWeight}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Pending Tasks</h3>
                {tasks.length === 0 ? <p className="text-sm text-gray-400 italic px-1">No pending tasks.</p> : (
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <div key={task._id} className="relative p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:border-indigo-200 transition group">

                        {/* Actions (Always Visible) */}
                        <div className="absolute top-2 right-2 flex gap-1 z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTaskComplete(task._id); }}
                            title="Mark as Completed"
                            className="text-gray-400 hover:text-green-500 hover:bg-green-50 p-1 rounded transition-colors"
                          >
                            <FiCheckCircle size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTaskDelete(task._id); }}
                            title="Delete Task"
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <FiAlertCircle size={15} />
                          </button>
                        </div>

                        <div className="flex justify-between items-start mb-1 pr-14">
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                            {task.priority || 'Normal'}
                          </span>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                              {task.courseId?.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end items-center mt-2 text-xs text-gray-500 gap-3">
                          <span className="flex items-center gap-1"><FiClock size={10} /> {task.estimatedHours}h</span>
                          <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Schedule View */}
        <div className="lg:col-span-2 space-y-6">

          {/* Date Picker */}
          <div className="flex overflow-x-auto pb-2 gap-3 scrollbar-hide">
            {getDates().map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-18 py-3 rounded-2xl border transition-all duration-200 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 transform -translate-y-1' : 'bg-white dark:bg-gray-800 border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-xl font-bold mt-1">{date.getDate()}</span>
                </button>
              )
            })}
          </div>

          {/* Daily Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[500px] relative">
            <div className="flex justify-between items-end mb-8 border-b border-gray-50 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {filteredSessions.length} Sessions
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400 animate-pulse">Loading schedule...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FiCalendar size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium text-lg">No sessions planned</p>
                <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Enjoy your free time, or add some tasks to get started!</p>
              </div>
            ) : (
              <div className="relative border-l border-indigo-100 dark:border-gray-700 ml-3 space-y-6">
                {filteredSessions.map((session, idx) => {
                  const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                  return (
                    <div key={session._id} className="relative group pl-8">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[5px] top-5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-gray-800 bg-indigo-500 z-10" />

                      {/* Card */}
                      <div className="group-hover:translate-x-1 transition-transform duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-md transition-all p-5">

                          {/* Time & Duration Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xl font-light text-indigo-600 dark:text-indigo-400 tracking-tight">
                                {startTime}
                              </span>
                              <span className="text-gray-300 text-sm">—</span>
                              <span className="font-mono text-xl font-light text-indigo-600 dark:text-indigo-400 tracking-tight">
                                {endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">
                              <FiClock size={12} /> {session.actualDuration}m
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {session.title}
                              </h3>
                              {/* Difficulty Badge */}
                              {session.taskId && session.taskId.difficulty && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-100 text-gray-500">
                                  Difficulty: {session.taskId.difficulty}
                                </div>
                              )}
                            </div>

                            {/* Action Icon (Optional decorative) */}
                            <div className="text-gray-200 group-hover:text-indigo-200 transition">
                              <FiChevronRight size={20} />
                            </div>
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
  );
}
