"use client";

import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { FiMenu } from "react-icons/fi";
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar({ userName, onMenuToggle }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedTheme = localStorage.getItem("theme");
    const isDark =
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
    setDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const nextTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  if (!mounted) return null;

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 bg-bg transition-colors">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--s-btn)] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <FiMenu size={20} />
          </button>
        )}

        <Link href="/" className="flex items-center">
          <Image
            src="/logo_text_light.png"
            alt="PrepMate Logo"
            width={120}
            height={40}
            className="block dark:hidden h-8 w-auto"
            priority
          />
          <Image
            src="/logo_text_dark.png"
            alt="PrepMate Logo"
            width={120}
            height={40}
            className="hidden dark:block h-8 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 flex justify-center cursor-pointer rounded-full bg-secondary-btn text-secondary-btn-text hover:bg-secondary-btn-hover transition-all"
        >
          <span
            className={`inline-block transition-transform duration-500 ${darkMode ? "rotate-180" : "rotate-0"
              }`}
          >
            {darkMode ? (
              <MdLightMode size={20} className="text-yellow-400" />
            ) : (
              <MdDarkMode size={20} className="text-indigo-600" />
            )}
          </span>
        </button>

        {/* User Name */}
        <button className="px-3 md:px-4 py-2 bg-primary-btn text-primary-btn-text rounded hover:bg-primary-btn-hover transition-colors font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-none">
          {userName}
        </button>
      </div>
    </header>
  );
}

