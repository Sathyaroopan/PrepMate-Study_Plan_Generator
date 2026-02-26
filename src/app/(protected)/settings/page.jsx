"use client";

import { useState, useEffect } from "react";
import { FiType, FiEye, FiZap, FiCheck, FiRotateCw } from "react-icons/fi";

const FONT_SIZES = [
    { value: "small", label: "Small", preview: "14px" },
    { value: "medium", label: "Medium", preview: "16px" },
    { value: "large", label: "Large", preview: "18px" },
];

const SETTINGS_KEY = "prepmate-a11y-settings";

const DEFAULT_SETTINGS = {
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false,
};

function loadSettings() {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function applySettings(settings) {
    const root = document.documentElement;
    root.setAttribute("data-font-size", settings.fontSize);
    root.setAttribute("data-high-contrast", settings.highContrast ? "true" : "false");
    root.setAttribute("data-reduced-motion", settings.reducedMotion ? "true" : "false");
}

export default function SettingsPage() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const s = loadSettings();
        setSettings(s);
        applySettings(s);
    }, []);

    const updateSetting = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        applySettings(next);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    const resetAll = () => {
        setSettings(DEFAULT_SETTINGS);
        applySettings(DEFAULT_SETTINGS);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6 md:p-12 transition-colors">
            <div className="max-w-3xl mx-auto space-y-10">
                {/* Header */}
                <header className="border-b border-[var(--border)] pb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-sm opacity-60 mt-1">
                        Customize your experience. All preferences are saved automatically.
                    </p>
                </header>

                {/* Font Size */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-1 bg-blue-500 rounded-full" />
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FiType size={20} className="text-blue-500" /> Font Size
                        </h2>
                    </div>
                    <p className="text-sm opacity-50">
                        Adjust the base text size across the entire application.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {FONT_SIZES.map((fs) => (
                            <button
                                key={fs.value}
                                onClick={() => updateSetting("fontSize", fs.value)}
                                className={`p-4 rounded-2xl border-2 transition-all text-center ${settings.fontSize === fs.value
                                        ? "border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10"
                                        : "border-[var(--border)] hover:border-blue-500/30"
                                    }`}
                            >
                                <span
                                    className="block font-bold mb-1"
                                    style={{ fontSize: fs.preview }}
                                >
                                    Aa
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                                    {fs.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* High Contrast */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-1 bg-purple-500 rounded-full" />
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FiEye size={20} className="text-purple-500" /> High Contrast
                        </h2>
                    </div>
                    <p className="text-sm opacity-50">
                        Increase contrast between text and background for better readability.
                    </p>
                    <ToggleSwitch
                        enabled={settings.highContrast}
                        onChange={(v) => updateSetting("highContrast", v)}
                        color="bg-purple-500"
                    />
                </section>

                {/* Reduced Motion */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FiZap size={20} className="text-emerald-500" /> Reduced Motion
                        </h2>
                    </div>
                    <p className="text-sm opacity-50">
                        Minimize animations and transitions throughout the interface.
                    </p>
                    <ToggleSwitch
                        enabled={settings.reducedMotion}
                        onChange={(v) => updateSetting("reducedMotion", v)}
                        color="bg-emerald-500"
                    />
                </section>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
                    <button
                        onClick={resetAll}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--s-btn)] transition-colors opacity-60 hover:opacity-100"
                    >
                        <FiRotateCw size={14} /> Reset to Defaults
                    </button>

                    {saved && (
                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold animate-in fade-in zoom-in-95 duration-200">
                            <FiCheck size={16} /> Saved
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ToggleSwitch({ enabled, onChange, color }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`w-14 h-8 rounded-full transition-all duration-300 relative ${enabled ? color : "bg-[var(--border)]"
                }`}
            role="switch"
            aria-checked={enabled}
        >
            <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm absolute top-1 transition-all duration-300 ${enabled ? "left-7" : "left-1"
                    }`}
            />
        </button>
    );
}
