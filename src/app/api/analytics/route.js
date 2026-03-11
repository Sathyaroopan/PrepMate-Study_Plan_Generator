import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import StudySession from "@/models/Studysession";
import ActivityLog from "@/models/ActivityLog";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token.value);
    if (!decoded) return NextResponse.json({ message: "Invalid Token" }, { status: 401 });

    await connectDB();
    const userId = decoded.id;

    // Fetch all data in parallel
    const [tasks, sessions, logs] = await Promise.all([
      Task.find({ userId }).populate("courseId", "name"),
      StudySession.find({ userId }),
      ActivityLog.find({ userId }),
    ]);

    const now = new Date();

    // ========== WORKLOAD OVERVIEW ==========
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed");
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(t => new Date(t.deadline) < now);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const avgHoursPerTask = totalTasks > 0
      ? Math.round((tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0) / totalTasks) * 10) / 10
      : 0;

    // ========== PROCRASTINATION SCORE (0-100, higher = more procrastination) ==========
    let procrastinationScore = 0;
    {
      const factors = [];

      // Factor 1: % of completed tasks that were finished after their deadline
      const lateCompletions = completedTasks.filter(t => {
        const completedAt = new Date(t.updatedAt);
        const deadline = new Date(t.deadline);
        return completedAt > deadline;
      });
      const lateRate = completedTasks.length > 0
        ? lateCompletions.length / completedTasks.length
        : 0;
      factors.push(lateRate * 40); // max 40 points

      // Factor 2: Currently overdue tasks ratio
      const overdueRate = pendingTasks.length > 0
        ? overdueTasks.length / pendingTasks.length
        : 0;
      factors.push(overdueRate * 30); // max 30 points

      // Factor 3: Activity log signals (deadline_missed + task_delay events)
      const delayLogs = logs.filter(l => l.type === "task_delay" || l.type === "deadline_missed");
      const delaySignal = Math.min(delayLogs.length / Math.max(totalTasks, 1), 1);
      factors.push(delaySignal * 30); // max 30 points

      procrastinationScore = Math.round(factors.reduce((s, f) => s + f, 0));
    }

    // ========== BURNOUT RISK ==========
    let burnoutRisk = "Low";
    let burnoutScore = 0;
    {
      // Factor 1: Tasks due in next 7 days relative to available capacity
      const next7 = new Date(now.getTime() + 7 * 86400000);
      const upcomingTasks = pendingTasks.filter(t => {
        const d = new Date(t.deadline);
        return d >= now && d <= next7;
      });
      const upcomingHours = upcomingTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
      // Assume ~4h/day available = 28h/week
      const capacityRatio = Math.min(upcomingHours / 28, 1);
      burnoutScore += capacityRatio * 40;

      // Factor 2: Overdue task pressure
      const overdueHours = overdueTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
      const overduePressure = Math.min(overdueHours / 20, 1);
      burnoutScore += overduePressure * 30;

      // Factor 3: Missed session streak
      const missedLogs = logs.filter(l => l.type === "missed_session");
      const missedSignal = Math.min(missedLogs.length / 10, 1);
      burnoutScore += missedSignal * 30;

      burnoutScore = Math.round(burnoutScore);
      if (burnoutScore >= 60) burnoutRisk = "High";
      else if (burnoutScore >= 35) burnoutRisk = "Moderate";
      else burnoutRisk = "Low";
    }

    // ========== CONSISTENCY SCORE (0-100, higher = more consistent) ==========
    let consistencyScore = 0;
    {
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.completed);

      // Factor 1: Session completion rate
      const sessionCompletionRate = totalSessions > 0
        ? completedSessions.length / totalSessions
        : 0;

      // Factor 2: Day spread — how many unique days-of-week have sessions
      const daySet = new Set();
      completedSessions.forEach(s => {
        daySet.add(new Date(s.startTime).getDay());
      });
      const daySpread = daySet.size / 7; // 0 to 1

      consistencyScore = Math.round(sessionCompletionRate * 70 + daySpread * 30);
    }

    // ========== WEEKLY ACTIVITY HEATMAP ==========
    const weeklyHeatmap = [0, 0, 0, 0, 0, 0, 0]; // Mon=0 ... Sun=6
    sessions.forEach(s => {
      const day = new Date(s.startTime).getDay(); // 0=Sun
      const idx = day === 0 ? 6 : day - 1; // shift to Mon=0
      weeklyHeatmap[idx]++;
    });
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyActivity = dayLabels.map((label, i) => ({
      day: label,
      sessions: weeklyHeatmap[i],
    }));

    // ========== PRIORITY DISTRIBUTION ==========
    const priorityDist = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      if (priorityDist[t.priority] !== undefined) priorityDist[t.priority]++;
    });

    // ========== COURSE WORKLOAD ==========
    const courseMap = {};
    tasks.forEach(t => {
      const name = t.courseId?.name || "General";
      if (!courseMap[name]) courseMap[name] = { name, hours: 0, tasks: 0 };
      courseMap[name].hours += t.estimatedHours || 0;
      courseMap[name].tasks++;
    });
    const courseWorkload = Object.values(courseMap).sort((a, b) => b.hours - a.hours);

    // ========== AI INSIGHTS ==========
    const insights = [];

    // Procrastination insights
    if (procrastinationScore >= 70) {
      insights.push({
        type: "warning",
        title: "High Procrastination Detected",
        text: "You're consistently completing tasks past their deadlines. Try breaking large tasks into smaller milestones and starting earlier.",
      });
    } else if (procrastinationScore >= 40) {
      insights.push({
        type: "info",
        title: "Moderate Procrastination Pattern",
        text: "Some tasks are being completed late. Consider using the Velocity planner to schedule study sessions in advance.",
      });
    } else if (procrastinationScore < 20 && completedTasks.length >= 3) {
      insights.push({
        type: "success",
        title: "Great Time Management!",
        text: "You're completing most tasks well before their deadlines. Keep up the excellent work!",
      });
    }

    // Burnout insights
    if (burnoutRisk === "High") {
      insights.push({
        type: "warning",
        title: "Burnout Risk is High",
        text: "You have a heavy workload coming up with overdue tasks piling up. Consider prioritizing high-impact tasks and taking short breaks.",
      });
    } else if (burnoutRisk === "Moderate") {
      insights.push({
        type: "info",
        title: "Watch Your Workload",
        text: "Your upcoming workload is manageable but approaching capacity. Plan your week to avoid last-minute stress.",
      });
    } else if (burnoutRisk === "Low" && pendingTasks.length > 0) {
      insights.push({
        type: "success",
        title: "Healthy Workload Balance",
        text: "Your current workload is well-balanced. You have enough capacity to handle upcoming tasks comfortably.",
      });
    }

    // Consistency insights
    if (consistencyScore < 30 && sessions.length >= 2) {
      insights.push({
        type: "warning",
        title: "Inconsistent Study Habits",
        text: "Your study sessions are sporadic. Try to establish a daily study routine, even if it's just 30 minutes.",
      });
    } else if (consistencyScore >= 70) {
      insights.push({
        type: "success",
        title: "Consistent Study Routine",
        text: "You're studying regularly across multiple days. Consistency is key to long-term retention!",
      });
    }

    // Overdue insights
    if (overdueTasks.length > 0) {
      const highPriorityOverdue = overdueTasks.filter(t => t.priority === "high");
      if (highPriorityOverdue.length > 0) {
        insights.push({
          type: "warning",
          title: `${highPriorityOverdue.length} High-Priority Task${highPriorityOverdue.length > 1 ? "s" : ""} Overdue`,
          text: `Focus on completing "${highPriorityOverdue[0].title}" first — it's high priority and past the deadline.`,
        });
      }
    }

    // Workload distribution tip
    if (courseWorkload.length > 1) {
      const topCourse = courseWorkload[0];
      const totalHours = courseWorkload.reduce((s, c) => s + c.hours, 0);
      const topPct = Math.round((topCourse.hours / totalHours) * 100);
      if (topPct >= 50) {
        insights.push({
          type: "tip",
          title: "Uneven Workload Distribution",
          text: `${topCourse.name} accounts for ${topPct}% of your total study hours. Consider balancing effort across courses.`,
        });
      }
    }

    // Study session tip
    if (sessions.length === 0) {
      insights.push({
        type: "tip",
        title: "No Study Sessions Yet",
        text: "Use the Velocity planner to generate a study schedule. Structured sessions improve focus and retention.",
      });
    }

    // Default if no insights
    if (insights.length === 0) {
      insights.push({
        type: "info",
        title: "Keep Going!",
        text: "Add more tasks and complete study sessions to unlock detailed behavior insights.",
      });
    }

    return NextResponse.json({
      workload: {
        total: totalTasks,
        completed: completedTasks.length,
        pending: pendingTasks.length,
        overdue: overdueTasks.length,
        completionRate,
        avgHoursPerTask,
      },
      procrastinationScore,
      burnoutRisk,
      burnoutScore,
      consistencyScore,
      weeklyActivity,
      priorityDistribution: priorityDist,
      courseWorkload,
      insights,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ message: "Error computing analytics", error: error.message }, { status: 500 });
  }
}
