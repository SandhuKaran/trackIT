"use client";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/cloudinaryUpload";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function AddRequest() {
  const router = useRouter();
  const createRequest = trpc.createRequest.useMutation({
    onSuccess: () => router.push("/timeline"), // Go back to timeline on success
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    let photoUrl: string | undefined;

    if (file) {
      setUploading(true);
      try {
        photoUrl = await uploadImage(file);
      } catch (error) {
        console.error("Failed to upload request image", error);
        setUploading(false);
        // TODO: Show user an error
        return;
      }
      setUploading(false);
    }

    createRequest.mutate({ title, description, photoUrl });
  }

  return (
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Add a New Request</CardTitle>
          <CardDescription>
            Let us know what you would like on a future visit.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title-input">Title / Subject</Label>
            <Input
              id="title-input"
              placeholder="e.g., 'Trim front bushes'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc-textarea">Description</Label>
            <Textarea
              id="desc-textarea"
              className="h-24"
              placeholder="Please describe the request in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photo-upload">Photo (Optional)</Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={
              title.length < 3 ||
              description.length < 5 ||
              createRequest.isPending ||
              uploading
            }
            onClick={handleSubmit}
          >
            {uploading
              ? "Uploading…"
              : createRequest.isPending
              ? "Saving…"
              : "Submit Request"}
          </Button>

          {createRequest.error && (
            <p className="text-red-600">{createRequest.error.message}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
