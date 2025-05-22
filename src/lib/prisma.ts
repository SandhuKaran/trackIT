// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Avoid creating a new client on every hot-reload in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    // log: ["query"],            // uncomment while debugging
    // errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
