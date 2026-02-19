import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import ActivityLog from "@/models/ActivityLog";

// PUT: Update a task (mark as complete, edit details)
export async function PUT(req, { params }) {
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
        const { id } = await params;
        const body = await req.json();

        // Ensure the task belongs to the user
        const task = await Task.findOne({ _id: id, userId: decoded.id });
        if (!task) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        // Update fields
        const { title, courseName, deadline, estimatedHours, priority, status } = body;

        if (title) task.title = title;

        // Check for Deadline Postponement
        if (deadline) {
            const newDeadline = new Date(deadline);
            if (task.deadline && newDeadline > task.deadline) {
                await ActivityLog.create({
                    userId: decoded.id,
                    taskId: task._id,
                    type: "task_delay",
                    timestamp: new Date()
                });
            }
            task.deadline = newDeadline;
        }

        if (estimatedHours) task.estimatedHours = estimatedHours;
        if (priority) task.priority = priority;

        if (status) {
            // Log completion if it wasn't completed before
            if (status === 'completed' && task.status !== 'completed') {
                // We can log session_completed here as a proxy, or just skip it if we only care about sessions.
                // Given the requirements ("most productive hours"), we should probably rely on actual sessions.
                // However, "reflection summary" might benefit from knowing tasks completed.
                // Let's NOT log 'session_completed' for a task, to avoid polluting the data if they didn't actually do a session (e.g. they just marked it done).
                // So I will just update the status. The delay tracking is the most important part here.
            }
            task.status = status;
        }

        // If courseName is provided, we might need to look it up or update it, 
        // but for now let's assume courseId remains unless we want to support moving tasks between courses.
        // For simplicity in this iteration, we'll skip course re-linking unless explicitly needed.

        await task.save();

        return NextResponse.json({ message: "Task updated", task }, { status: 200 });

    } catch (error) {
        console.error("Update Task Error:", error);
        return NextResponse.json({ message: "Error updating task", error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a task
export async function DELETE(req, { params }) {
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
        const { id } = await params;

        const task = await Task.findOneAndDelete({ _id: id, userId: decoded.id });

        if (!task) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Task deleted" }, { status: 200 });

    } catch (error) {
        console.error("Delete Task Error:", error);
        return NextResponse.json({ message: "Error deleting task", error: error.message }, { status: 500 });
    }
}
