"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image';
import { Sparkles } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const getLinkStyles = (href) => {
    const isActive = pathname === href;

    return isActive
      ? "bg-(--color-primary-btn) text-(--color-primary-btn-text) shadow-sm"
      : "bg-secondary-btn text-(--color-text) hover:bg-(--color-secondary-btn-hover) opacity-70 hover:opacity-100";
  };

  return (
    <>
      <aside className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-bg h-screen transition-colors">
        {/* Top Section */}
        <div className="flex-1">
          <div className="p-6">
            <Image
              src="/logo_icon_light.png"
              alt="Site Logo"
              width={40}
              height={40}
              className="block dark:hidden"
              priority
            />

            <Image
              src="/logo_icon_dark.png"
              alt="Site Logo"
              width={40}
              height={40}
              className="hidden dark:block"
              priority
            />
          </div>

          <nav className="flex flex-col gap-2 px-4">
            <Link
              href="/dashboard"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${getLinkStyles("/dashboard")}`}
            >
              Dashboard
            </Link>

            <Link
              href="/timetable"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${getLinkStyles("/timetable")}`}
            >
              Timetable
            </Link>

            <Link
              href="/tasks"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${getLinkStyles("/tasks")}`}
            >
              Manage Tasks
            </Link>

            <Link
              href="/velocity"
              className={`group flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 w-full ${getLinkStyles("/velocity")}`}
            >
              <span className="font-medium">Velocity</span>
              <Sparkles
                size={16}
                className="shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 opacity-70 group-hover:opacity-100"
              />
            </Link>

            <Link
              href="/analytics"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${getLinkStyles("/analytics")}`}
            >
              Analytics
            </Link>

            <Link
              href="/profile"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${getLinkStyles("/profile")}`}
            >
              Manage Profile
            </Link>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2 px-4 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4">
          <Link
            href="/settings"
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${getLinkStyles("/settings")}`}
          >
            Manage Settings
          </Link>

          <button
            onClick={() => setIsLogoutOpen(true)}
            className="w-full text-left px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      {isLogoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20"
          onClick={(e) => {
            // Close only if the backdrop is clicked, not the modal content
            if (e.target === e.currentTarget) setIsLogoutOpen(false);
          }}
        >
          <div className="bg-bg dark:bg-bg p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-text dark:text-text">Confirm Logout</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Are you sure you want to log out? You will need to sign back in to access your data.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg cursor-pointer bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                  });

                  setIsLogoutOpen(false);
                  window.location.href = "/login";
                }}
                className="flex-1 px-4 py-2 rounded-lg cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}