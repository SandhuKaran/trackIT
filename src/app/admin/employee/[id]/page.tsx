"use client";
import { trpc } from "@/lib/trpc/client";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmployeeTimeline() {
  const params = useParams<{ id: string }>();

  if (!params) {
    return <p className="p-4">Loading employee...</p>;
  }

  const { id } = params;

  // Get all visits for this employee
  const { data: visits, isLoading: isLoadingVisits } =
    trpc.visitsByEmployee.useQuery({
      employeeId: id,
    });

  // Get this employee's details
  const { data: employee, isLoading: isLoadingEmployee } =
    trpc.employeeById.useQuery({
      id: id,
    });

  // Show loading state
  if (isLoadingVisits || isLoadingEmployee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        {/* Employee Header */}
        <h1 className="text-2xl font-semibold mb-2 text-center pt-6">
          {employee?.name ?? "Employee"}
        </h1>
        <p className="text-center text-gray-400 mb-1">{employee?.address}</p>
        <p className="text-center text-gray-400 mb-6">{employee?.email}</p>

        {/* --- TABS WRAPPER (Only one tab) --- */}
        <Tabs defaultValue="visits" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="visits">
              Signed Visits ({visits?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* --- VISITS TAB CONTENT --- */}
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
                    {/* Show who the visit was FOR (the customer) */}
                    {v.user && (
                      <p className="text-sm text-gray-300 pt-1 font-semibold">
                        For: {v.user.name}{" "}
                        <span className="text-gray-400 font-normal">
                          ({v.user.address})
                        </span>
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
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-white">
                            Customer Feedback:
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Intl.DateTimeFormat("en-CA", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(v.feedback.createdAt))}
                          </p>
                        </div>
                        <p className="text-gray-300 italic">
                          {v.feedback.text}
                        </p>
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
                      No visits found signed by this employee.
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
