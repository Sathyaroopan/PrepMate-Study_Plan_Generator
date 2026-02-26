"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

export default function ProtectedShell({ userName, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Close sidebar on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") setSidebarOpen(false);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    return (
        <div className="flex h-screen">
            {/* Desktop Sidebar — always visible on md+ */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile Sidebar — overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Slide-in Sidebar */}
                    <div className="relative z-50 w-64 h-full animate-in slide-in-from-left duration-300">
                        <Sidebar />
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 min-w-0">
                <Navbar
                    userName={userName}
                    onMenuToggle={() => setSidebarOpen((v) => !v)}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg">
                    {children}
                </main>
            </div>
            <KeyboardShortcuts />
        </div>
    );
}
