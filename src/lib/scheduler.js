import { connectDB } from "./db.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Timetable from "../models/Timetable.js";
import Studysession from "../models/Studysession.js";
import Course from "../models/Course.js";

export async function generateStudyPlan(userId, startDate = new Date(), daysToPlan = 14) {
    await connectDB();

    // 1. Fetch Data
    const tasks = await Task.find({ userId, status: { $ne: "completed" } }).populate("courseId", "name").lean();
    const timetableDoc = await Timetable.findOne({ userId });

    // Clear existing future sessions to regenerate logic
    // We use $gte start of today to avoid deleting past history if simpler, but user likely wants full regen.
    // Let's delete future sessions from "now" onwards.
    await Studysession.deleteMany({ userId, startTime: { $gte: startDate } });

    // 2. Prepare Work Queue
    let workItems = [];

    // Process Tasks
    tasks.forEach(task => {
        workItems.push({
            type: "task",
            id: task._id,
            title: task.title,
            courseName: task.courseId?.name || "General",
            details: task,
            priority: calculatePriority(task.priority),
            remainingMinutes: (task.estimatedHours || 2) * 60,
            allowSplit: true, // task can be split across sessions
            deadline: new Date(task.deadline)
        });
    });

    // Sort by Urgency (Deadline) and Priority
    workItems.sort((a, b) => {
        // 1. Deadline (Closest first)
        const timeA = a.deadline.getTime();
        const timeB = b.deadline.getTime();
        if (timeA !== timeB) return timeA - timeB;
        // 2. Priority (Higher first)
        return b.priority - a.priority;
    });

    const newSessions = [];
    const DAY_START_HOUR = 6;  // 06:00
    const DAY_END_HOUR = 23;   // 23:00
    const MIN_SESSION_MINUTES = 45; // Minimum viable study slot
    const BREAK_INTERVAL_MINUTES = 120; // Break after 2 hours
    const BREAK_DURATION_MINUTES = 15;

    // 3. Scheduling Loop (Day by Day)
    for (let d = 0; d < daysToPlan; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + d);

        // Define Day Constraints for this specific date
        const dayStart = new Date(currentDate);
        dayStart.setHours(DAY_START_HOUR, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

        // Identify Busy Blocks
        const busyBlocks = await getBusyBlocks(userId, currentDate, timetableDoc, dayStart, dayEnd);

        // Calculate Free Time Intervals
        const freeIntervals = calculateFreeIntervals(dayStart, dayEnd, busyBlocks);

        // Iterate Free Intervals and Fill with Work
        for (let interval of freeIntervals) {
            let cursor = interval.start;
            let consecutiveStudyTime = 0;

            // While we have room in this interval
            while (cursor < interval.end && workItems.length > 0) {
                // Check if we need a break
                if (consecutiveStudyTime >= BREAK_INTERVAL_MINUTES) {
                    consecutiveStudyTime = 0;
                    cursor = new Date(cursor.getTime() + BREAK_DURATION_MINUTES * 60000);
                    continue; // Loop again to check if cursor is still < interval.end
                }

                // Check remaining time in this interval
                const timeRemainingInInterval = (interval.end - cursor) / 60000; // minutes
                if (timeRemainingInInterval < MIN_SESSION_MINUTES) {
                    break; // Interval too small to start meaningful work
                }

                // Pick the next task
                // We pick the first task that is NOT effectively completed and NOT due yet
                let currentItemIndex = workItems.findIndex(w => w.remainingMinutes > 0 && w.deadline > cursor);

                if (currentItemIndex === -1) break; // No work available for this time

                const item = workItems[currentItemIndex];

                // Determine session duration
                // Max we can do is: 1. Remaining time for task, 2. Time in interval, 3. Time until next break
                let maxDuration = Math.min(
                    item.remainingMinutes,
                    timeRemainingInInterval,
                    BREAK_INTERVAL_MINUTES - consecutiveStudyTime
                );

                // Round to 15 min chunks?
                maxDuration = Math.floor(maxDuration);

                if (maxDuration < 15) {
                    // Too small a fragment for this specific task?
                    // Maybe skip to next task or just force it? 
                    // Let's skip valid work placement if < 15 mins
                    break;
                }

                // Create Session
                const sessionEnd = new Date(cursor.getTime() + maxDuration * 60000);
                newSessions.push({
                    userId,
                    taskId: item.id,
                    title: item.title,
                    startTime: new Date(cursor),
                    endTime: sessionEnd,
                    actualDuration: maxDuration,
                    completed: false
                });

                // Update State
                item.remainingMinutes -= maxDuration;
                if (item.remainingMinutes <= 5) item.remainingMinutes = 0; // Close enough

                cursor = sessionEnd;
                consecutiveStudyTime += maxDuration;

                // Re-sort queue if needed? 
                // For simplicity, we keep same order, but since we modify remainingMinutes, 
                // completed items naturally get skipped by findIndex.
            }
        }
    }

    // 4. Save
    if (newSessions.length > 0) {
        await Studysession.insertMany(newSessions);
    }

    return newSessions;
}

// Helpers

function calculatePriority(p) {
    if (p === 'high') return 3;
    if (p === 'medium') return 2;
    return 1;
}

async function getBusyBlocks(userId, date, timetable, dayStart, dayEnd) {
    const blocks = [];

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    if (timetable && timetable.timetable && timetable.timetable[dayName]) {
        const daySchedule = timetable.timetable[dayName];

        // timetable.slots contains definitions. 
        // We need to map slot IDs in daySchedule to actual times.
        if (timetable.slots && Array.isArray(timetable.slots)) {
            timetable.slots.forEach(slot => {
                // Check if this slot is assigned to a course OR is a breaks (lunch/recess)
                // We treat explicit Breaks as BUSY too (e.g. Lunch).
                // We treat assigned slots as BUSY.
                const isAssigned = daySchedule[slot.id];
                const isBreak = slot.isBreak;

                if (isAssigned || isBreak) {
                    // Convert "HH:mm" to Date objects for this specific day
                    const s = parseTime(date, slot.startTime);
                    const e = parseTime(date, slot.endTime);
                    blocks.push({ start: s, end: e });
                }
            });
        }
    }

    // Sort and Merge Overlapping Blocks
    blocks.sort((a, b) => a.start - b.start);

    const merged = [];
    if (blocks.length > 0) merged.push(blocks[0]);

    for (let i = 1; i < blocks.length; i++) {
        const last = merged[merged.length - 1];
        const current = blocks[i];

        if (current.start < last.end) {
            last.end = new Date(Math.max(last.end, current.end));
        } else {
            merged.push(current);
        }
    }

    return merged;
}

function calculateFreeIntervals(dayStart, dayEnd, busyBlocks) {
    const free = [];
    let distinctNow = dayStart;

    for (const block of busyBlocks) {
        if (block.start > distinctNow) {
            free.push({ start: new Date(distinctNow), end: new Date(block.start) });
        }
        distinctNow = new Date(Math.max(distinctNow, block.end));
    }

    if (distinctNow < dayEnd) {
        free.push({ start: new Date(distinctNow), end: new Date(dayEnd) });
    }

    // Filter small gaps
    return free.filter(i => (i.end - i.start) / 60000 >= 45);
}

function parseTime(baseDate, timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
}

