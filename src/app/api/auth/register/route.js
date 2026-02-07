import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await User.create({
      ...body,
      password: hashedPassword,
    });

    const token = signToken({
      id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
    });

    const response = NextResponse.json({ message: "Registered" });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "User with this particular Roll Number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
