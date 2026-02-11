import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// GET existing profile data
export async function GET() {
  await connectDB();

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = verifyToken(token); // { id: userId }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await User.findById(decoded.id).select(
    "name rollNumber course semester courses"
  );

  return NextResponse.json(user);
}

// POST update profile data
export async function POST(req) {
  try {
    await connectDB();

    // get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // decode JWT to get user id
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const body = await req.json();
    console.log("Profile Update Payload:", body); // DEBUG LOG
    const { name, rollNumber, course, semester, courses } = body;

    // update user including courses array
    await User.findByIdAndUpdate(userId, {
      name,
      rollNumber,
      course,
      semester,
      courses, // 🔥 this is what actually saves courses to MongoDB
    });

    return NextResponse.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
