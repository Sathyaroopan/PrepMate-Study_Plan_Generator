"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Register</h1>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded">
            {error}
          </div>
        )}

        <input name="rollNumber" placeholder="Roll Number" onChange={handleChange} className="input" required />
        <input name="name" placeholder="Name" onChange={handleChange} className="input" required />
        <input name="course" placeholder="Course" onChange={handleChange} className="input" required />
        <input name="semester" placeholder="Semester" type="number" min="1" max="8" onChange={handleChange} className="input" required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="input" required />

        <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
          Register
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
