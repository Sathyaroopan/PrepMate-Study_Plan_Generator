import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import ProtectedShell from "@/components/ProtectedShell";

export default async function ProtectedLayout({ children }) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token");
  const token = tokenCookie?.value;

  if (!token) {
    redirect("/login");
  }

  let userName = "Student";

  try {
    const decoded = verifyToken(token);
    userName = decoded.name || decoded.rollNumber || "Student";
  } catch (err) {
    redirect("/login");
  }

  return <ProtectedShell userName={userName}>{children}</ProtectedShell>;
}

