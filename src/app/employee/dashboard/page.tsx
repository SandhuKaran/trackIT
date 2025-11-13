"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useState } from "react"; // For search
import { Loader2, Search } from "lucide-react"; // For loading and search icons

// Import all our shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// NEW: Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { data: customers, isLoading: isLoadingCustomers } =
    trpc.listCustomers.useQuery();
  const { data: feedbacks, isLoading: isLoadingFeedbacks } =
    trpc.getRecentFeedbacks.useQuery();
  const { data: requests, isLoading: isLoadingRequests } =
    trpc.getRecentRequests.useQuery();
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input

  // Filter customers based on the search term
  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styled loading state
  if (isLoadingCustomers || isLoadingFeedbacks || isLoadingRequests) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    // Dark theme wrapper
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        <h1 className="text-2xl font-semibold text-center pt-6 mb-6">
          Employee Dashboard
        </h1>

        {/* --- Action Buttons (Remain outside tabs) --- */}
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <Link href="/employee/add">+ Add New Visit</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/employee/date">View by Date</Link>
          </Button>
        </div>

        {/* --- NEW TABS WRAPPER --- */}
        <Tabs defaultValue="customers" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers">
              Customers ({filteredCustomers?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="feedback">
              Feedback ({feedbacks?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({requests?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: CUSTOMERS --- */}
          <TabsContent value="customers">
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Customers</h2>
                <Button asChild size="sm">
                  <Link href="/employee/add-customer">+ Add Customer</Link>
                </Button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-10" // Padding to make room for the icon
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Customer List */}
              <div className="space-y-3">
                {filteredCustomers?.map((c) => (
                  <Card key={c.id} className="shadow-xl">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-gray-400">{c.email}</span>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/employee/customer/${c.id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Styled "empty" state */}
                {filteredCustomers?.length === 0 && (
                  <Card>
                    <CardContent>
                      <p className="pt-6 text-center text-gray-400">
                        No customers found.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* --- TAB 2: FEEDBACK --- */}
          <TabsContent value="feedback">
            <div className="space-y-3 mt-4">
              {/* Note: The H2 "Recent Feedback" is removed as the tab provides context */}
              {feedbacks?.map((fb) => (
                <Link
                  href={`/employee/customer/${fb.visit.userId}`}
                  key={fb.id}
                  className="block"
                >
                  <Card className="shadow-xl hover:bg-gray-900 transition-colors">
                    <CardContent className="p-4">
                      <p className="italic text-gray-200">{fb.text}</p>
                      {fb.photoUrl && (
                        <img
                          src={fb.photoUrl.replace(
                            "/upload/",
                            "/upload/w_100,c_fill/"
                          )}
                          alt="Feedback photo"
                          className="w-full h-auto object-cover rounded-md mt-2"
                        />
                      )}
                      <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="font-semibold text-white">
                          - {fb.visit.user.name}
                        </span>
                        <span className="text-gray-400">
                          {new Intl.DateTimeFormat("en-CA", {
                            dateStyle: "medium",
                          }).format(new Date(fb.visit.date))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Empty state for feedback */}
              {feedbacks?.length === 0 && (
                <Card>
                  <CardContent>
                    <p className="pt-6 text-center text-gray-400">
                      No recent feedback.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* --- TAB 3: REQUESTS --- */}
          <TabsContent value="requests">
            <div className="space-y-3 mt-4">
              {/* Note: The H2 "Recent Requests" is removed */}
              {requests?.map((req) => (
                <Link
                  href={`/employee/customer/${req.user.id}`} // Link to customer
                  key={req.id}
                  className="block"
                >
                  <Card className="shadow-xl hover:bg-gray-900 transition-colors">
                    <CardContent className="p-4">
                      <p className="font-semibold text-white">{req.title}</p>
                      <p className="italic text-gray-200 truncate">
                        {req.description}
                      </p>
                      {req.photoUrl && (
                        <img
                          src={req.photoUrl.replace(
                            "/upload/",
                            "/upload/w_100,c_fill/"
                          )}
                          alt="Request photo"
                          className="w-full h-auto object-cover rounded-md mt-2"
                        />
                      )}
                      <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="font-semibold text-white">
                          - {req.user.name}
                        </span>
                        <span className="text-gray-400">
                          {new Intl.DateTimeFormat("en-CA", {
                            dateStyle: "medium",
                          }).format(new Date(req.createdAt))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {requests?.length === 0 && (
                <Card>
                  <CardContent>
                    <p className="pt-6 text-center text-gray-400">
                      No recent requests.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
