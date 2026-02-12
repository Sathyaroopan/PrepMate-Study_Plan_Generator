import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Course from "@/models/Course"; // Import Course model
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

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

        const { courseName, title, deadline, estimatedHours, priority } = body;

        // Basic validation
        if (!courseName || !title || !deadline || !estimatedHours) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Reuse existing Course or create a new one to maintain the relation
        // We assume the user profile has the semester. We'll default to "Current" if not found.
        let course = await Course.findOne({ userId: decoded.id, name: courseName });
        if (!course) {
            course = await Course.create({
                userId: decoded.id,
                name: courseName,
                semester: "Current", // Placeholder as we don't have it in this payload
                credit: 3 // Default
            });
        }

        const newTask = await Task.create({
            userId: decoded.id,
            courseId: course._id,
            title,
            deadline: new Date(deadline),
            estimatedHours,
            priority: priority || "medium",
            status: "pending"
        });

        return NextResponse.json({ message: "Task created", task: newTask }, { status: 201 });

    } catch (error) {
        console.error("Create Task Error:", error);
        return NextResponse.json({ message: "Error creating task", error: error.message }, { status: 500 });
    }
}

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

        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get("status");

        let query = { userId: decoded.id };
        if (statusParam && statusParam !== "all") {
            query.status = statusParam;
        } else if (!statusParam) {
            query.status = "pending"; // Default to pending if not specified
        }

        const tasks = await Task.find(query).populate("courseId", "name");

        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
    }
}
