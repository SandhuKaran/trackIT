import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { createContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/server";
import Link from "next/link";

// Import Card components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VisitCard } from "@/components/ui/VisitCard";
import { RequestCard } from "@/components/ui/RequestCard";

export default async function Timeline() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const visits = await caller.getVisits();
  const requests = await caller.getRequests();

  return (
    // Wrapper div to match the dark theme from login
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        {/* Styled the title to be more prominent */}
        <h1 className="text-2xl font-semibold mb-6 text-center pt-6">
          Your Account
        </h1>
        {/* --- NEW REQUESTS SECTION --- */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Requests</h2>
            <Button asChild size="sm">
              <Link href="/request/add">+ Add Request</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-400 mb-4 -mt-3">
            Request something for a future visit.
          </p>

          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
            {requests.length === 0 && (
              <Card>
                <CardContent>
                  <p className="pt-6 text-center text-gray-400">
                    You have no active requests.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* --- VISITS SECTION --- */}
        <h2 className="text-xl font-semibold mb-4">Your Visit History</h2>
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
