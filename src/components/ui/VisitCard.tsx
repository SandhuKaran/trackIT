"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Visit, Feedback } from "@prisma/client"; // Import the Visit type for props

type VisitWithFeedback = Visit & {
  feedback: Feedback | null; // The feedback property is now an object or null
};

// Define the props for our new component
interface VisitCardProps {
  visit: VisitWithFeedback; // We'll pass the full visit object
}

export function VisitCard({ visit }: VisitCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedback, setFeedback] = useState("");

  const submitFeedback = trpc.submitFeedback.useMutation({
    onSuccess: () => {
      // This is the key: it re-fetches the server component's data
      // so the page updates to show the new feedback.
      router.refresh();
      setIsExpanded(false);
    },
  });

  const handleSubmit = () => {
    submitFeedback.mutate({ visitId: visit.id, feedback });
  };

  return (
    <Card key={visit.id} className="shadow-xl">
      <CardHeader>
        <CardDescription>
          {new Intl.DateTimeFormat("en-CA", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(visit.date))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* The original visit info */}
        <p>{visit.note}</p>
        {visit.photoUrl && (
          <a
            href={visit.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden"
          >
            <img
              src={visit.photoUrl.replace("/upload/", "/upload/w_400,c_fill/")}
              alt="Visit photo"
              className="w-full h-auto object-cover"
            />
          </a>
        )}

        {/* --- THIS IS THE NEW FEEDBACK SECTION --- */}
        {visit.feedback ? (
          // 1. Feedback already exists: Display it
          <div className="pt-4 border-t border-gray-700">
            <p className="font-semibold text-white">Your Feedback:</p>
            <p className="text-gray-300 italic">{visit.feedback.text}</p>
          </div>
        ) : isExpanded ? (
          // 2. Add Feedback form is expanded: Show form
          <div className="space-y-2 pt-2">
            <Textarea
              placeholder="How did we do? Let us know..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={feedback.length < 3 || submitFeedback.isPending}
              >
                {submitFeedback.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </div>
          </div>
        ) : (
          // 3. No feedback yet: Show the "Add Feedback" button
          <CardFooter className="p-0 pt-4">
            <Button variant="outline" onClick={() => setIsExpanded(true)}>
              Add Feedback
            </Button>
          </CardFooter>
        )}
        {/* --- END OF FEEDBACK SECTION --- */}
      </CardContent>
    </Card>
  );
}
