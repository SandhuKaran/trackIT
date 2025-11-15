"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Search, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Import all our shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const router = useRouter();
  // 👇 These tRPC queries work because of `staffProcedure`
  const { data: customers, isLoading: isLoadingCustomers } =
    trpc.listCustomers.useQuery();
  const { data: feedbacks, isLoading: isLoadingFeedbacks } =
    trpc.getRecentFeedbacks.useQuery();
  const { data: requests, isLoading: isLoadingRequests } =
    trpc.getRecentRequests.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, startTransition] = useTransition();
  const utils = trpc.useUtils();

  const resolveRequest = trpc.resolveRequest.useMutation({
    onSuccess: () => {
      startTransition(() => {
        utils.getRecentRequests.invalidate();
        router.refresh();
      });
    },
  });

  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingCustomers || isLoadingFeedbacks || isLoadingRequests) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isResolving = resolveRequest.isPending || isRefreshing;

  return (
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        <h1 className="text-2xl font-semibold text-center pt-6 mb-6">
          Admin Dashboard {/* 👈 UPDATED title */}
        </h1>

        {/* --- Action Buttons (Remain outside tabs) --- */}
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <Link href="/admin/add">+ Add New Visit</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/date">View by Date</Link>
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
              {/* 👇 THIS BLOCK IS KEPT FOR ADMINS */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Customers</h2>
                <Button asChild size="sm">
                  <Link href="/admin/add-customer">+ Add User</Link>
                </Button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by name, email, or address..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Customer List */}
              <div className="space-y-4">
                {filteredCustomers?.map((c) => (
                  <Card key={c.id} className="shadow-xl">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-gray-400">
                          {c.address}
                        </span>
                        <span className="text-sm text-gray-400">{c.email}</span>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/customer/${c.id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}

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
            <div className="space-y-8 mt-4">
              {feedbacks?.map((fb) => (
                <Link
                  // 👈 UPDATED Link
                  href={`/admin/customer/${fb.visit.userId}`}
                  key={fb.id}
                  className="block"
                >
                  <Card className="shadow-xl hover:bg-gray-900 transition-colors">
                    <CardContent className="p-4">
                      {/* ... (rest of feedback card is identical) ... */}
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
                          - {fb.visit.user.name}{" "}
                          <span className="text-gray-400 font-normal">
                            ({fb.visit.user.address})
                          </span>
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
              {/* ... (empty state) ... */}
            </div>
          </TabsContent>

          {/* --- TAB 3: REQUESTS --- */}
          <TabsContent value="requests">
            <div className="space-y-8 mt-4">
              {requests?.map((req) => (
                <Card
                  key={req.id}
                  className="shadow-xl hover:bg-gray-900 transition-colors"
                >
                  <CardContent className="p-4">
                    <Link
                      // 👈 UPDATED Link
                      href={`/admin/customer/${req.user.id}`}
                      className="block"
                    >
                      {/* ... (rest of request card is identical) ... */}
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
                          - {req.user.name}{" "}
                          <span className="text-gray-400 font-normal">
                            ({req.user.address})
                          </span>
                        </span>
                        <span className="text-gray-400">
                          {new Intl.DateTimeFormat("en-CA", {
                            dateStyle: "medium",
                          }).format(new Date(req.createdAt))}
                        </span>
                      </div>
                    </Link>

                    <div className="pt-3 mt-3 border-t border-gray-700">
                      {/* ... (resolve logic is identical) ... */}
                      {req.resolvedBy ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Resolved by {req.resolvedBy}
                          </span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            resolveRequest.mutate({ requestId: req.id })
                          }
                          disabled={isResolving}
                        >
                          {isResolving && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Mark as resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* ... (empty state) ... */}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
