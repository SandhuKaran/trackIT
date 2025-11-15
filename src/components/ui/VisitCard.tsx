"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { uploadImage } from "@/lib/cloudinaryUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Visit, Feedback } from "@prisma/client"; // Import the Visit type for props

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/lib/trpc/server";

type VisitFromTRPC = inferRouterOutputs<AppRouter>["getVisits"][number];

// Define the props for our component
interface VisitCardProps {
  visit: VisitFromTRPC; // Use the new inferred type
}
export function VisitCard({ visit }: VisitCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const submitFeedback = trpc.submitFeedback.useMutation({
    onSuccess: () => {
      // This is the key: it re-fetches the server component's data
      // so the page updates to show the new feedback.
      router.refresh();
      setIsExpanded(false);
      setFeedback("");
      setFile(null);
    },
  });

  const handleSubmit = async () => {
    let photoUrl: string | undefined;

    // 1. Handle file upload if one exists
    if (file) {
      setIsUploading(true);
      try {
        photoUrl = await uploadImage(file);
      } catch (error) {
        console.error("Failed to upload feedback image", error);
        // TODO: Show an error message to the user (e.g., using toast)
        setIsUploading(false);
        return; // Stop submission
      }
      setIsUploading(false); // Done uploading
    }

    // 2. Mutate with the text and the new (optional) photoUrl
    submitFeedback.mutate({
      visitId: visit.id,
      feedback: feedback, // The text from state
      photoUrl: photoUrl, // This will be undefined or the Cloudinary URL
    });
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
        {visit.signedBy && (
          <p className="text-xs text-gray-400 pt-1">
            Signed by: {visit.signedBy}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* The original visit info */}
        <p className="whitespace-pre-wrap">{visit.note}</p>
        {visit.photos && visit.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {visit.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md overflow-hidden"
              >
                <img
                  src={photo.url.replace("/upload/", "/upload/w_400,c_fill/")}
                  alt="Visit photo"
                  className="w-full h-auto object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {/* --- THIS IS THE NEW FEEDBACK SECTION --- */}
        {visit.feedback ? (
          // 1. Feedback already exists: Display it
          <div className="pt-4 border-t border-gray-700 space-y-3">
            <p className="font-semibold text-white">Your Feedback:</p>
            <p className="text-gray-300 italic">{visit.feedback.text}</p>

            {/* --- THIS IS THE DISPLAY FOR THE NEW IMAGE --- */}
            {visit.feedback.photoUrl && (
              <a
                href={visit.feedback.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md overflow-hidden"
              >
                <img
                  src={visit.feedback.photoUrl.replace(
                    "/upload/",
                    "/upload/w_400,c_fill/"
                  )}
                  alt="Feedback photo"
                  className="w-full h-auto object-cover"
                />
              </a>
            )}
          </div>
        ) : isExpanded ? (
          // 2. Add Feedback form is expanded: Show form
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="How did we do? Let us know..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            {/* --- THIS IS THE NEW FILE INPUT --- */}
            <div className="grid gap-1.5">
              <Label htmlFor={`photo-upload-${visit.id}`}>
                Add Photo (Optional)
              </Label>
              <Input
                id={`photo-upload-${visit.id}`} // Unique ID per card
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {/* --- END OF NEW FILE INPUT --- */}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                disabled={submitFeedback.isPending || isUploading} // <-- MODIFIED
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                // MODIFIED: Disable button if uploading OR submitting
                disabled={
                  feedback.length < 3 || submitFeedback.isPending || isUploading
                }
              >
                {(submitFeedback.isPending || isUploading) && ( // <-- MODIFIED
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {/* MODIFIED: Show different loading text */}
                {isUploading
                  ? "Uploading..."
                  : submitFeedback.isPending
                  ? "Submitting..."
                  : "Submit"}
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
      </CardContent>
    </Card>
  );
}
