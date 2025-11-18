"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { Loader2, Search, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Import all our shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const RedDot = () => (
  <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
);

// Define the shape of our stored counts
interface ViewedCounts {
  feedback: number;
  requests: number;
}

// Key for localStorage
const VIEWED_COUNTS_KEY = "trackit-viewed-counts";

export default function Dashboard() {
  const router = useRouter();
  const { data: customers, isLoading: isLoadingCustomers } =
    trpc.listCustomers.useQuery();
  const { data: employees, isLoading: isLoadingEmployees } =
    trpc.listEmployees.useQuery();
  const { data: feedbacks, isLoading: isLoadingFeedbacks } =
    trpc.getRecentFeedbacks.useQuery();
  const { data: requests, isLoading: isLoadingRequests } =
    trpc.getRecentRequests.useQuery();

  const { data: dbCounts, isLoading: isLoadingCounts } =
    trpc.getNotificationCounts.useQuery(undefined, {
      refetchInterval: 60000,
    });

  const [lastViewedCounts, setLastViewedCounts] = useState<ViewedCounts>(() => {
    // This function runs only on the client, on first load
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(VIEWED_COUNTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return { feedback: 0, requests: 0 };
  });

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [isRefreshing, startTransition] = useTransition();
  const utils = trpc.useUtils();

  useEffect(() => {
    localStorage.setItem(VIEWED_COUNTS_KEY, JSON.stringify(lastViewedCounts));
  }, [lastViewedCounts]);

  // Calculate if new items exist
  const newFeedbackCount = dbCounts
    ? dbCounts.feedbackCount - lastViewedCounts.feedback
    : 0;
  const newRequestCount = dbCounts
    ? dbCounts.requestCount - lastViewedCounts.requests
    : 0;

  const resolveRequest = trpc.resolveRequest.useMutation({
    onSuccess: () => {
      startTransition(() => {
        utils.getRecentRequests.invalidate();
        utils.getNotificationCounts.invalidate();
        // Update lastViewedCounts when resolving
        setLastViewedCounts((prev) => ({
          ...prev,
          requests: prev.requests > 0 ? prev.requests - 1 : 0,
        }));
        router.refresh();
      });
    },
  });

  const toggleRecognized = trpc.toggleFeedbackRecognized.useMutation({
    onSuccess: (updatedFeedback) => {
      utils.getRecentFeedbacks.invalidate();
      utils.getNotificationCounts.invalidate();
      // Update lastViewedCounts when recognizing
      setLastViewedCounts((prev) => {
        const adjustment = updatedFeedback.recognized ? -1 : 1;
        return {
          ...prev,
          feedback: Math.max(0, prev.feedback + adjustment),
        };
      });
    },
  });

  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const filteredEmployees = employees?.filter(
    (e) =>
      e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      e.address?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  if (
    isLoadingCustomers ||
    isLoadingEmployees ||
    isLoadingFeedbacks ||
    isLoadingRequests ||
    isLoadingCounts
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isResolving = resolveRequest.isPending || isRefreshing;

  const handleTabChange = (tabValue: string) => {
    if (tabValue === "feedback" && dbCounts) {
      setLastViewedCounts((prev) => ({
        ...prev,
        feedback: dbCounts.feedbackCount,
      }));
    } else if (tabValue === "requests" && dbCounts) {
      setLastViewedCounts((prev) => ({
        ...prev,
        requests: dbCounts.requestCount,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        <h1 className="text-2xl font-semibold text-center pt-6 mb-6">
          Admin Dashboard
        </h1>

        {/* --- Action Buttons --- */}
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <Link href="/admin/add">+ Add New Visit</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/date">View by Date</Link>
          </Button>
        </div>

        {/* --- TABS WRAPPER --- */}
        <Tabs
          defaultValue="customers"
          className="w-full mt-8"
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customers">
              Customers ({filteredCustomers?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="employees">
              Employees ({filteredEmployees?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="relative">
              Feedback ({feedbacks?.length ?? 0})
              {newFeedbackCount > 0 && <RedDot />}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests ({requests?.length ?? 0})
              {newRequestCount > 0 && <RedDot />}
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: CUSTOMERS --- */}
          <TabsContent value="customers">
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Customers</h2>
                {/* Wrapper for the buttons */}
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/edit-user">Edit User</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/admin/add-customer">+ Add User</Link>
                  </Button>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by name, email, or address..."
                  className="pl-10"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
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

          <TabsContent value="employees">
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Employees</h2>
              </div>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={employeeSearchTerm} // 👈 USE EMPLOYEE STATE
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                />
              </div>

              {/* Employee List */}
              <div className="space-y-4">
                {filteredEmployees?.map((e) => (
                  <Card key={e.id} className="shadow-xl">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{e.name}</span>
                        <span className="text-sm text-gray-400">
                          {e.address}
                        </span>
                        <span className="text-sm text-gray-400">{e.email}</span>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/employee/${e.id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {filteredEmployees?.length === 0 && (
                  <Card>
                    <CardContent>
                      <p className="pt-6 text-center text-gray-400">
                        No employees found.
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
                <div key={fb.id}>
                  {/* The Link still wraps the entire card */}
                  <Link
                    href={`/admin/customer/${fb.visit.userId}`}
                    className="block"
                  >
                    <Card
                      className={cn(
                        "shadow-xl hover:bg-gray-900 transition-colors",
                        fb.recognized && "opacity-60" // "Dull" effect
                      )}
                    >
                      <CardContent className="p-4 relative">
                        <div
                          className="absolute top-4 right-4 flex items-center space-x-2 z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Checkbox
                            id={`rec-${fb.id}`}
                            checked={fb.recognized}
                            disabled={toggleRecognized.isPending}
                            onCheckedChange={(checked) => {
                              toggleRecognized.mutate({
                                feedbackId: fb.id,
                                recognized: !!checked, // Convert to boolean
                              });
                            }}
                          />
                          <Label
                            htmlFor={`rec-${fb.id}`}
                            className="text-sm text-gray-300"
                          >
                            Recognized
                          </Label>
                        </div>
                        {/* --- END CHECKBOX --- */}

                        {/* --- Card Content --- */}
                        {/* Added top padding to make space for the checkbox */}
                        <p className="italic text-gray-200 pt-8">{fb.text}</p>
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
                        <div className="mt-4 pt-3 border-t border-gray-700">
                          <span className="font-semibold text-white text-sm">
                            - {fb.visit.user.name}{" "}
                            <span className="text-gray-400 font-normal">
                              ({fb.visit.user.address})
                            </span>
                          </span>
                        </div>
                        <div className="mt-2 flex flex-col text-xs text-gray-400">
                          <span>
                            Submitted:{" "}
                            {new Intl.DateTimeFormat("en-CA", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(fb.createdAt))}
                          </span>
                          <span className="mt-1">
                            Visited:{" "}
                            {new Intl.DateTimeFormat("en-CA", {
                              dateStyle: "medium",
                            }).format(new Date(fb.visit.date))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {/* The checkbox div was MOVED from here to inside the card */}
                </div>
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
            <div className="space-y-8 mt-4">
              {requests?.map((req) => (
                <Card
                  key={req.id}
                  className="shadow-xl hover:bg-gray-900 transition-colors"
                >
                  <CardContent className="p-4">
                    <Link
                      href={`/admin/customer/${req.user.id}`}
                      className="block"
                    >
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
                      <div className="mt-3 text-sm">
                        <span className="font-semibold text-white">
                          - {req.user.name}{" "}
                          <span className="text-gray-400 font-normal">
                            ({req.user.address})
                          </span>
                        </span>
                      </div>
                    </Link>

                    <div className="pt-3 mt-3 border-t border-gray-700">
                      <div className="flex text-xs text-gray-400 mb-3">
                        <span>
                          Requested:{" "}
                          {new Intl.DateTimeFormat("en-CA", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(req.createdAt))}
                        </span>
                      </div>
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
