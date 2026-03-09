import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/planner/:path*"],
};

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}