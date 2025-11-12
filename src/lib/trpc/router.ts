import { publicProcedure, router } from "./server";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
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
});
export type AppRouter = typeof appRouter;
