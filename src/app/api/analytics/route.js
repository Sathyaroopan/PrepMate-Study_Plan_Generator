import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";
import Studysession from "@/models/Studysession";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(req) {
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
        const userId = decoded.id;

        // Date Range: Last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Fetch Data
        const logs = await ActivityLog.find({
            userId,
            timestamp: { $gte: thirtyDaysAgo }
        }).sort({ timestamp: 1 });

        const sessions = await Studysession.find({
            userId,
            startTime: { $gte: thirtyDaysAgo },
            completed: true
        }).sort({ startTime: 1 });

        // --- Analytics Logic ---

        // 1. Postponements (Procrastination)
        const postponements = logs.filter(l => l.type === 'task_delay').length;
        const postponementTrend = logs
            .filter(l => l.type === 'task_delay')
            .reduce((acc, l) => {
                const date = new Date(l.timestamp).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

        // 2. Productive Hours (Based on Session Start Times)
        const hourCounts = {};
        sessions.forEach(s => {
            const hour = new Date(s.startTime).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        // Find peak hour
        let peakHour = null;
        let maxCount = 0;
        for (const [h, count] of Object.entries(hourCounts)) {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(h);
            }
        }

        // 3. Burnout Indicators (Daily Study Load)
        const dailyLoad = {};
        sessions.forEach(s => {
            const date = new Date(s.startTime).toDateString();
            dailyLoad[date] = (dailyLoad[date] || 0) + (s.actualDuration || 0);
        });

        let burnoutRisk = "Low";
        const recentDays = Object.values(dailyLoad).slice(-7); // Last 7 active days
        const avgDailyMinutes = recentDays.reduce((a, b) => a + b, 0) / (recentDays.length || 1);

        if (avgDailyMinutes > 360) burnoutRisk = "High"; // > 6 hours average
        else if (avgDailyMinutes > 240) burnoutRisk = "Medium"; // > 4 hours average

        // 4. Weekly Reflection (Last 7 Days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);

        const weekSessions = sessions.filter(s => new Date(s.startTime) >= oneWeekAgo);
        const weekHours = weekSessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0) / 60;
        const weekPostponements = logs.filter(l => l.type === 'task_delay' && new Date(l.timestamp) >= oneWeekAgo).length;

        const reflection = {
            totalHours: weekHours.toFixed(1),
            sessionsCompleted: weekSessions.length,
            postponements: weekPostponements,
            message: weekHours > 10
                ? "Great specific work this week! You maintained strong focus."
                : weekHours > 5
                    ? "Good effort. Try to increase your consistency next week."
                    : "A light week. Let's try to get back on track!",
            burnoutRisk
        };

        return NextResponse.json({
            postponements,
            postponementTrend,
            peakHour,
            burnoutRisk,
            reflection,
            dailyLoad // Return raw data for charts
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ message: "Error fetching analytics" }, { status: 500 });
    }
}
