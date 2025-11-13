"use client"; // <-- Make sure this is a client component
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

interface RequestCardProps {
  // MODIFIED: Add resolvedBy
  request: Pick<
    Request,
    "id" | "title" | "description" | "photoUrl" | "createdAt" | "resolvedBy"
  >;
}

export function RequestCard({ request }: RequestCardProps) {
  const router = useRouter();
  const resolveRequest = trpc.resolveRequest.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <Card key={request.id} className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{request.title}</CardTitle>
        <CardDescription>
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

      <CardFooter>
        {request.resolvedBy ? (
          // 1. If resolved, show status
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Resolved by {request.resolvedBy}
            </span>
          </div>
        ) : (
          // 2. If not resolved, show button
          <Button
            variant="outline"
            size="sm"
            onClick={() => resolveRequest.mutate({ requestId: request.id })}
            disabled={resolveRequest.isPending}
          >
            {resolveRequest.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Mark as resolved
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
