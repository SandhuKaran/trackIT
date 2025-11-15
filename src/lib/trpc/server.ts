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
  return next({
    ctx: {
      ...ctx,
      // We're telling TypeScript that for all downstream middleware and resolvers,
      // session and session.user are guaranteed to be non-null.
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/* Staff guard (Employee OR Admin) layered on top */
const isStaff = t.middleware(({ ctx, next }) => {
  if (
    ctx.session?.user.role !== "EMPLOYEE" &&
    ctx.session?.user.role !== "ADMIN"
  ) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const staffProcedure = protectedProcedure.use(isStaff);

const isAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.session?.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(isAdmin);

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

  listCustomers: staffProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, email: true, name: true, address: true },
    })
  ),

  visitsByCustomer: staffProcedure
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

  customerById: staffProcedure
    .input(z.object({ id: z.string() })) // It takes a single 'id' string
    .query(({ input, ctx }) =>
      ctx.prisma.user.findUnique({
        where: { id: input.id, role: "CUSTOMER" }, // Find by ID and ensure they're a customer
        select: { id: true, email: true, name: true, address: true }, // Only return the data we need
      })
    ),

  getVisitById: adminProcedure
    .input(z.object({ visitId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const visit = await ctx.prisma.visit.findUnique({
        where: { id: input.visitId },
        include: {
          photos: true,
          // We include the user to display their name
          user: {
            select: { name: true, id: true },
          },
        },
      });

      if (!visit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Visit not found.",
        });
      }
      return visit;
    }),

  createVisit: staffProcedure
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
          signedBy: ctx.session?.user?.name ?? "Staff",
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

  updateVisit: adminProcedure
    .input(
      z.object({
        visitId: z.string().cuid(),
        note: z.string().min(2, "Write something"),
        newPhotoUrls: z.array(z.string().url()).optional(),
        photoIdsToDelete: z.array(z.string().cuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // We use a transaction to make sure all changes succeed or fail together
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Delete photos marked for deletion
        if (input.photoIdsToDelete && input.photoIdsToDelete.length > 0) {
          await tx.photo.deleteMany({
            where: {
              id: { in: input.photoIdsToDelete },
              visitId: input.visitId, // Security check
            },
          });
        }

        // 2. Add new photos
        if (input.newPhotoUrls && input.newPhotoUrls.length > 0) {
          await tx.photo.createMany({
            data: input.newPhotoUrls.map((url) => ({
              url,
              visitId: input.visitId,
            })),
          });
        }

        // 3. Update the visit's note and who signed it
        const updatedVisit = await tx.visit.update({
          where: { id: input.visitId },
          data: {
            note: input.note,
            // Update the signature to show it was edited
            signedBy: `${ctx.session.user.name} (Edited)`,
          },
        });

        return updatedVisit;
      });
    }),

  deleteVisit: adminProcedure
    .input(z.object({ visitId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Use a transaction to ensure all related data is deleted
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Delete related feedback (one-to-one)
        await tx.feedback.deleteMany({
          where: { visitId: input.visitId },
        });

        // 2. Delete related photos (one-to-many)
        await tx.photo.deleteMany({
          where: { visitId: input.visitId },
        });

        // 3. Delete the visit itself
        await tx.visit.delete({
          where: { id: input.visitId },
        });

        return { success: true };
      });
    }),

  visitsByDate: staffProcedure
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

  // Gets all users for the admin edit-user dropdown
  listAllUsers: adminProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        address: true,
        role: true,
      },
    })
  ),

  createCustomer: adminProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name is too short"),
        email: z.string().email("Invalid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["CUSTOMER", "EMPLOYEE", "ADMIN"]),
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

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        name: z.string().min(2, "Name is too short"),
        email: z.string().email("Invalid email"),
        role: z.enum(["CUSTOMER", "EMPLOYEE", "ADMIN"]),
        address: z.string().min(5, "Address is too short"),
        // Password is optional. If not provided, it won't be updated.
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Check for email conflict
      // See if a *different* user already has this email
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser && existingUser.id !== input.userId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists.",
        });
      }

      // 2. Hash password *if* it was provided
      let hashedPassword: string | undefined = undefined;
      if (input.password) {
        hashedPassword = await bcrypt.hash(input.password, 10);
      }

      // 3. Update the user
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          name: input.name,
          email: input.email,
          address: input.address,
          role: input.role,
          // This will only update the password if hashedPassword is not undefined
          password: hashedPassword,
        },
      });

      return updatedUser;
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

  getRecentFeedbacks: staffProcedure.query(({ ctx }) => {
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
  getRequestsByCustomer: staffProcedure
    .input(z.object({ customerId: z.string() }))
    .query(({ input, ctx }) =>
      ctx.prisma.request.findMany({
        where: { userId: input.customerId },
        orderBy: { createdAt: "desc" },
      })
    ),

  // Employee gets all recent requests for the dashboard
  getRecentRequests: staffProcedure.query(({ ctx }) => {
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
      // a) The user is an EMPLOYEE or ADMIN (i.e., not a CUSTOMER)
      // b) The user is the CUSTOMER who created the request
      if (user.role === "CUSTOMER" && request.userId !== user.id) {
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
