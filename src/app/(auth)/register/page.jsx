"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiBook, FiHash, FiArrowRight } from "react-icons/fi";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    rollNumber: "",
    name: "",
    course: "",
    semester: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-[var(--border)] bg-[var(--bg)]">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Create Account</h1>
          <p className="text-sm text-[var(--text)] opacity-70">
            Please fill in your details to register
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Roll Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)] ml-1">
              Roll Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiHash className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <input
                name="rollNumber"
                type="text"
                placeholder="Enter your roll number"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--p-btn)] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)] ml-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <input
                name="name"
                type="text"
                placeholder="Enter your full name"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--p-btn)] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Course */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)] ml-1">
              Course
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiBook className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <input
                name="course"
                type="text"
                placeholder="e.g. Computer Science"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--p-btn)] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Semester */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)] ml-1">
              Semester
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiHash className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <input
                name="semester"
                type="number"
                min="1"
                max="8"
                placeholder="Current semester (1-8)"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--p-btn)] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)] ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--p-btn)] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-[var(--p-btn)] text-[var(--p-btn-txt)] py-3 rounded-xl hover:bg-[var(--p-btn-hov)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
          >
            <span>{loading ? "Creating account..." : "Register"}</span>
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text)] opacity-70">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-[var(--p-btn)] hover:underline transition-all"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
