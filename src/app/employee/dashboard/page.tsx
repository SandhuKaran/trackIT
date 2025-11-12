"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useState } from "react"; // For search
import { Loader2, Search } from "lucide-react"; // For loading and search icons

// Import all our shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: customers, isLoading: isLoadingCustomers } =
    trpc.listCustomers.useQuery();
  const { data: feedbacks, isLoading: isLoadingFeedbacks } =
    trpc.getRecentFeedbacks.useQuery();
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input

  // Filter customers based on the search term
  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styled loading state
  if (isLoadingCustomers || isLoadingFeedbacks) {
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

        {/* --- Action Buttons --- */}
        {/* We group the main actions at the top */}
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <Link href="/employee/add">+ Add New Visit</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/employee/date">View by Date</Link>
          </Button>
        </div>

        {/* --- Customer List & Search --- */}
        <div className="mt-8">
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
                {/* We use p-4 for a tighter, list-item feel */}
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
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Feedback</h2>
          </div>
          <div className="space-y-3">
            {/* We map over the new `feedbacks` data */}
            {feedbacks?.map((fb) => (
              // 👇 FIX 2: The link must now use the NESTED visit.userId
              <Link
                href={`/employee/customer/${fb.visit.userId}`}
                key={fb.id} // 👈 Use the feedback's ID for the key
                className="block"
              >
                <Card className="shadow-xl hover:bg-gray-900 transition-colors">
                  <CardContent className="p-4">
                    {/* 👇 FIX 3: The feedback text is directly on the object */}
                    <p className="italic text-gray-200">{fb.text}</p>
                    <div className="flex justify-between items-center mt-3 text-sm">
                      {/* 👇 FIX 4: The user name is NESTED */}
                      <span className="font-semibold text-white">
                        - {fb.visit.user.name}
                      </span>
                      {/* 👇 FIX 5: The visit date is NESTED */}
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
        </div>
      </main>
    </div>
  );
}
