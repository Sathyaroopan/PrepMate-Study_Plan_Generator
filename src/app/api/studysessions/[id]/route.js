import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Studysession from "@/models/Studysession";
import ActivityLog from "@/models/ActivityLog";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

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

        const session = await Studysession.findOne({ _id: id, userId: decoded.id });
        if (!session) {
            return NextResponse.json({ message: "Session not found" }, { status: 404 });
        }

        const { completed, actualDuration } = body;

        if (completed !== undefined) {
            // If marking as completed, log it
            if (completed && !session.completed) {
                await ActivityLog.create({
                    userId: decoded.id,
                    taskId: session.taskId, // Can be null if generic session
                    type: "session_completed",
                    timestamp: new Date()
                });
            }
            session.completed = completed;
        }

        if (actualDuration !== undefined) session.actualDuration = actualDuration;

        await session.save();

        return NextResponse.json({ message: "Session updated", session }, { status: 200 });

    } catch (error) {
        console.error("Update Session Error:", error);
        return NextResponse.json({ message: "Error updating session", error: error.message }, { status: 500 });
    }
}
