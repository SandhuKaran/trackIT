import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";

export async function smartRedirect() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role === "EMPLOYEE") {
    console.log("Did go in the if statement");
    redirect("/employee/dashboard");
  }
  console.log("Did not go in the if statement");
  redirect("/timeline");
}
