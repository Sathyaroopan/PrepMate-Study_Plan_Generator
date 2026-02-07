"use client";

import { useState } from "react";
import { FiCalendar, FiLoader } from "react-icons/fi";

export default function SchedulerTrigger({ onPlanGenerated }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/scheduler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days: 7 }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`Success: ${data.sessionsCreated} sessions created!`);
                if (onPlanGenerated) onPlanGenerated();
            } else {
                setMessage(data.error ? `Error: ${data.error}` : (data.message || "Failed to generate plan"));
            }
        } catch (error) {
            setMessage("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
                {loading ? <FiLoader className="animate-spin" /> : <FiCalendar />}
                {loading ? "Generating..." : "Generate AI Study Plan"}
            </button>
            {message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        </div>
    );
}
