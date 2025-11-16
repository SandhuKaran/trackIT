"use client";
// NEW: Import useTransition
import React, { useTransition } from "react";
import type { Request } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RequestCardProps {
  request: Pick<
    Request,
    "id" | "title" | "description" | "photoUrl" | "createdAt" | "resolvedBy"
  >;
  isEditMode?: boolean;
  isDeleting?: boolean;
  onDelete?: () => void;
}

export function RequestCard({
  request,
  isEditMode,
  isDeleting,
  onDelete,
}: RequestCardProps) {
  const router = useRouter();
  // NEW: Set up the transition state
  const [isRefreshing, startTransition] = useTransition();
  const utils = trpc.useUtils();

  const resolveRequest = trpc.resolveRequest.useMutation({
    onSuccess: () => {
      startTransition(() => {
        // 1. Invalidate client-side queries (for pages like /employee/customer/[id])
        utils.getRequestsByCustomer.invalidate();
        // 2. Refresh server-side props (for pages like /timeline)
        router.refresh();
      });
    },
  });

  const isLoadingResolve = resolveRequest.isPending || isRefreshing;

  return (
    <Card key={request.id} className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{request.title}</CardTitle>
        {/* Fix 1: Add suppressHydrationWarning */}
        <CardDescription suppressHydrationWarning>
          Requested on:{" "}
          {new Intl.DateTimeFormat("en-CA", {
            dateStyle: "medium",
          }).format(new Date(request.createdAt))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{request.description}</p>
        {request.photoUrl && (
          <a
            href={request.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden"
          >
            <img
              src={request.photoUrl.replace(
                "/upload/",
                "/upload/w_400,c_fill/"
              )}
              alt="Request photo"
              className="w-full h-auto object-cover"
            />
          </a>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 items-start">
        {/* --- Resolve Section (Always Visible) --- */}
        {request.resolvedBy ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Resolved by {request.resolvedBy}
            </span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => resolveRequest.mutate({ requestId: request.id })}
            disabled={isLoadingResolve}
            className="w-full" // Make button full width
          >
            {isLoadingResolve && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Mark as resolved
          </Button>
        )}

        {/* --- Delete Section (Conditional) --- */}
        {isEditMode && (
          <div className="w-full pt-4 border-t border-gray-700">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete Request"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the request: {request.title}.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
