"use client";
import { trpc } from "@/lib/trpc/client";
import { useParams } from "next/navigation";

// Import Card components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// NEW: Import Tabs and RequestCard
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestCard } from "@/components/ui/RequestCard";

export default function CustomerTimeline() {
  const params = useParams<{ id: string }>();

  if (!params) {
    return <p className="p-4">Loading customer...</p>;
  }

  const { id } = params;

  // Query 1: Get all visits for this customer (existing)
  const { data: visits, isLoading: isLoadingVisits } =
    trpc.visitsByCustomer.useQuery({
      customerId: id,
    });

  // Query 2: Get this customer's details (existing)
  const { data: customer, isLoading: isLoadingCustomer } =
    trpc.customerById.useQuery({
      id: id,
    });

  // Query 3: Get requests (NEW)
  const { data: requests, isLoading: isLoadingRequests } =
    trpc.getRequestsByCustomer.useQuery({
      customerId: id,
    });

  // MODIFIED: Show loading state if *any* query is fetching
  if (isLoadingVisits || isLoadingCustomer || isLoadingRequests) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    // Apply dark theme wrapper
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        {/* MODIFIED: Updated header to show name and email */}
        <h1 className="text-2xl font-semibold mb-2 text-center pt-6">
          {customer?.name ?? "Customer"}
        </h1>
        <p className="text-center text-gray-400 mb-6">{customer?.email}</p>

        {/* --- NEW TABS WRAPPER --- */}
        <Tabs defaultValue="visits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visits">
              Visits ({visits?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({requests?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* --- VISITS TAB CONTENT (Original Code) --- */}
          <TabsContent value="visits">
            <div className="space-y-8 mt-4">
              {visits?.map((v) => (
                <Card key={v.id} className="shadow-xl">
                  <CardHeader>
                    <CardDescription>
                      {new Intl.DateTimeFormat("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(v.date))}
                    </CardDescription>
                    {v.signedBy && (
                      <p className="text-xs text-gray-400 pt-1">
                        Signed by: {v.signedBy}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap">{v.note}</p>
                    {v.photos && v.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {v.photos.map((photo) => (
                          <a
                            key={photo.id}
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-md overflow-hidden"
                          >
                            <img
                              src={photo.url.replace(
                                "/upload/",
                                "/upload/w_400,c_fill/"
                              )}
                              alt="Visit photo"
                              className="w-full h-auto object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {v.feedback && (
                      <div className="pt-4 border-t border-gray-700 space-y-3">
                        <p className="font-semibold text-white">
                          Customer Feedback:
                        </p>
                        <p className="text-gray-300 italic">
                          {v.feedback.text}
                        </p>
                        {/* This includes the feedback photo fix from our last feature */}
                        {v.feedback.photoUrl && (
                          <a
                            href={v.feedback.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-md overflow-hidden"
                          >
                            <img
                              src={v.feedback.photoUrl.replace(
                                "/upload/",
                                "/upload/w_400,c_fill/"
                              )}
                              alt="Feedback photo"
                              className="w-full h-auto object-cover"
                            />
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Empty state for visits */}
              {visits?.length === 0 && (
                <Card className="shadow-xl">
                  <CardContent>
                    <p className="pt-6 text-center text-gray-400">
                      No visits found for this customer.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* --- NEW REQUESTS TAB CONTENT --- */}
          <TabsContent value="requests">
            <div className="space-y-8 mt-4">
              {requests?.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}

              {/* Empty state for requests */}
              {requests?.length === 0 && (
                <Card className="shadow-xl">
                  <CardContent>
                    <p className="pt-6 text-center text-gray-400">
                      No requests found for this customer.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        {/* --- END TABS --- */}
      </main>
    </div>
  );
}
