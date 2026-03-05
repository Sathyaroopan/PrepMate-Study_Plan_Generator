import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/planner/:path*"],
};

export function middleware(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    verifyToken(token);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}