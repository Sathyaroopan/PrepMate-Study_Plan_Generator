/**
 * @jest-environment node
 */

import { calculatePriority, parseTime, calculateFreeIntervals } from "@/lib/scheduler";

// ─── calculatePriority ──────────────────────────────────────────────

describe("calculatePriority", () => {
    it("returns 3 for 'high' priority", () => {
        expect(calculatePriority("high")).toBe(3);
    });

    it("returns 2 for 'medium' priority", () => {
        expect(calculatePriority("medium")).toBe(2);
    });

    it("returns 1 for 'low' priority", () => {
        expect(calculatePriority("low")).toBe(1);
    });

    it("returns 1 for any unknown priority string", () => {
        expect(calculatePriority("urgent")).toBe(1);
        expect(calculatePriority("")).toBe(1);
        expect(calculatePriority(undefined)).toBe(1);
    });
});

// ─── parseTime ───────────────────────────────────────────────────────

describe("parseTime", () => {
    const baseDate = new Date(2026, 1, 10); // Feb 10, 2026

    it("parses '09:30' into a Date with hours=9 and minutes=30", () => {
        const result = parseTime(baseDate, "09:30");
        expect(result.getHours()).toBe(9);
        expect(result.getMinutes()).toBe(30);
        expect(result.getSeconds()).toBe(0);
    });

    it("parses '00:00' as midnight", () => {
        const result = parseTime(baseDate, "00:00");
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
    });

    it("parses '22:00' as 10 PM", () => {
        const result = parseTime(baseDate, "22:00");
        expect(result.getHours()).toBe(22);
        expect(result.getMinutes()).toBe(0);
    });

    it("does not mutate the original baseDate", () => {
        const original = new Date(baseDate);
        parseTime(baseDate, "15:45");
        expect(baseDate.getTime()).toBe(original.getTime());
    });
});

// ─── calculateFreeIntervals ─────────────────────────────────────────

describe("calculateFreeIntervals", () => {
    // Helper to make dates easier to create
    const makeTime = (hours, minutes = 0) => {
        const d = new Date(2026, 1, 10);
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    it("returns full day as free when there are no busy blocks", () => {
        const dayStart = makeTime(6);
        const dayEnd = makeTime(22);

        const result = calculateFreeIntervals(dayStart, dayEnd, []);

        expect(result).toHaveLength(1);
        expect(result[0].start.getTime()).toBe(dayStart.getTime());
        expect(result[0].end.getTime()).toBe(dayEnd.getTime());
    });

    it("returns gaps around a single busy block", () => {
        const dayStart = makeTime(6);
        const dayEnd = makeTime(22);
        const busyBlocks = [
            { start: makeTime(9), end: makeTime(10) },
        ];

        const result = calculateFreeIntervals(dayStart, dayEnd, busyBlocks);

        // Free: 6:00-9:00 and 10:00-22:00
        expect(result).toHaveLength(2);
        expect(result[0].start.getHours()).toBe(6);
        expect(result[0].end.getHours()).toBe(9);
        expect(result[1].start.getHours()).toBe(10);
        expect(result[1].end.getHours()).toBe(22);
    });

    it("filters out intervals shorter than 30 minutes", () => {
        const dayStart = makeTime(9);
        const dayEnd = makeTime(10);
        const busyBlocks = [
            { start: makeTime(9, 10), end: makeTime(10) }, // Only 10 min free at start
        ];

        const result = calculateFreeIntervals(dayStart, dayEnd, busyBlocks);

        // The 10-minute gap (9:00-9:10) should be filtered out
        expect(result).toHaveLength(0);
    });

    it("handles multiple busy blocks correctly", () => {
        const dayStart = makeTime(6);
        const dayEnd = makeTime(22);
        const busyBlocks = [
            { start: makeTime(9), end: makeTime(10) },
            { start: makeTime(11), end: makeTime(12) },
            { start: makeTime(14), end: makeTime(15) },
        ];

        const result = calculateFreeIntervals(dayStart, dayEnd, busyBlocks);

        // Free: 6-9, 10-11, 12-14, 15-22
        expect(result).toHaveLength(4);
    });

    it("handles busy block at start of day", () => {
        const dayStart = makeTime(6);
        const dayEnd = makeTime(22);
        const busyBlocks = [
            { start: makeTime(6), end: makeTime(8) },
        ];

        const result = calculateFreeIntervals(dayStart, dayEnd, busyBlocks);

        expect(result).toHaveLength(1);
        expect(result[0].start.getHours()).toBe(8);
        expect(result[0].end.getHours()).toBe(22);
    });
});
