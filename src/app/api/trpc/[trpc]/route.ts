import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/server"; // your root router
import { createContext } from "@/lib/trpc/context";

export const runtime = "nodejs"; // optional; remove if you don’t need it

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
