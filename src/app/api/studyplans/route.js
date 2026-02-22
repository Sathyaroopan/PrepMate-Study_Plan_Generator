import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import StudyPlan from "@/models/StudyPlan";
import Task from "@/models/Task";
import { generateStudyPlan } from "@/lib/scheduler";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token.value);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid Token" }, { status: 401 });
    }

    await connectDB();
    const plans = await StudyPlan.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .populate("taskIds", "title priority deadline estimatedHours")
      .lean();

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Fetch Study Plans Error:", error);
    return NextResponse.json(
      { message: "Error fetching study plans", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token.value);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid Token" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { taskIds, startDate, endDate, morningStudy, morningEndTime, useFreeSlots } = body;

    // Validation
    if (!taskIds || taskIds.length === 0) {
      return NextResponse.json({ message: "Select at least one task" }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ message: "Start and end dates are required" }, { status: 400 });
    }

    // Verify tasks belong to this user
    const tasks = await Task.find({
      _id: { $in: taskIds },
      userId: decoded.id,
      status: { $ne: "completed" },
    }).populate("courseId", "name");

    if (tasks.length === 0) {
      return NextResponse.json({ message: "No valid pending tasks found" }, { status: 400 });
    }

    // Generate the study plan using the enhanced scheduler
    // If start date is today, use current time so we don't schedule past sessions
    const parsedStart = new Date(startDate);
    const now = new Date();
    if (
      parsedStart.getFullYear() === now.getFullYear() &&
      parsedStart.getMonth() === now.getMonth() &&
      parsedStart.getDate() === now.getDate()
    ) {
      // Start from current time (rounded up to next hour for clean scheduling)
      const nextHour = new Date(now);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(nextHour.getHours() + 1);
      parsedStart.setHours(nextHour.getHours(), 0, 0, 0);
    } else {
      parsedStart.setHours(0, 0, 0, 0);
    }

    const sessions = await generateStudyPlan(decoded.id, {
      startDate: parsedStart,
      endDate: new Date(endDate),
      taskIds: taskIds,
      morningStudy: morningStudy !== false,
      morningEndTime: morningEndTime || "09:00",
      useFreeSlots: useFreeSlots !== false,
      saveToDb: false, // Don't save individual sessions — we store them in the plan
    });

    // Create auto-generated name
    const dateStr = parsedStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const planName = `Study Plan — ${dateStr}`;

    // Calculate totals
    const totalMinutes = sessions.reduce((sum, s) => sum + s.actualDuration, 0);

    // Save the study plan
    const plan = await StudyPlan.create({
      userId: decoded.id,
      name: planName,
      taskIds: tasks.map((t) => t._id),
      startDate: parsedStart,
      endDate: new Date(endDate),
      preferences: {
        morningStudy: morningStudy !== false,
        morningEndTime: morningEndTime || "09:00",
        useFreeSlots: useFreeSlots !== false,
      },
      sessions: sessions.map((s) => ({
        taskId: s.taskId,
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.actualDuration,
      })),
      totalSessions: sessions.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    });

    // Populate task info before returning
    await plan.populate("taskIds", "title priority deadline estimatedHours");

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Create Study Plan Error:", error);
    return NextResponse.json(
      { message: "Failed to generate study plan", error: error.message },
      { status: 500 }
    );
  }
}
