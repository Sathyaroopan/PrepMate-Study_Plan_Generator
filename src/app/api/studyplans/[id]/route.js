import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import StudyPlan from "@/models/StudyPlan";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(req, { params }) {
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
    const plan = await StudyPlan.findOne({ _id: id, userId: decoded.id })
      .populate("taskIds", "title priority deadline estimatedHours");

    if (!plan) {
      return NextResponse.json({ message: "Study plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Fetch Study Plan Error:", error);
    return NextResponse.json(
      { message: "Error fetching study plan", error: error.message },
      { status: 500 }
    );
  }
}

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
    const plan = await StudyPlan.findOneAndDelete({ _id: id, userId: decoded.id });

    if (!plan) {
      return NextResponse.json({ message: "Study plan not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Study plan deleted" });
  } catch (error) {
    console.error("Delete Study Plan Error:", error);
    return NextResponse.json(
      { message: "Error deleting study plan", error: error.message },
      { status: 500 }
    );
  }
}
