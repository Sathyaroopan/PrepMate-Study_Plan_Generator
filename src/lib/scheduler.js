import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import Timetable from "@/models/Timetable";
import Studysession from "@/models/Studysession";
import Exam from "@/models/Exam";
import Course from "@/models/Course"; // Added for populate to work

export async function generateStudyPlan(userId, startDate = new Date(), daysToPlan = 7) {
    await connectDB();

    // 1. Fetch User and Preferences
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2. Fetch Timetable
    const timetableDoc = await Timetable.findOne({ userId });
    const timetableSlots = timetableDoc ? timetableDoc.slots : [];

    // Clear ALL existing sessions for this user to prevent duplicates
    // (We regenerate the full plan each time)
    await Studysession.deleteMany({ userId });

    // Default slots if none exist (fallback)
    const availableSlots = timetableSlots.length > 0 ? timetableSlots : [
        { startTime: "18:00", endTime: "19:00", isBreak: false },
        { startTime: "19:00", endTime: "20:00", isBreak: false },
        { startTime: "20:00", endTime: "21:00", isBreak: false },
        { startTime: "21:00", endTime: "22:00", isBreak: false },
    ];

    // 3. Fetch Pending Tasks & Exams
    // Populate courseId to get names for titles
    const tasks = await Task.find({
        userId,
        status: { $ne: "completed" },
        deadline: { $gte: startDate },
    }).populate("courseId", "name").lean();

    const exams = await Exam.find({
        userId,
        examDate: { $gte: startDate },
    }).populate("courseId", "name").lean();

    // Convert Exams to "Task-like" objects for unified scheduling
    const examTasks = exams.map(exam => ({
        _id: exam._id,
        // Safe access to course name
        title: `Exam Prep: ${exam.courseId?.name || "Unknown Course"}`,
        deadline: exam.examDate,
        priority: "high",
        difficulty: 5,
        estimatedHours: (exam.syllabusWeight || 50) / 10, // heuristic
        type: "Exam",
        isExam: true,
        original: exam
    }));

    // Pre-process tasks for better titles
    const processedTasks = tasks.map(task => ({
        ...task,
        // Enhance title with course name
        enhancedTitle: `Study: ${task.courseId?.name || "General"} - ${task.title}`,
        original: task
    }));

    let allWork = [...processedTasks, ...examTasks];

    // 4. Score and Sort Workload
    const scoredWork = allWork.map(item => {
        const diff = item.difficulty || item.estimatedHours || 3;
        const due = item.deadline;
        const daysUntil = Math.max(0.1, (new Date(due) - startDate) / (1000 * 60 * 60 * 24));
        const score = (diff * 10) / daysUntil;

        return { ...item, score, dueDate: due };
    }).sort((a, b) => b.score - a.score);

    // 5. Allocation Loop
    const newSessions = [];

    // Helper to set session times
    const setSessionTime = (baseDate, timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        const d = new Date(baseDate);
        d.setHours(h, m, 0, 0);
        return d;
    };

    for (let d = 0; d < daysToPlan; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + d);

        const daySlots = availableSlots.filter(s => !s.isBreak);
        let slotIndex = 0; // Track which slot we're on

        while (slotIndex < daySlots.length && scoredWork.length > 0) {
            const slot = daySlots[slotIndex];
            const workItem = scoredWork[0];
            const startDateTime = setSessionTime(currentDate, slot.startTime);
            const endDateTime = setSessionTime(currentDate, slot.endTime);
            const durationMins = (endDateTime - startDateTime) / (1000 * 60);

            const session = {
                userId,
                taskId: workItem.isExam ? null : workItem._id,
                examId: workItem.isExam ? workItem._id : null,
                title: workItem.isExam ? workItem.title : workItem.enhancedTitle,
                startTime: startDateTime,
                endTime: endDateTime,
                actualDuration: durationMins,
                completed: false
            };

            newSessions.push(session);
            slotIndex++; // Move to next slot

            // Consumption logic: reduce remaining work
            workItem.original.difficulty = (workItem.original.difficulty || 3) - 1;

            if (workItem.original.difficulty <= 0) {
                scoredWork.shift(); // Remove completed task
            } else {
                // Rotate to end of queue
                const justDone = scoredWork.shift();
                scoredWork.push(justDone);
            }
        }
    }

    // 6. Save to DB
    if (newSessions.length > 0) {
        await Studysession.insertMany(newSessions);
    }

    return newSessions;
}
