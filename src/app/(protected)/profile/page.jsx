"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [rollNumber, setrollNumber] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setrollNumber(data.rollNumber || "");
          setCourse(data.course || "");
          setSemester(data.semester || "");
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, rollNumber, course, semester, courses }),
      });
      if (!res.ok) alert("Failed to save profile");
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSaving(false);
    }
  };

  const addCourse = () => {
    if (!newCourse.trim()) return;
    setCourses([...courses, newCourse.trim()]);
    setNewCourse("");
  };

  const removeCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-10 text-text">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-bg text-text p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="border-b border-[var(--border)] pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-sm opacity-60 mt-1">Manage your academic identity and enrolled courses.</p>
        </header>

        {/* Basic Info Card */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary-btn rounded-full"></div>
            <h2 className="text-xl font-semibold">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider opacity-50">Full Name</label>
              <input
                className="w-full bg-transparent border border-[var(--border)] rounded-lg p-3 focus:ring-2 focus:ring-primary-btn outline-none transition-all"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider opacity-50">Roll Number</label>
              <input
                className="w-full bg-transparent border border-[var(--border)] rounded-lg p-3 focus:ring-2 focus:ring-primary-btn outline-none transition-all"
                placeholder="e.g. 2021CSE01"
                value={rollNumber}
                onChange={(e) => setrollNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider opacity-50">Degree / Course</label>
              <input
                className="w-full bg-transparent border border-[var(--border)] rounded-lg p-3 focus:ring-2 focus:ring-primary-btn outline-none transition-all"
                placeholder="e.g. B.Tech Computer Science"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider opacity-50">Current Semester</label>
              <input
                className="w-full bg-transparent border border-[var(--border)] rounded-lg p-3 focus:ring-2 focus:ring-primary-btn outline-none transition-all"
                placeholder="e.g. 6th"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-3 rounded-lg font-medium bg-primary-btn text-primary-btn-text hover:bg-primary-btn-hover active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Update Profile"}
          </button>
        </section>

        {/* Courses Section */}
        <section className="space-y-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary-btn rounded-full"></div>
            <h2 className="text-xl font-semibold">Course Enrollment</h2>
          </div>

          <div className="flex gap-3">
            <input
              className="flex-1 bg-transparent border border-[var(--border)] rounded-lg p-3 focus:ring-2 focus:ring-primary-btn outline-none transition-all"
              placeholder="Enter subject name..."
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCourse()}
            />
            <button
              onClick={addCourse}
              className="px-6 py-3 rounded-lg font-medium bg-secondary-btn text-secondary-btn-text hover:bg-secondary-btn-hover transition-colors"
            >
              Add
            </button>
          </div>

          <div className="grid gap-3">
            {courses.length === 0 && (
              <p className="text-sm opacity-40 italic py-4">No courses added yet.</p>
            )}
            {courses.map((c, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-transparent border border-[var(--border)] rounded-xl p-4 group hover:border-text/30 transition-colors"
              >
                <span className="font-medium">{c}</span>
                <button
                  onClick={() => removeCourse(i)}
                  className="text-red-500 opacity-60 hover:opacity-100 hover:bg-red-500/10 px-3 py-1 rounded-md transition-all text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}