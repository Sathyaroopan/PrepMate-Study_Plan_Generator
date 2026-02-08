"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiUser, FiBook, FiCalendar, FiLock, FiArrowRight, FiSmile } from "react-icons/fi";

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
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        // Use the specific error message from your API if available
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { name: "rollNumber", placeholder: "Roll Number", icon: FiUser, type: "text" },
    { name: "name", placeholder: "Full Name", icon: FiSmile, type: "text" },
    { name: "course", placeholder: "Course", icon: FiBook, type: "text" },
    { name: "semester", placeholder: "Semester", icon: FiCalendar, type: "number" },
    { name: "password", placeholder: "Password", icon: FiLock, type: "password" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-300 py-10 px-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-[var(--border)] bg-[var(--bg)]">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Create Account</h1>
          <p className="text-sm text-[var(--text)] opacity-70">
            Join the student community today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {inputFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="text-sm font-medium text-[var(--text)] ml-1 capitalize">
                {field.placeholder}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <field.icon className="text-[var(--text)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
                </div>
                <input
                  name={field.name}
                  type={field.type}
                  placeholder={`Enter your ${field.placeholder.toLowerCase()}`}
                  onChange={handleChange}
                  required
                  {...(field.name === "semester" ? { min: 1, max: 8 } : {})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] placeholder:text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--p-btn)] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          ))}

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-[var(--p-btn)] text-[var(--p-btn-txt)] py-3 rounded-xl hover:bg-[var(--p-btn-hov)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg mt-2"
          >
            <span>{loading ? "Creating Account..." : "Register"}</span>
            {!loading && <FiArrowRight />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text)] opacity-70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--p-btn)] hover:underline transition-all"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
