"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";

const SHORTCUTS = [
    { keys: ["Alt", "D"], label: "Dashboard", path: "/dashboard" },
    { keys: ["Alt", "T"], label: "Tasks", path: "/tasks" },
    { keys: ["Alt", "W"], label: "Timetable", path: "/timetable" },
    { keys: ["Alt", "V"], label: "Velocity", path: "/velocity" },
    { keys: ["Alt", "S"], label: "Study Plans", path: "/study-plans" },
    { keys: ["Alt", "P"], label: "Profile", path: "/profile" },
    { keys: ["Alt", "K"], label: "Shortcuts Help", path: null },
];

export default function KeyboardShortcuts() {
    const router = useRouter();
    const [showHelp, setShowHelp] = useState(false);

    const handleKeyDown = useCallback(
        (e) => {
            // Don't trigger shortcuts when typing in inputs
            const tag = e.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) {
                return;
            }

            if (e.altKey) {
                const key = e.key.toUpperCase();
                const shortcut = SHORTCUTS.find((s) => s.keys[1] === key);
                if (shortcut) {
                    e.preventDefault();
                    if (shortcut.path) {
                        router.push(shortcut.path);
                    } else {
                        // Alt+K toggles the help panel
                        setShowHelp((v) => !v);
                    }
                }
            }

            // Also allow "?" key to open help
            if (e.key === "?" && !e.altKey && !e.ctrlKey && !e.metaKey) {
                const tag = e.target.tagName;
                if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
                    e.preventDefault();
                    setShowHelp((v) => !v);
                }
            }

            // Escape closes help
            if (e.key === "Escape" && showHelp) {
                setShowHelp(false);
            }
        },
        [router, showHelp]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!showHelp) return null;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) setShowHelp(false);
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* Help Panel */}
            <div className="relative z-10 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-sm w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                    <h3 className="text-lg font-bold">Keyboard Shortcuts</h3>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="p-1.5 rounded-lg hover:bg-[var(--s-btn)] transition-colors"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="p-4 space-y-2">
                    {SHORTCUTS.map((shortcut) => (
                        <div
                            key={shortcut.label}
                            className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[var(--s-btn)]/50 transition-colors"
                        >
                            <span className="text-sm font-medium">{shortcut.label}</span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, i) => (
                                    <span key={i}>
                                        <kbd className="px-2 py-1 text-xs font-mono font-bold bg-[var(--s-btn)] border border-[var(--border)] rounded-md shadow-sm">
                                            {key}
                                        </kbd>
                                        {i < shortcut.keys.length - 1 && (
                                            <span className="text-xs opacity-30 mx-0.5">+</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Extra hint */}
                    <div className="pt-3 border-t border-[var(--border)] mt-3">
                        <div className="flex items-center justify-between py-2 px-3">
                            <span className="text-sm font-medium opacity-50">Toggle this panel</span>
                            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-[var(--s-btn)] border border-[var(--border)] rounded-md shadow-sm">
                                ?
                            </kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
