import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";

export async function smartRedirect() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("/employee/dashboard");
  }

  redirect("/timeline");
}
