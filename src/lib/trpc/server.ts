import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";
import { TRPCError } from "@trpc/server";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  // 🟢 NEW: fetch visits for the current user
  getVisits: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const userId = ctx.session.user.id; // ← now definitely defined
    return ctx.prisma.visit.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  }),

  // you’ll add more procedures (createVisit, listCustomers…) later
});
export type AppRouter = typeof appRouter;
