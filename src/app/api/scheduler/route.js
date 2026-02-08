import { NextResponse } from "next/server";
import { generateStudyPlan } from "@/lib/scheduler";
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

        const body = await req.json();
        const days = body.days || 7;

        const sessions = await generateStudyPlan(decoded.id, new Date(), days);

        return NextResponse.json({
            message: "Study plan generated successfully",
            sessionsCreated: sessions.length
        });

    } catch (error) {
        console.error("Scheduler Error:", error);
        return NextResponse.json(
            { message: "Failed to generate plan", error: error.message },
            { status: 500 }
        );
    }
}
