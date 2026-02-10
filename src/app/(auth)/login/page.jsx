"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    rollNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error on type
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-[var(--border)] bg-[var(--bg)]">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Welcome Back</h1>
          <p className="text-sm text-[var(--text)] opacity-70">
            Please enter your details to sign in
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)] ml-1">
              Roll Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
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
                placeholder="Enter your password"
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
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text)] opacity-70">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="font-semibold text-[var(--p-btn)] hover:underline transition-all"
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
