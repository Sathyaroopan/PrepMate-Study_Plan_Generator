"use client";

import { useState, useEffect } from "react";
import SchedulerTrigger from "@/components/SchedulerTrigger";
import { FiPlus, FiBookOpen, FiClock, FiCalendar } from "react-icons/fi";

export default function PlannerPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  // Form States
  const [activeTab, setActiveTab] = useState("plan"); // "plan", "addTask", "addExam"

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

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/studysessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchCourses();
  }, []);

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
        setMessage("Task added successfully!");
        setTaskForm({ title: "", courseName: "", deadline: "", estimatedHours: 2, priority: "medium" });
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.message}`);
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
        setMessage("Exam added successfully!");
        setExamForm({ courseName: "", examDate: "", syllabusWeight: 50 });
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Failed to add exam");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Smart Planner</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your academic workload</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "plan" ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-300" : "text-gray-500 hover:text-gray-700"}`}
          >
            My Plan
          </button>
          <button
            onClick={() => setActiveTab("addTask")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "addTask" ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-300" : "text-gray-500 hover:text-gray-700"}`}
          >
            + Add Task
          </button>
          <button
            onClick={() => setActiveTab("addExam")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "addExam" ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-300" : "text-gray-500 hover:text-gray-700"}`}
          >
            + Add Exam
          </button>
        </div>
      </div>

      {/* VIEW PLAN TAB */}
      {activeTab === "plan" && (
        <>
          <div className="flex justify-end">
            <SchedulerTrigger onPlanGenerated={fetchSessions} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Upcoming Study Sessions</h2>

            {loading ? (
              <p className="text-center py-4">Loading schedule...</p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No study sessions scheduled.</p>
                <p className="text-sm mt-2">1. Add Tasks or Exams using the tabs above.</p>
                <p className="text-sm">2. Click "Generate" to let AI plan your week!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group by Date Logic */}
                {Object.entries(sessions.reduce((groups, session) => {
                  const date = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(session);
                  return groups;
                }, {})).map(([date, dateSessions]) => (
                  <div key={date}>
                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3 bg-indigo-50 dark:bg-indigo-900/20 py-1 px-2 rounded w-fit">
                      {date}
                    </h3>
                    <div className="space-y-3">
                      {dateSessions.map((session) => (
                        <div
                          key={session._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                                {session.actualDuration} min session
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {session.title}
                            </h4>
                            {session.taskId && session.taskId.difficulty && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                Difficulty: {session.taskId.difficulty}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 sm:mt-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                              <FiBookOpen size={14} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ADD TASK FORM */}
      {activeTab === "addTask" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FiBookOpen /> Add New Assignment
          </h2>

          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 bg-transparent"
                placeholder="e.g. History Essay"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select
                  required
                  className="w-full border rounded p-2 bg-transparent"
                  value={taskForm.courseName}
                  onChange={e => setTaskForm({ ...taskForm, courseName: e.target.value })}
                >
                  <option value="">Select Course</option>
                  {courses.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded p-2 bg-transparent"
                  value={taskForm.deadline}
                  onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Est. Hours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  className="w-full border rounded p-2 bg-transparent"
                  value={taskForm.estimatedHours}
                  onChange={e => setTaskForm({ ...taskForm, estimatedHours: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className="w-full border rounded p-2 bg-transparent"
                  value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
            >
              Add Task
            </button>
          </form>
          {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
      )}

      {/* ADD EXAM FORM */}
      {activeTab === "addExam" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FiCalendar /> Add Upcoming Exam
          </h2>

          <form onSubmit={handleExamSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <select
                required
                className="w-full border rounded p-2 bg-transparent"
                value={examForm.courseName}
                onChange={e => setExamForm({ ...examForm, courseName: e.target.value })}
              >
                <option value="">Select Course</option>
                {courses.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Exam Date</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded p-2 bg-transparent"
                  value={examForm.examDate}
                  onChange={e => setExamForm({ ...examForm, examDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Syllabus Weight (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="w-full border rounded p-2 bg-transparent"
                  value={examForm.syllabusWeight}
                  onChange={e => setExamForm({ ...examForm, syllabusWeight: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
            >
              Add Exam
            </button>
          </form>
          {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
      )}

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
        <strong>How it works:</strong> Add your pending tasks and upcoming exams here. The AI Scheduler will then automatically allocate time for them in your free slots (defined in Timetable).
      </div>
    </div>
  );
}
