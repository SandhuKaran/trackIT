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

// NEW: Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function Timeline() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  // Data fetching is unchanged
  const visits = await caller.getVisits();
  const requests = await caller.getRequests();

  return (
    // Wrapper div (unchanged)
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        {/* Title (unchanged) */}
        <h1 className="text-2xl font-semibold mb-6 text-center pt-6">
          Your Account
        </h1>

        {/* --- NEW TABS WRAPPER --- */}
        <Tabs defaultValue="visits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visits">
              Visit History ({visits.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({requests.length})
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: VISITS --- */}
          <TabsContent value="visits">
            <div className="mt-6">
              {/* This is your original VISITS SECTION */}
              <h2 className="text-xl font-semibold mb-4">Your Visit History</h2>
              <div className="space-y-8">
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
            </div>
          </TabsContent>

          {/* --- TAB 2: REQUESTS --- */}
          <TabsContent value="requests">
            <div className="mt-6">
              {/* This is your original REQUESTS SECTION */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Requests</h2>
                <Button asChild size="sm">
                  <Link href="/request/add">+ Add Request</Link>
                </Button>
              </div>
              <p className="text-sm text-gray-400 mb-4 -mt-3">
                Request something for a future visit.
              </p>

              <div className="space-y-8">
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
          </TabsContent>
        </Tabs>
        {/* --- END OF TABS WRAPPER --- */}
      </main>
    </div>
  );
}
