import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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
        const sessions = await Studysession.find({ userId: decoded.id })
            .sort({ startTime: 1 })
            .populate("taskId", "title difficulty");

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching sessions" }, { status: 500 });
    }
}
