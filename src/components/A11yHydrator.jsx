"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "prepmate-a11y-settings";

export default function A11yHydrator() {
    useEffect(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (!stored) return;
            const s = JSON.parse(stored);
            const root = document.documentElement;
            if (s.fontSize) root.setAttribute("data-font-size", s.fontSize);
            if (s.highContrast) root.setAttribute("data-high-contrast", "true");
            if (s.reducedMotion) root.setAttribute("data-reduced-motion", "true");
        } catch (e) {
            // Ignore parse errors
        }
    }, []);

    return null;
}
