import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

/* ───────── Base helpers ───────── */
export const router = t.router;
export const publicProcedure = t.procedure;

/* 1️⃣  Session required for any protected route */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // ctx.session.user is now non-null for downstream resolvers
  return next({ ctx });
});
export const protectedProcedure = t.procedure.use(isAuthed);

/* 2️⃣  Employee-only guard layered on top */
const isEmployee = t.middleware(({ ctx, next }) => {
  if (ctx.session!.user.role !== "EMPLOYEE") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
export const employeeProcedure = protectedProcedure.use(isEmployee);

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

  listCustomers: employeeProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, email: true, name: true },
    })
  ),

  visitsByCustomer: employeeProcedure
    .input(z.object({ customerId: z.string() }))
    .query(({ input, ctx }) =>
      ctx.prisma.visit.findMany({
        where: { userId: input.customerId },
        orderBy: { date: "desc" },
      })
    ),

  customerById: employeeProcedure
    .input(z.object({ id: z.string() })) // It takes a single 'id' string
    .query(({ input, ctx }) =>
      ctx.prisma.user.findUnique({
        where: { id: input.id, role: "CUSTOMER" }, // Find by ID and ensure they're a customer
        select: { id: true, email: true, name: true }, // Only return the data we need
      })
    ),

  createVisit: employeeProcedure
    .input(
      z.object({
        customerId: z.string().cuid(), // the user.id of the customer
        note: z.string().min(2, "Write something"),
        photoUrl: z.string().url().optional(),
        date: z.date().optional(), // defaults to Now if omitted
      })
    )
    .mutation(({ input, ctx }) =>
      ctx.prisma.visit.create({
        data: {
          userId: input.customerId,
          note: input.note,
          photoUrl: input.photoUrl ?? null,
          date: input.date ?? new Date(),
        },
      })
    ),

  visitsByDate: employeeProcedure
    .input(z.object({ date: z.date() }))
    .query(({ input, ctx }) =>
      ctx.prisma.visit.findMany({
        where: {
          date: {
            gte: startOfDay(input.date),
            lt: endOfDay(input.date),
          },
        },
        include: {
          user: { select: { email: true, name: true } }, // to show whose lawn
        },
        orderBy: { date: "desc" },
      })
    ),

  // you’ll add more procedures (createVisit, listCustomers…) later
});
export type AppRouter = typeof appRouter;
