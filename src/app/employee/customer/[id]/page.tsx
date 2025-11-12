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

  // Query 2: Get this customer's details (for their name/email)
  // (See note below about 'customerById')
  const { data: customer, isLoading: isLoadingCustomer } =
    trpc.customerById.useQuery({
      id: id,
    });

  // Show loading state if *either* query is fetching
  if (isLoadingVisits || isLoadingCustomer) {
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
        {/* Use the customer's name in the title */}
        <h1 className="text-2xl font-semibold mb-6 text-center pt-6">
          Visit History for {customer?.name ?? "Customer"}
        </h1>

        {/* Use Card components for visits */}
        <div className="space-y-4">
          {visits?.map((v) => (
            <Card key={v.id} className="shadow-xl">
              <CardHeader>
                <CardDescription>
                  {new Intl.DateTimeFormat("en-CA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(v.date))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{v.note}</p>
                {v.photoUrl && (
                  <a
                    href={v.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden"
                  >
                    <img
                      src={v.photoUrl.replace(
                        "/upload/",
                        "/upload/w_400,c_fill/"
                      )}
                      alt="Visit photo"
                      className="w-full h-auto object-cover"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add a nice 'empty' state */}
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
      </main>
    </div>
  );
}
