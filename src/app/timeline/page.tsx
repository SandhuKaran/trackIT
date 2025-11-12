import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { createContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/server"; // This should be src/lib/trpc/router

// Import Card components
import { Card, CardContent } from "@/components/ui/card";

import { VisitCard } from "@/components/ui/VisitCard";

export default async function Timeline() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const visits = await caller.getVisits();

  return (
    // Wrapper div to match the dark theme from login
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        {/* Styled the title to be more prominent */}
        <h1 className="text-2xl font-semibold mb-6 text-center pt-6">
          Your Visits
        </h1>

        {/* Replaced <ul> with a <div> and added more spacing */}
        <div className="space-y-4">
          {/* Render the new client component instead of the raw card */}
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}

          {visits.length === 0 && (
            <Card>
              <CardContent>
                <p className="pt-6 text-center text-gray-400">
                  You have no visits logged.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
