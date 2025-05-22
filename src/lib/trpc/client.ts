"use client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/lib/trpc/server";

export const trpc = createTRPCReact<AppRouter>();
