import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export async function createContext() {
  const session = await getServerSession(authOptions);
  return { prisma, session };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
