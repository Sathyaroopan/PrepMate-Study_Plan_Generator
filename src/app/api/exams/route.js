import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/models/Exam";
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

        const { courseName, examDate, syllabusWeight } = body;

        if (!courseName || !examDate || !syllabusWeight) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Reuse or create Course
        let course = await Course.findOne({ userId: decoded.id, name: courseName });
        if (!course) {
            course = await Course.create({
                userId: decoded.id,
                name: courseName,
                semester: "Current",
                credit: 3
            });
        }

        const newExam = await Exam.create({
            userId: decoded.id,
            courseId: course._id,
            examDate: new Date(examDate),
            syllabusWeight
        });

        return NextResponse.json({ message: "Exam created", exam: newExam }, { status: 201 });

    } catch (error) {
        console.error("Create Exam Error:", error);
        return NextResponse.json({ message: "Error creating exam", error: error.message }, { status: 500 });
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
        const exams = await Exam.find({ userId: decoded.id, examDate: { $gte: new Date() } }).populate("courseId", "name");

        return NextResponse.json(exams);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching exams" }, { status: 500 });
    }
}
