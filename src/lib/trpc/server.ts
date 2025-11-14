import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import type { Context } from "./context";
import bcrypt from "bcryptjs";

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
  // fetch visits for the current user
  getVisits: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const userId = ctx.session.user.id; // ← now definitely defined
    return ctx.prisma.visit.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: {
        feedback: true,
        photos: true,
      },
    });
  }),

  listCustomers: employeeProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, email: true, name: true, address: true },
    })
  ),

  visitsByCustomer: employeeProcedure
    .input(z.object({ customerId: z.string() }))
    .query(({ input, ctx }) =>
      ctx.prisma.visit.findMany({
        where: { userId: input.customerId },
        orderBy: { date: "desc" },
        include: {
          feedback: true,
          photos: true,
        },
      })
    ),

  customerById: employeeProcedure
    .input(z.object({ id: z.string() })) // It takes a single 'id' string
    .query(({ input, ctx }) =>
      ctx.prisma.user.findUnique({
        where: { id: input.id, role: "CUSTOMER" }, // Find by ID and ensure they're a customer
        select: { id: true, email: true, name: true, address: true }, // Only return the data we need
      })
    ),

  createVisit: employeeProcedure
    .input(
      z.object({
        customerId: z.string().cuid(), // the user.id of the customer
        note: z.string().min(2, "Write something"),
        photoUrls: z.array(z.string().url()).optional(),
        date: z.date().optional(), // defaults to Now if omitted
      })
    )
    .mutation(({ input, ctx }) =>
      // MODIFIED: Use a nested write to create the visit and photos together
      ctx.prisma.visit.create({
        data: {
          userId: input.customerId,
          note: input.note,
          date: input.date ?? new Date(),
          signedBy: ctx.session.user.name ?? "Employee",
          // This block creates all the related photos
          photos: input.photoUrls
            ? {
                createMany: {
                  data: input.photoUrls.map((url) => ({ url })),
                },
              }
            : undefined,
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
          user: { select: { email: true, name: true, address: true } }, // to show whose lawn
          feedback: true,
          photos: true,
        },
        orderBy: { date: "desc" },
      })
    ),

  createCustomer: employeeProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name is too short"),
        email: z.string().email("Invalid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["CUSTOMER", "EMPLOYEE"]),
        address: z.string().min(5, "Address is too short"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Check if user already exists (unchanged)
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists.",
        });
      }

      // 2. Hash the password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 3. Create the new user
      const newUser = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          address: input.address,
        },
      });

      return newUser;
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        visitId: z.string().cuid(),
        feedback: z.string().min(3, "Feedback is too short"),
        photoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Security Check: Does this visit exist and belong to the user?
      const visit = await ctx.prisma.visit.findFirst({
        where: {
          id: input.visitId,
          userId: ctx.session.user.id,
        },
        select: { id: true }, // We only need the ID
      });

      if (!visit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // 2. Create the new feedback.
      // Prisma's `@unique` constraint on visitId will
      // automatically throw an error if feedback already exists.
      return ctx.prisma.feedback.create({
        data: {
          text: input.feedback,
          visitId: input.visitId,
          photoUrl: input.photoUrl ?? null,
        },
      });
    }),

  getRecentFeedbacks: employeeProcedure.query(({ ctx }) => {
    return ctx.prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc", // Sort by when feedback was submitted!
      },
      take: 10,
      include: {
        visit: {
          // We need the visit to get the user, visit date, and userId
          include: {
            user: {
              select: { name: true, address: true }, // Who said it
            },
          },
        },
      },
    });
  }),

  // Customer creates a request
  createRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3, "Title is too short"),
        description: z.string().min(5, "Description is too short"),
        photoUrl: z.string().url().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      return ctx.prisma.request.create({
        data: {
          title: input.title,
          description: input.description,
          photoUrl: input.photoUrl ?? null,
          userId: ctx.session.user.id, // Link to the logged-in customer
        },
      });
    }),

  // Customer gets their own requests
  getRequests: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.request.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Employee gets requests for a specific customer
  getRequestsByCustomer: employeeProcedure
    .input(z.object({ customerId: z.string() }))
    .query(({ input, ctx }) =>
      ctx.prisma.request.findMany({
        where: { userId: input.customerId },
        orderBy: { createdAt: "desc" },
      })
    ),

  // Employee gets all recent requests for the dashboard
  getRecentRequests: employeeProcedure.query(({ ctx }) => {
    return ctx.prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, address: true }, // Need user for the link and name
        },
      },
    });
  }),

  resolveRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().cuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx.session;

      // 1. Find the request
      const request = await ctx.prisma.request.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // 2. Check permissions
      // Allow if:
      // a) The user is an EMPLOYEE
      // b) The user is the CUSTOMER who created the request
      if (user.role !== "EMPLOYEE" && request.userId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // 3. Mark as resolved
      return ctx.prisma.request.update({
        where: { id: input.requestId },
        data: {
          resolvedBy: user.name ?? "User",
        },
      });
    }),
});
export type AppRouter = typeof appRouter;
