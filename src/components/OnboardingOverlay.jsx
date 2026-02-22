"use client";

import { useState, useEffect, useCallback } from "react";
import { FiX, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { Sparkles, LayoutDashboard, CheckSquare, Calendar, Zap, Settings } from "lucide-react";

const ONBOARDING_KEY = "prepmate-onboarding-complete";

const STEPS = [
    {
        title: "Welcome to PrepMate!",
        description:
            "Your AI-powered study planner. Let us show you around in a few quick steps.",
        icon: <Sparkles size={36} className="text-blue-500" />,
    },
    {
        title: "Navigate with the Sidebar",
        description:
            "Use the sidebar on the left to access your Dashboard, Tasks, Timetable, and Study Plans. On mobile, tap the hamburger menu (☰) to open it.",
        icon: <LayoutDashboard size={36} className="text-indigo-500" />,
    },
    {
        title: "Manage Your Tasks",
        description:
            'Head to "Manage Tasks" to add your assignments with deadlines and estimated study hours. The system uses this data to plan your schedule.',
        icon: <CheckSquare size={36} className="text-emerald-500" />,
    },
    {
        title: "Set Up Your Timetable",
        description:
            "Configure your weekly class schedule in the Timetable page. The AI planner will avoid scheduling study sessions during your classes.",
        icon: <Calendar size={36} className="text-amber-500" />,
    },
    {
        title: "Generate Study Plans",
        description:
            'Go to "Velocity" to create a personalized study plan. Select tasks, choose dates, set preferences, and let the AI build your schedule!',
        icon: <Zap size={36} className="text-purple-500" />,
    },
    {
        title: "Customize Your Experience",
        description:
            'Visit Settings to adjust font size, enable high contrast, or reduce motion. Use keyboard shortcuts (press Alt+K) for quick navigation.',
        icon: <Settings size={36} className="text-gray-500" />,
    },
];

export default function OnboardingOverlay() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const done = localStorage.getItem(ONBOARDING_KEY);
        if (!done) {
            // Small delay so the page renders first
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const complete = useCallback(() => {
        localStorage.setItem(ONBOARDING_KEY, "true");
        setVisible(false);
    }, []);

    const next = () => {
        if (step < STEPS.length - 1) setStep((s) => s + 1);
        else complete();
    };

    const prev = () => {
        if (step > 0) setStep((s) => s - 1);
    };

    if (!visible) return null;

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;
    const isFirst = step === 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Card */}
            <div className="relative z-10 bg-[var(--bg)] border border-[var(--border)] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Skip button */}
                <button
                    onClick={complete}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--s-btn)] transition-colors opacity-50 hover:opacity-100 z-10"
                    aria-label="Skip onboarding"
                >
                    <FiX size={18} />
                </button>

                {/* Content */}
                <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--s-btn)] flex items-center justify-center mx-auto mb-2">
                        {current.icon}
                    </div>
                    <h2 className="text-xl font-bold">{current.title}</h2>
                    <p className="text-sm opacity-60 leading-relaxed max-w-sm mx-auto">
                        {current.description}
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 pb-4">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step
                                ? "w-6 bg-blue-500"
                                : i < step
                                    ? "w-1.5 bg-blue-500/40"
                                    : "w-1.5 bg-[var(--border)]"
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
                    <button
                        onClick={prev}
                        disabled={isFirst}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[var(--s-btn)] transition-colors disabled:opacity-20 disabled:cursor-default"
                    >
                        <FiChevronLeft size={14} /> Back
                    </button>

                    <button
                        onClick={next}
                        className="flex items-center gap-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
                    >
                        {isLast ? "Get Started" : "Next"}{" "}
                        {!isLast && <FiChevronRight size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
