import { connectDB } from "./db.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Timetable from "../models/Timetable.js";
import Studysession from "../models/Studysession.js";
import Course from "../models/Course.js";

export async function generateStudyPlan(userId, startDate = new Date()) {
    await connectDB();

    // 1. Fetch Data
    const tasks = await Task.find({ userId, status: { $ne: "completed" } }).populate("courseId", "name").lean();
    const timetableDoc = await Timetable.findOne({ userId });

    // If no tasks, return empty
    if (tasks.length === 0) {
        console.log("No pending tasks to schedule");
        return [];
    }

    // Clear existing future sessions to regenerate
    await Studysession.deleteMany({ userId, startTime: { $gte: startDate } });

    // 2. Prepare Work Queue with daily tracking
    let workItems = tasks.map(task => ({
        type: "task",
        id: task._id,
        title: task.title,
        courseName: task.courseId?.name || "General",
        details: task,
        priority: calculatePriority(task.priority),
        totalMinutes: (task.estimatedHours || 2) * 60,
        remainingMinutes: (task.estimatedHours || 2) * 60,
        allowSplit: true,
        deadline: new Date(task.deadline),
        dailySessionsScheduled: 0,  // Track sessions per day for this task
    }));

    // ============================================
    // DYNAMIC PLANNING PERIOD
    // ============================================

    // Find the latest deadline among all tasks
    const latestDeadline = workItems.reduce((latest, item) =>
        item.deadline > latest ? item.deadline : latest
        , workItems[0].deadline);

    // Calculate days needed: from start to latest deadline + 2 days buffer
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysToLatestDeadline = Math.ceil((latestDeadline - startDate) / msPerDay) + 2;

    // Plan until latest deadline, with min 7 days and max 60 days
    const daysToPlan = Math.max(7, Math.min(60, daysToLatestDeadline));

    console.log(`Planning period: ${daysToPlan} days (latest deadline: ${latestDeadline.toLocaleDateString()})`);

    // ============================================
    // SMART SCHEDULING CONFIGURATION
    // ============================================

    const totalWorkMinutes = workItems.reduce((sum, item) => sum + item.remainingMinutes, 0);
    const totalWorkHours = totalWorkMinutes / 60;

    // Count weekdays vs weekends
    let weekdayCount = 0;
    let weekendCount = 0;
    for (let d = 0; d < daysToPlan; d++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + d);
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendCount++;
        } else {
            weekdayCount++;
        }
    }

    const weekdayCapacityHours = 2.5;
    const weekendCapacityHours = 5;
    const totalCapacityHours = (weekdayCount * weekdayCapacityHours) + (weekendCount * weekendCapacityHours);
    const workloadRatio = totalWorkHours / totalCapacityHours;
    const scaleFactor = Math.max(1, Math.min(1.5, workloadRatio));

    const CONFIG = {
        // Time boundaries
        DAY_START_HOUR: 6,
        DAY_END_HOUR: 22,

        // Weekday limits
        WEEKDAY_MAX_STUDY_MINUTES: Math.round(150 * scaleFactor),
        WEEKDAY_MAX_SESSIONS: 3,

        // Weekend limits
        WEEKEND_MAX_STUDY_MINUTES: Math.round(300 * scaleFactor),
        WEEKEND_MAX_SESSIONS: 5,

        // Session settings
        MIN_SESSION_MINUTES: 30,
        MAX_SESSION_MINUTES: 75,
        BREAK_BETWEEN_SESSIONS: 30,

        // Time slot preferences
        PREFERRED_MORNING_END: 9,
        PREFERRED_EVENING_START: 17,

        // SESSION DISTRIBUTION (balance across time periods)
        MAX_MORNING_SESSIONS: 2,    // Max 2 sessions in morning
        MAX_EVENING_SESSIONS: 2,    // Max 2 sessions in evening
        MAX_MIDDAY_SESSIONS_WEEKDAY: 2,  // Allow 2 midday sessions (in free timetable slots)

        // Mid-day gaps - USE FREE SLOTS from timetable
        USE_MIDDAY_GAPS: true,

        // Urgency handling
        URGENT_DAYS_THRESHOLD: 3,

        // TASK VARIETY SETTINGS (NEW!)
        MAX_SESSIONS_PER_TASK_PER_DAY: 2,  // Don't do same task more than 2x per day
        PREFER_TASK_ROTATION: true,        // Rotate through different tasks
    };

    console.log(`Scheduling: ${totalWorkHours.toFixed(1)} hours across ${daysToPlan} days (${workItems.length} tasks)`);

    const newSessions = [];

    // Helper: Check if deadline allows scheduling
    const canScheduleTask = (taskDeadline, cursorTime) => {
        const deadlineEndOfDay = new Date(taskDeadline);
        deadlineEndOfDay.setHours(23, 59, 59, 999);
        return cursorTime < deadlineEndOfDay;
    };

    // Helper: Get available tasks for scheduling (with rotation logic)
    const getNextTaskForScheduling = (cursor, tasksScheduledToday, lastTaskId) => {
        // Filter to tasks that:
        // 1. Have remaining work
        // 2. Deadline hasn't passed
        // 3. Haven't exceeded daily session limit per task
        const availableTasks = workItems.filter(w =>
            w.remainingMinutes > 0 &&
            canScheduleTask(w.deadline, cursor) &&
            (tasksScheduledToday.get(w.id.toString()) || 0) < CONFIG.MAX_SESSIONS_PER_TASK_PER_DAY
        );

        if (availableTasks.length === 0) return null;

        // Separate urgent and non-urgent tasks
        const urgentTasks = availableTasks.filter(w => {
            const daysUntilDeadline = (w.deadline - cursor) / (1000 * 60 * 60 * 24);
            return daysUntilDeadline <= CONFIG.URGENT_DAYS_THRESHOLD;
        });

        const tasksToConsider = urgentTasks.length > 0 ? urgentTasks : availableTasks;

        // If rotation is enabled and we have multiple tasks, avoid the last task
        if (CONFIG.PREFER_TASK_ROTATION && tasksToConsider.length > 1 && lastTaskId) {
            const differentTasks = tasksToConsider.filter(w => w.id.toString() !== lastTaskId);
            if (differentTasks.length > 0) {
                // Pick the one with earliest deadline among different tasks
                return differentTasks.sort((a, b) => a.deadline - b.deadline)[0];
            }
        }

        // Otherwise pick by deadline priority
        return tasksToConsider.sort((a, b) => {
            const deadlineDiff = a.deadline - b.deadline;
            if (deadlineDiff !== 0) return deadlineDiff;
            return b.priority - a.priority;
        })[0];
    };

    // 4. Scheduling Loop (Day by Day)
    for (let d = 0; d < daysToPlan; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + d);

        const dayOfWeek = currentDate.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        // Set daily limits
        const dailyMaxMinutes = isWeekend ? CONFIG.WEEKEND_MAX_STUDY_MINUTES : CONFIG.WEEKDAY_MAX_STUDY_MINUTES;
        const dailyMaxSessions = isWeekend ? CONFIG.WEEKEND_MAX_SESSIONS : CONFIG.WEEKDAY_MAX_SESSIONS;

        // Daily tracking
        let dailyStudyMinutes = 0;
        let dailySessionCount = 0;
        let morningSessionsUsed = 0;  // Track per-period sessions
        let eveningSessionsUsed = 0;
        let midDaySessionsUsed = 0;
        let lastTaskId = null;
        const tasksScheduledToday = new Map();

        // Reset daily session counters for all work items
        workItems.forEach(w => w.dailySessionsScheduled = 0);

        // Define Day Constraints
        const dayStart = new Date(currentDate);
        dayStart.setHours(CONFIG.DAY_START_HOUR, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(CONFIG.DAY_END_HOUR, 0, 0, 0);

        // Get busy blocks from timetable
        const busyBlocks = await getBusyBlocks(userId, currentDate, timetableDoc, dayStart, dayEnd);

        // Calculate free intervals
        const allFreeIntervals = calculateFreeIntervals(dayStart, dayEnd, busyBlocks);

        // Time boundaries
        const morningEnd = new Date(currentDate);
        morningEnd.setHours(CONFIG.PREFERRED_MORNING_END, 0, 0, 0);

        const eveningStart = new Date(currentDate);
        eveningStart.setHours(CONFIG.PREFERRED_EVENING_START, 0, 0, 0);

        // Split and categorize intervals properly
        // An interval spanning 6am-10pm should become: morning (6am-9am), midday (9am-5pm), evening (5pm-10pm)
        const splitIntervals = [];

        for (const interval of allFreeIntervals) {
            const start = interval.start;
            const end = interval.end;

            // Check if interval falls entirely within one period
            if (end <= morningEnd) {
                splitIntervals.push({ ...interval, type: 'morning' });
            } else if (start >= eveningStart) {
                splitIntervals.push({ ...interval, type: 'evening' });
            } else if (start >= morningEnd && end <= eveningStart) {
                splitIntervals.push({ ...interval, type: 'midday' });
            } else {
                // Interval spans multiple periods - split it

                // Morning portion (before 9am)
                if (start < morningEnd) {
                    splitIntervals.push({
                        start: new Date(start),
                        end: new Date(morningEnd),
                        type: 'morning'
                    });
                }

                // Midday portion (9am - 5pm)
                const midStart = new Date(Math.max(start.getTime(), morningEnd.getTime()));
                const midEnd = new Date(Math.min(end.getTime(), eveningStart.getTime()));
                if (midStart < midEnd) {
                    splitIntervals.push({
                        start: midStart,
                        end: midEnd,
                        type: 'midday'
                    });
                }

                // Evening portion (after 5pm)
                if (end > eveningStart) {
                    splitIntervals.push({
                        start: new Date(Math.max(start.getTime(), eveningStart.getTime())),
                        end: new Date(end),
                        type: 'evening'
                    });
                }
            }
        }

        // Filter out too-short intervals after splitting
        const categorizedIntervals = splitIntervals.filter(i =>
            (i.end - i.start) / 60000 >= CONFIG.MIN_SESSION_MINUTES
        );

        // INTERLEAVE morning and evening for better distribution
        const morningIntervals = categorizedIntervals.filter(i => i.type === 'morning');
        const eveningIntervals = categorizedIntervals.filter(i => i.type === 'evening');
        const middayIntervals = categorizedIntervals.filter(i => i.type === 'midday');

        // Interleave morning and evening
        const interleavedIntervals = [];
        const maxLen = Math.max(morningIntervals.length, eveningIntervals.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < morningIntervals.length) interleavedIntervals.push(morningIntervals[i]);
            if (i < eveningIntervals.length) interleavedIntervals.push(eveningIntervals[i]);
        }
        // Add midday at the end (lowest priority)
        interleavedIntervals.push(...middayIntervals);

        // Process each interval (now interleaved)
        for (const interval of interleavedIntervals) {
            if (dailyStudyMinutes >= dailyMaxMinutes) break;
            if (dailySessionCount >= dailyMaxSessions) break;

            // Check for remaining work
            const hasRemainingWork = workItems.some(w =>
                w.remainingMinutes > 0 &&
                (tasksScheduledToday.get(w.id.toString()) || 0) < CONFIG.MAX_SESSIONS_PER_TASK_PER_DAY
            );
            if (!hasRemainingWork) break;

            // Per-period session limits
            const isMorning = interval.type === 'morning';
            const isEvening = interval.type === 'evening';
            const isMidDay = interval.type === 'midday';

            // Check period limits
            if (isMorning && morningSessionsUsed >= CONFIG.MAX_MORNING_SESSIONS) continue;
            if (isEvening && eveningSessionsUsed >= CONFIG.MAX_EVENING_SESSIONS) continue;
            if (!isWeekend && isMidDay) {
                if (!CONFIG.USE_MIDDAY_GAPS) continue;
                if (midDaySessionsUsed >= CONFIG.MAX_MIDDAY_SESSIONS_WEEKDAY) continue;
            }

            // Cursor for scheduling within this interval
            let cursor = new Date(interval.start);

            // INNER LOOP: Fill interval with sessions
            while (cursor < interval.end) {
                if (dailyStudyMinutes >= dailyMaxMinutes) break;
                if (dailySessionCount >= dailyMaxSessions) break;

                // Check per-period limits inside the loop too
                if (isMorning && morningSessionsUsed >= CONFIG.MAX_MORNING_SESSIONS) break;
                if (isEvening && eveningSessionsUsed >= CONFIG.MAX_EVENING_SESSIONS) break;
                if (!isWeekend && isMidDay && midDaySessionsUsed >= CONFIG.MAX_MIDDAY_SESSIONS_WEEKDAY) break;

                const remainingInInterval = (interval.end - cursor) / 60000;
                if (remainingInInterval < CONFIG.MIN_SESSION_MINUTES) break;

                // GET NEXT TASK (with rotation logic)
                const item = getNextTaskForScheduling(cursor, tasksScheduledToday, lastTaskId);
                if (!item) break;

                // Calculate session duration
                const remainingDailyCapacity = dailyMaxMinutes - dailyStudyMinutes;
                const daysUntilDeadline = (item.deadline - cursor) / (1000 * 60 * 60 * 24);
                const isUrgent = daysUntilDeadline <= CONFIG.URGENT_DAYS_THRESHOLD;
                const effectiveMaxSession = isUrgent ? 90 : CONFIG.MAX_SESSION_MINUTES;

                let sessionDuration = Math.min(
                    item.remainingMinutes,
                    remainingInInterval,
                    effectiveMaxSession,
                    remainingDailyCapacity
                );

                if (sessionDuration < CONFIG.MIN_SESSION_MINUTES) break;

                // Round to 15-minute chunks
                sessionDuration = Math.floor(sessionDuration / 15) * 15;
                if (sessionDuration < CONFIG.MIN_SESSION_MINUTES) break;

                const sessionStart = new Date(cursor);
                const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60000);

                // Create Session
                newSessions.push({
                    userId,
                    taskId: item.id,
                    title: item.title,
                    startTime: sessionStart,
                    endTime: sessionEnd,
                    actualDuration: sessionDuration,
                    completed: false
                });

                // Update work item
                item.remainingMinutes -= sessionDuration;
                if (item.remainingMinutes <= 5) item.remainingMinutes = 0;

                // Update daily tracking
                dailyStudyMinutes += sessionDuration;
                dailySessionCount++;
                lastTaskId = item.id.toString();  // Track for rotation

                // Track sessions per task today
                const taskIdStr = item.id.toString();
                tasksScheduledToday.set(taskIdStr, (tasksScheduledToday.get(taskIdStr) || 0) + 1);

                if (isMorning) {
                    morningSessionsUsed++;
                } else if (isEvening) {
                    eveningSessionsUsed++;
                } else if (isMidDay) {
                    midDaySessionsUsed++;
                }

                // Move cursor
                cursor = new Date(sessionEnd.getTime() + CONFIG.BREAK_BETWEEN_SESSIONS * 60000);
            }
        }

        // Log daily summary
        if (dailySessionCount > 0) {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const tasksToday = [...new Set(newSessions.filter(s =>
                s.startTime >= dayStart && s.startTime < dayEnd
            ).map(s => s.title))];
            console.log(`  ${dayName}: ${dailySessionCount} sessions (${tasksToday.length} different tasks)`);
        }
    }

    // 5. Completion check
    const unscheduledWork = workItems.filter(w => w.remainingMinutes > 0);
    if (unscheduledWork.length > 0) {
        console.log(`\nWarning: Some tasks not fully scheduled:`);
        unscheduledWork.forEach(w => {
            console.log(`  - "${w.title}": ${(w.remainingMinutes / 60).toFixed(1)} hrs remaining`);
        });
    }

    // 6. Save
    if (newSessions.length > 0) {
        await Studysession.insertMany(newSessions);
    }

    const totalScheduledMins = newSessions.reduce((s, n) => s + n.actualDuration, 0);
    console.log(`\nTotal: ${newSessions.length} sessions, ${(totalScheduledMins / 60).toFixed(1)} hours`);

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

        if (timetable.slots && Array.isArray(timetable.slots)) {
            timetable.slots.forEach(slot => {
                // A slot is BUSY only if:
                // 1. A subject/course is assigned to it (isAssigned is truthy and not empty string)
                // 2. OR it's explicitly marked as a break (lunch, recess, etc.)
                const assignedValue = daySchedule[slot.id];
                const isAssigned = assignedValue && assignedValue !== '' && assignedValue !== 'none';
                const isBreak = slot.isBreak === true;

                // If no subject is selected (empty/null), the slot is FREE for study
                if (isAssigned || isBreak) {
                    const s = parseTime(date, slot.startTime);
                    const e = parseTime(date, slot.endTime);
                    blocks.push({ start: s, end: e });
                }
            });
        }
    }

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
    let cursor = dayStart;

    for (const block of busyBlocks) {
        if (block.start > cursor) {
            free.push({ start: new Date(cursor), end: new Date(block.start) });
        }
        cursor = new Date(Math.max(cursor, block.end));
    }

    if (cursor < dayEnd) {
        free.push({ start: new Date(cursor), end: new Date(dayEnd) });
    }

    return free.filter(i => (i.end - i.start) / 60000 >= 30);
}

function parseTime(baseDate, timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
}
