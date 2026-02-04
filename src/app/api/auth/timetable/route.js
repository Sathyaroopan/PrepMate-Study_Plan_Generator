import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import Timetable from "@/models/Timetable";

// Default slots configuration
const DEFAULT_SLOTS = [
  { id: 1, startTime: "09:00", endTime: "10:00", isBreak: false },
  { id: 2, startTime: "10:00", endTime: "11:00", isBreak: false },
  { id: 3, startTime: "11:00", endTime: "11:15", isBreak: true },
  { id: 4, startTime: "11:15", endTime: "12:15", isBreak: false },
  { id: 5, startTime: "12:15", endTime: "13:00", isBreak: true },
  { id: 6, startTime: "13:00", endTime: "14:00", isBreak: false },
  { id: 7, startTime: "14:00", endTime: "15:00", isBreak: false },
];

// POST: Save or update timetable and slots
export async function POST(req) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    const userId = decoded.id;

    const { slots, timetable } = await req.json();

    // upsert timetable and slots for the user
    await Timetable.findOneAndUpdate(
      { userId },
      {
        slots: slots || DEFAULT_SLOTS,
        timetable: timetable || {}
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Timetable saved" });
  } catch (err) {
    console.error("Error saving timetable:", err);
    return NextResponse.json({ error: "Failed to save timetable" }, { status: 500 });
  }
}

// GET: Get timetable and slots for the logged-in user
export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    const userId = decoded.id;

    const timetableDoc = await Timetable.findOne({ userId });

    return NextResponse.json({
      slots: timetableDoc?.slots || DEFAULT_SLOTS,
      timetable: timetableDoc?.timetable || {}
    });
  } catch (err) {
    console.error("Error fetching timetable:", err);
    return NextResponse.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}
