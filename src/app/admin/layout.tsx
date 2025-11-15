import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 1. Check if user is logged in
  if (!session?.user) {
    redirect("/login");
  }

  // 2. Check if user is an ADMIN
  if (session.user.role !== "ADMIN") {
    // You can redirect to their appropriate dashboard or an "unauthorized" page
    if (session.user.role === "EMPLOYEE") {
      redirect("/employee/dashboard");
    }
    redirect("/timeline"); // Default for customers or any other role
  }

  // 3. If they are an ADMIN, render the children
  return <>{children}</>;
}
